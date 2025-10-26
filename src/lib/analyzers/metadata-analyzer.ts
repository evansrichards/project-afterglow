/**
 * Metadata Analyzer
 *
 * Extracts basic statistics about dating app activity with AI-powered insights.
 * Provides quick insights into volume, timeline, and activity distribution.
 * This runs BEFORE comprehensive AI analysis to give immediate context.
 */

import type OpenAI from 'openai'
import type { AnalyzerInput, MetadataAnalysisResult } from './types'
import { createOpenRouterClient } from '../ai/openrouter-client'
import { getOpenRouterApiKey, getOpenRouterSiteUrl, getOpenRouterAppName } from '../ai/config'

/**
 * Format a date as YYYY-MM for monthly grouping
 */
function formatMonth(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  return `${year}-${month}`
}

/**
 * Format a date range as a human-readable period
 */
function formatDateRange(start: Date, end: Date): string {
  const startMonth = start.toLocaleDateString('en-US', { year: 'numeric', month: 'short' })
  const endMonth = end.toLocaleDateString('en-US', { year: 'numeric', month: 'short' })
  return `${startMonth} to ${endMonth}`
}

/**
 * Calculate the number of days between two dates
 */
function daysBetween(start: Date, end: Date): number {
  const diffMs = end.getTime() - start.getTime()
  return Math.floor(diffMs / (1000 * 60 * 60 * 24))
}

/**
 * Calculate volume metrics
 */
function calculateVolumeMetrics(input: AnalyzerInput) {
  const totalMatches = input.matches.length
  const totalMessages = input.messages.length

  // Count messages by conversation (matchId)
  const messagesByMatch = new Map<string, number>()
  let messagesSentByUser = 0
  let messagesReceived = 0

  for (const message of input.messages) {
    const count = messagesByMatch.get(message.matchId) || 0
    messagesByMatch.set(message.matchId, count + 1)

    if (message.direction === 'user') {
      messagesSentByUser++
    } else {
      messagesReceived++
    }
  }

  // Count active conversations (5+ messages)
  const activeConversations = Array.from(messagesByMatch.values()).filter(
    count => count >= 5
  ).length

  // Calculate average messages per conversation
  const averageMessagesPerConversation =
    messagesByMatch.size > 0 ? totalMessages / messagesByMatch.size : 0

  return {
    totalMatches,
    totalMessages,
    activeConversations,
    averageMessagesPerConversation: Math.round(averageMessagesPerConversation * 10) / 10,
    messagesSentByUser,
    messagesReceived,
  }
}

/**
 * Timeline metrics type
 */
interface TimelineMetrics {
  firstActivity: string | null
  lastActivity: string | null
  totalDays: number
  daysSinceLastActivity: number
  peakActivityPeriod: string | null
}

/**
 * Calculate timeline metrics
 */
function calculateTimelineMetrics(input: AnalyzerInput): TimelineMetrics {
  // Find earliest and latest activity from both matches and messages
  const matchDates = input.matches.map(m => new Date(m.createdAt))
  const messageDates = input.messages.map(m => new Date(m.sentAt))
  const allDates = [...matchDates, ...messageDates]

  if (allDates.length === 0) {
    return {
      firstActivity: null,
      lastActivity: null,
      totalDays: 0,
      daysSinceLastActivity: 0,
      peakActivityPeriod: null,
    }
  }

  const validDates = allDates.filter(d => !isNaN(d.getTime()))

  if (validDates.length === 0) {
    return {
      firstActivity: null,
      lastActivity: null,
      totalDays: 0,
      daysSinceLastActivity: 0,
      peakActivityPeriod: null,
    }
  }

  const firstActivity = new Date(Math.min(...validDates.map(d => d.getTime())))
  const lastActivity = new Date(Math.max(...validDates.map(d => d.getTime())))
  const now = new Date()

  const totalDays = daysBetween(firstActivity, lastActivity)
  const daysSinceLastActivity = daysBetween(lastActivity, now)

  return {
    firstActivity: firstActivity.toISOString(),
    lastActivity: lastActivity.toISOString(),
    totalDays,
    daysSinceLastActivity,
    peakActivityPeriod: null, // Will be calculated in distribution
  }
}

/**
 * Calculate activity distribution over time
 */
function calculateActivityDistribution(input: AnalyzerInput) {
  // Group matches by month
  const matchesByMonth = new Map<string, number>()
  for (const match of input.matches) {
    const date = new Date(match.createdAt)
    if (!isNaN(date.getTime())) {
      const month = formatMonth(date)
      matchesByMonth.set(month, (matchesByMonth.get(month) || 0) + 1)
    }
  }

  // Group messages by month
  const messagesByMonth = new Map<string, number>()
  for (const message of input.messages) {
    const date = new Date(message.sentAt)
    if (!isNaN(date.getTime())) {
      const month = formatMonth(date)
      messagesByMonth.set(month, (messagesByMonth.get(month) || 0) + 1)
    }
  }

  // Convert to sorted arrays
  const matchesArray = Array.from(matchesByMonth.entries())
    .map(([month, count]) => ({ month, count }))
    .sort((a, b) => a.month.localeCompare(b.month))

  const messagesArray = Array.from(messagesByMonth.entries())
    .map(([month, count]) => ({ month, count }))
    .sort((a, b) => a.month.localeCompare(b.month))

  // Find peak activity period (consecutive 3-4 months with most activity)
  let peakActivityPeriod: string | null = null
  if (messagesArray.length >= 3) {
    // Use a sliding window to find the most active period
    let maxActivity = 0
    let peakStart = 0

    for (let i = 0; i <= messagesArray.length - 3; i++) {
      const windowActivity = messagesArray
        .slice(i, i + 4)
        .reduce((sum, item) => sum + item.count, 0)

      if (windowActivity > maxActivity) {
        maxActivity = windowActivity
        peakStart = i
      }
    }

    // Format the peak period
    const peakMonths = messagesArray.slice(peakStart, peakStart + 4)
    if (peakMonths.length >= 2) {
      const startDate = new Date(peakMonths[0].month + '-01')
      const endDate = new Date(peakMonths[peakMonths.length - 1].month + '-01')
      peakActivityPeriod = formatDateRange(startDate, endDate)
    }
  }

  return {
    matchesByMonth: matchesArray,
    messagesByMonth: messagesArray,
    peakActivityPeriod,
  }
}

/**
 * Generate human-readable summary
 */
function generateSummary(
  platform: string,
  timeline: TimelineMetrics
): string {
  if (!timeline.firstActivity || !timeline.lastActivity) {
    return `No activity data available for ${platform}`
  }

  const firstDate = new Date(timeline.firstActivity)
  const lastDate = new Date(timeline.lastActivity)

  const firstFormatted = firstDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
  })
  const lastFormatted = lastDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
  })

  const years = timeline.totalDays / 365
  const yearsFormatted = years >= 1 ? `${Math.round(years * 10) / 10} years` : `${Math.round(timeline.totalDays / 30)} months`

  return `You were active on ${platform} from ${firstFormatted} to ${lastFormatted} (${yearsFormatted})`
}

/**
 * Generate AI-powered natural language assessment
 */
async function generateAssessmentWithAI(
  client: OpenAI,
  platform: string,
  timeline: TimelineMetrics,
  volume: ReturnType<typeof calculateVolumeMetrics>,
  distribution: ReturnType<typeof calculateActivityDistribution>,
  dataExportedAt?: string
): Promise<string> {
  if (!timeline.firstActivity || !timeline.lastActivity) {
    return `No activity found on ${platform}. Please check your data export.`
  }

  // Build context for AI
  const context = {
    platform,
    timeline: {
      firstActivity: new Date(timeline.firstActivity).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
      }),
      lastActivity: new Date(timeline.lastActivity).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
      }),
      totalDays: timeline.totalDays,
      daysSinceLastActivity: timeline.daysSinceLastActivity,
      peakActivityPeriod: timeline.peakActivityPeriod,
    },
    volume: {
      totalMatches: volume.totalMatches,
      totalMessages: volume.totalMessages,
      activeConversations: volume.activeConversations,
      averageMessagesPerConversation: volume.averageMessagesPerConversation,
      messagesSentByUser: volume.messagesSentByUser,
      messagesReceived: volume.messagesReceived,
    },
  }

  // Calculate if data export is stale
  const dataExportInfo = dataExportedAt
    ? (() => {
        const exportDate = new Date(dataExportedAt)
        const daysSinceExport = Math.floor((Date.now() - exportDate.getTime()) / (1000 * 60 * 60 * 24))
        const exportDateFormatted = exportDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
        return { daysSinceExport, exportDateFormatted }
      })()
    : null

  const prompt = `You are analyzing dating app activity data. Generate a warm, insightful, 2-3 sentence natural language summary.

Data:
- Platform: ${context.platform}
- Active from ${context.timeline.firstActivity} to ${context.timeline.lastActivity}
- Total days active: ${context.timeline.totalDays}
- Most recent activity in data: ${context.timeline.lastActivity}${dataExportInfo ? `\n- Data was exported on: ${dataExportInfo.exportDateFormatted} (${dataExportInfo.daysSinceExport} days ago)` : ''}
- Peak activity period: ${context.timeline.peakActivityPeriod || 'N/A'}
- Total matches: ${context.volume.totalMatches}
- Total messages: ${context.volume.totalMessages}
- Active conversations (5+ messages): ${context.volume.activeConversations}
- Average messages per conversation: ${context.volume.averageMessagesPerConversation}
- Messages sent by user: ${context.volume.messagesSentByUser}
- Messages received: ${context.volume.messagesReceived}

Guidelines:
- Be warm and conversational, not robotic
- Focus on the most interesting insights${dataExportInfo && dataExportInfo.daysSinceExport > 30 ? '\n- IMPORTANT: The data export is from ' + dataExportInfo.exportDateFormatted + ', so activity may have occurred after that date. Note that the data snapshot is from that date.' : ''}
- Do NOT say things like "it's been X days since you last used the app" based on the most recent message timestamp - the user may have been active after the data export
- Instead, describe what the data snapshot shows (e.g., "In this data snapshot..." or "As of [export date]...")
- Highlight meaningful engagement (active conversations vs total matches)
- Keep it concise (2-3 sentences max)
- Don't use clinical language or jargon
- Make it feel like a friend is summarizing their data

Generate ONLY the assessment text, no preamble or explanation.`

  try {
    const response = await client.chat.completions.create({
      model: 'openai/gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 150,
    })

    const assessment = response.choices[0].message.content?.trim()
    return assessment || 'Unable to generate assessment at this time.'
  } catch (error) {
    console.error('❌ Failed to generate AI assessment:', error)
    // Fallback to simple text if AI fails
    return `You were active on ${platform} from ${context.timeline.firstActivity} to ${context.timeline.lastActivity}. We found ${context.volume.totalMatches} matches with ${context.volume.totalMessages} total messages.`
  }
}

/**
 * Analyze metadata from normalized dating app data
 *
 * @param input - Normalized data (messages, matches, participants, userId)
 * @param platform - Platform name (e.g., "Tinder", "Hinge")
 * @param dataExportedAt - Optional ISO timestamp when the data was exported/downloaded
 * @returns Metadata analysis result with volume, timeline, and distribution metrics
 */
export async function analyzeMetadata(
  input: AnalyzerInput,
  platform: string = 'Unknown',
  dataExportedAt?: string
): Promise<MetadataAnalysisResult> {
  // Calculate metrics
  const volume = calculateVolumeMetrics(input)
  const timeline = calculateTimelineMetrics(input)
  const distribution = calculateActivityDistribution(input)

  // Update timeline with peak activity period from distribution
  const timelineWithPeak = {
    ...timeline,
    peakActivityPeriod: distribution.peakActivityPeriod,
  }

  // Generate human-readable text
  const summary = generateSummary(platform, timelineWithPeak)

  // Create OpenAI client for AI-powered assessment
  const client = createOpenRouterClient({
    apiKey: getOpenRouterApiKey(),
    siteUrl: getOpenRouterSiteUrl(),
    appName: getOpenRouterAppName(),
  })
  const assessment = await generateAssessmentWithAI(client, platform, timelineWithPeak, volume, distribution, dataExportedAt)

  return {
    volume,
    timeline: timelineWithPeak,
    distribution,
    platform,
    summary,
    assessment,
  }
}
