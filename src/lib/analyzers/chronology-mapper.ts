/**
 * Chronology Mapper Analyzer
 *
 * Foundation analyzer that analyzes patterns over time with recent weighting.
 * Uses GPT-4 Turbo for sophisticated temporal pattern analysis.
 * Escalates to Growth Evaluator if 18+ months of data with evolution detected.
 */

import type OpenAI from 'openai'
import type { AnalyzerInput, ChronologyMapperOutput } from './types'
import { createOpenRouterClient } from '../ai/openrouter-client'
import { getOpenRouterApiKey, getOpenRouterSiteUrl, getOpenRouterAppName } from '../ai/config'

/**
 * Chronology mapping configuration
 */
const CHRONOLOGY_MAPPER_CONFIG = {
  /** Model to use for chronological analysis */
  model: 'openai/gpt-4-turbo',
  /** Temperature for nuanced temporal analysis */
  temperature: 0.4,
  /** Minimum months of data to trigger Growth Evaluator */
  minMonthsForGrowth: 18,
}

/**
 * Time segment definition
 */
interface TimeSegment {
  label: string
  startDate: string
  endDate: string
  weight: number
  messages: Array<{ date: string; sender: string; body: string }>
}

/**
 * Calculate time range from messages
 */
function calculateTimeRange(messages: AnalyzerInput['messages']): {
  earliest: string
  latest: string
  durationMonths: number
} {
  if (messages.length === 0) {
    const now = new Date().toISOString()
    return { earliest: now, latest: now, durationMonths: 0 }
  }

  const timestamps = messages.map((m) => new Date(m.sentAt).getTime())
  const earliest = new Date(Math.min(...timestamps)).toISOString()
  const latest = new Date(Math.max(...timestamps)).toISOString()

  const durationMs = Math.max(...timestamps) - Math.min(...timestamps)
  const durationMonths = Math.round(durationMs / (30 * 24 * 60 * 60 * 1000))

  return { earliest, latest, durationMonths }
}

/**
 * Segment messages by time periods with weighting
 * Recent periods get higher weights
 */
function segmentMessagesByTime(input: AnalyzerInput): TimeSegment[] {
  const { messages } = input
  if (messages.length === 0) return []

  const now = Date.now()
  const sixMonthsAgo = now - 6 * 30 * 24 * 60 * 60 * 1000
  const twelveMonthsAgo = now - 12 * 30 * 24 * 60 * 60 * 1000
  const eighteenMonthsAgo = now - 18 * 30 * 24 * 60 * 60 * 1000

  const segments: TimeSegment[] = []

  // Segment 1: Last 6 months (highest weight)
  const last6Months = messages.filter((m) => new Date(m.sentAt).getTime() >= sixMonthsAgo)
  if (last6Months.length > 0) {
    segments.push({
      label: 'Last 6 months',
      startDate: new Date(sixMonthsAgo).toISOString(),
      endDate: new Date(now).toISOString(),
      weight: 1.0,
      messages: last6Months.map((m) => ({
        date: m.sentAt,
        sender: m.direction === 'user' ? 'User' : 'Match',
        body: m.body,
      })),
    })
  }

  // Segment 2: 6-12 months ago (medium weight)
  const months6to12 = messages.filter((m) => {
    const time = new Date(m.sentAt).getTime()
    return time >= twelveMonthsAgo && time < sixMonthsAgo
  })
  if (months6to12.length > 0) {
    segments.push({
      label: '6-12 months ago',
      startDate: new Date(twelveMonthsAgo).toISOString(),
      endDate: new Date(sixMonthsAgo).toISOString(),
      weight: 0.6,
      messages: months6to12.map((m) => ({
        date: m.sentAt,
        sender: m.direction === 'user' ? 'User' : 'Match',
        body: m.body,
      })),
    })
  }

  // Segment 3: 12-18 months ago (lower weight)
  const months12to18 = messages.filter((m) => {
    const time = new Date(m.sentAt).getTime()
    return time >= eighteenMonthsAgo && time < twelveMonthsAgo
  })
  if (months12to18.length > 0) {
    segments.push({
      label: '12-18 months ago',
      startDate: new Date(eighteenMonthsAgo).toISOString(),
      endDate: new Date(twelveMonthsAgo).toISOString(),
      weight: 0.3,
      messages: months12to18.map((m) => ({
        date: m.sentAt,
        sender: m.direction === 'user' ? 'User' : 'Match',
        body: m.body,
      })),
    })
  }

  // Segment 4: 18+ months ago (lowest weight)
  const olderThan18 = messages.filter((m) => {
    const time = new Date(m.sentAt).getTime()
    return time < eighteenMonthsAgo
  })
  if (olderThan18.length > 0) {
    const earliestTime = Math.min(...olderThan18.map((m) => new Date(m.sentAt).getTime()))
    segments.push({
      label: '18+ months ago',
      startDate: new Date(earliestTime).toISOString(),
      endDate: new Date(eighteenMonthsAgo).toISOString(),
      weight: 0.1,
      messages: olderThan18.map((m) => ({
        date: m.sentAt,
        sender: m.direction === 'user' ? 'User' : 'Match',
        body: m.body,
      })),
    })
  }

  return segments
}

/**
 * Format segments for AI prompt
 */
function formatSegmentsForPrompt(segments: TimeSegment[]): string {
  return segments
    .map((segment) => {
      const messageSample = segment.messages
        .slice(0, 50) // Sample first 50 messages per segment
        .map((m) => `[${m.date.split('T')[0]}] ${m.sender}: ${m.body}`)
        .join('\n')

      return `## ${segment.label} (Weight: ${segment.weight}, ${segment.messages.length} messages)
${messageSample}
${segment.messages.length > 50 ? `... and ${segment.messages.length - 50} more messages` : ''}`
    })
    .join('\n\n')
}

/**
 * Analyze chronological patterns using GPT-4 Turbo
 */
async function analyzeChronology(
  client: OpenAI,
  segments: TimeSegment[],
  timeRange: ChronologyMapperOutput['timeRange']
): Promise<{
  segmentAnalysis: Array<{ label: string; patterns: string[] }>
  growth: ChronologyMapperOutput['growth']
  lifeStageContext: ChronologyMapperOutput['lifeStageContext']
  summary: string
}> {
  const prompt = `You are a relationship development expert specializing in temporal pattern analysis. Analyze these dating app messages segmented by time period to identify growth, changes, and evolution patterns.

Time Range: ${timeRange.earliest.split('T')[0]} to ${timeRange.latest.split('T')[0]} (${timeRange.durationMonths} months)

Message Segments (most recent weighted more heavily):
${formatSegmentsForPrompt(segments)}

Conduct a chronological analysis focusing on:

1. TEMPORAL PATTERNS BY SEGMENT:
   For each time segment, identify:
   - Communication style in that period
   - Attachment behaviors during that time
   - Notable patterns or themes
   - Any significant changes from previous segments

2. GROWTH TRAJECTORY:
   - Is there evidence of personal growth or evolution over time?
   - Direction of change: improving, declining, or stable?
   - Specific areas of growth (e.g., better boundaries, more vulnerability, healthier patterns)
   - Concrete examples of evolution

3. LIFE STAGE CONTEXT:
   - Any life transitions mentioned (job changes, moves, breakups, personal events)?
   - Major life events that might explain pattern changes?
   - Context that helps understand the trajectory

Important:
- Weight recent segments (last 6 months) more heavily in your overall assessment
- Look for genuine evolution vs. temporary changes
- Only mark growth as "detected" if there's clear evidence of sustained improvement
- Consider whether changes are circumstantial or developmental

Respond in JSON format:
{
  "segmentAnalysis": [
    {
      "label": "segment label",
      "patterns": ["pattern 1", "pattern 2", "pattern 3"]
    }
  ],
  "growth": {
    "detected": true|false,
    "direction": "improving|declining|stable",
    "areas": ["area 1", "area 2"],
    "evidence": ["evidence 1", "evidence 2"]
  },
  "lifeStageContext": {
    "transitions": ["transition 1", "transition 2"],
    "events": ["event 1", "event 2"]
  },
  "summary": "brief chronological summary highlighting key evolution and time-based insights"
}`

  const response = await client.chat.completions.create({
    model: CHRONOLOGY_MAPPER_CONFIG.model,
    messages: [{ role: 'user', content: prompt }],
    temperature: CHRONOLOGY_MAPPER_CONFIG.temperature,
    response_format: { type: 'json_object' },
    stream: false,
  })

  const content = response.choices[0].message.content || '{}'
  const result = JSON.parse(content)

  return {
    segmentAnalysis: result.segmentAnalysis || [],
    growth: result.growth || {
      detected: false,
      direction: 'stable',
      areas: [],
      evidence: [],
    },
    lifeStageContext: result.lifeStageContext || {
      transitions: [],
      events: [],
    },
    summary: result.summary || 'Chronological analysis completed',
  }
}

/**
 * Determine if Growth Evaluator should be triggered
 */
function shouldEscalateToGrowthEvaluator(
  durationMonths: number,
  growth: ChronologyMapperOutput['growth']
): boolean {
  // Only trigger if we have 18+ months of data
  if (durationMonths < CHRONOLOGY_MAPPER_CONFIG.minMonthsForGrowth) {
    return false
  }

  // Only trigger if growth was detected
  if (!growth.detected) {
    return false
  }

  // Trigger if improving or has specific growth areas
  if (growth.direction === 'improving' || growth.areas.length > 0) {
    return true
  }

  return false
}

/**
 * Run Chronology Mapper Analyzer
 *
 * @param input - Normalized dataset to analyze
 * @returns Chronological analysis with growth trajectory and escalation flags
 */
export async function runChronologyMapper(
  input: AnalyzerInput
): Promise<ChronologyMapperOutput> {
  const startTime = Date.now()

  // 1. Calculate time range
  const timeRange = calculateTimeRange(input.messages)

  // 2. Segment messages by time with weighting
  const timeSegments = segmentMessagesByTime(input)

  // 3. Create OpenRouter client
  const client = createOpenRouterClient({
    apiKey: getOpenRouterApiKey(),
    siteUrl: getOpenRouterSiteUrl(),
    appName: getOpenRouterAppName(),
  })

  // 4. Analyze chronological patterns with AI
  const aiResult = await analyzeChronology(client, timeSegments, timeRange)

  // 5. Build output segments with patterns
  const outputSegments = timeSegments.map((segment) => {
    const analysis = aiResult.segmentAnalysis.find((a) => a.label === segment.label)
    return {
      label: segment.label,
      startDate: segment.startDate,
      endDate: segment.endDate,
      weight: segment.weight,
      patterns: analysis?.patterns || [],
    }
  })

  // 6. Determine escalation
  const escalateToGrowthEvaluator = shouldEscalateToGrowthEvaluator(
    timeRange.durationMonths,
    aiResult.growth
  )

  const endTime = Date.now()

  // Calculate total message content for cost estimation
  const totalContent = timeSegments
    .flatMap((s) => s.messages.map((m) => m.body))
    .join('')

  return {
    analyzer: 'chronology-mapper',
    timeRange,
    segments: outputSegments,
    growth: aiResult.growth,
    lifeStageContext: aiResult.lifeStageContext,
    escalateToGrowthEvaluator,
    summary: aiResult.summary,
    metadata: {
      analyzedAt: new Date().toISOString(),
      durationMs: endTime - startTime,
      model: CHRONOLOGY_MAPPER_CONFIG.model,
      // Estimate tokens (rough approximation)
      tokensUsed: {
        input: totalContent.length / 4,
        output: 1000,
      },
      // Estimate cost for GPT-4 Turbo ($0.01/1K input, $0.03/1K output)
      costUsd: (totalContent.length / 4 / 1000) * 0.01 + (1000 / 1000) * 0.03,
    },
  }
}

/**
 * Export for testing
 */
export const _testing = {
  calculateTimeRange,
  segmentMessagesByTime,
  shouldEscalateToGrowthEvaluator,
  CHRONOLOGY_MAPPER_CONFIG,
}
