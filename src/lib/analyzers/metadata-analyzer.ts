/**
 * Metadata Analyzer
 *
 * Extracts basic statistics about dating app activity without AI analysis.
 * Provides quick insights into volume, timeline, and activity distribution.
 * This runs BEFORE any AI analysis to give immediate context.
 */

import type { AnalyzerInput, MetadataAnalysisResult } from './types'

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
 * Generate human-readable assessment
 */
function generateAssessment(
  platform: string,
  timeline: TimelineMetrics,
  volume: ReturnType<typeof calculateVolumeMetrics>,
  distribution: ReturnType<typeof calculateActivityDistribution>
): string {
  if (!timeline.firstActivity || !timeline.lastActivity) {
    return `No activity found on ${platform}. Please check your data export.`
  }

  const daysSince = timeline.daysSinceLastActivity
  const totalMatches = volume.totalMatches
  const activeConvos = volume.activeConversations

  // Determine recency
  let recencyPhrase: string
  if (daysSince < 30) {
    recencyPhrase = 'very recently'
  } else if (daysSince < 90) {
    recencyPhrase = 'in the past few months'
  } else if (daysSince < 365) {
    recencyPhrase = 'within the past year'
  } else if (daysSince < 730) {
    recencyPhrase = 'about a year ago'
  } else {
    const yearsAgo = Math.floor(daysSince / 365)
    recencyPhrase = `about ${yearsAgo} years ago`
  }

  // Build assessment
  const parts: string[] = []

  // Recency statement
  if (daysSince >= 365) {
    parts.push(`It appears you haven't used ${platform} in a while`)
  } else if (daysSince >= 90) {
    parts.push(`You were active on ${platform} ${recencyPhrase}`)
  } else {
    parts.push(`You've been active on ${platform} ${recencyPhrase}`)
  }

  // Volume statement
  if (totalMatches > 0) {
    parts.push(`We found ${totalMatches} match${totalMatches === 1 ? '' : 'es'} to analyze`)

    if (activeConvos > 0) {
      const percentage = Math.round((activeConvos / totalMatches) * 100)
      parts.push(`with ${activeConvos} meaningful conversation${activeConvos === 1 ? '' : 's'} (${percentage}%)`)
    }
  }

  // Peak activity mention
  if (distribution.peakActivityPeriod && daysSince >= 365) {
    parts.push(`Your most active period was around ${distribution.peakActivityPeriod}`)
  }

  return parts.join(', ') + '.'
}

/**
 * Analyze metadata from normalized dating app data
 *
 * @param input - Normalized data (messages, matches, participants, userId)
 * @param platform - Platform name (e.g., "Tinder", "Hinge")
 * @returns Metadata analysis result with volume, timeline, and distribution metrics
 */
export function analyzeMetadata(
  input: AnalyzerInput,
  platform: string = 'Unknown'
): MetadataAnalysisResult {
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
  const assessment = generateAssessment(platform, timelineWithPeak, volume, distribution)

  return {
    volume,
    timeline: timelineWithPeak,
    distribution,
    platform,
    summary,
    assessment,
  }
}
