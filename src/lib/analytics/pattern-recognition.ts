/**
 * Pattern Recognition for Conversation Analysis
 *
 * Identifies common patterns in message imbalances and timing behaviors
 * to provide meaningful insights about conversation dynamics.
 */

import type { MessageCountMetrics, ResponseTimeMetrics } from '@/lib/metrics/basic-metrics'

/**
 * Message imbalance pattern types
 */
export type ImbalancePattern =
  | 'balanced'
  | 'slight_user_heavy'
  | 'slight_match_heavy'
  | 'user_dominated'
  | 'match_dominated'
  | 'monologue'

/**
 * Response timing pattern types
 */
export type TimingPattern =
  | 'instant_messaging'
  | 'active_conversation'
  | 'casual_chat'
  | 'slow_burn'
  | 'sporadic'
  | 'ghosting'

/**
 * Pattern recognition result for message imbalance
 */
export interface ImbalancePatternResult {
  /** Pattern type identified */
  pattern: ImbalancePattern
  /** Confidence score (0-1) */
  confidence: number
  /** Human-readable description */
  description: string
  /** Key metrics that led to this classification */
  indicators: {
    userRatio: number
    matchRatio: number
    balance: number
  }
}

/**
 * Pattern recognition result for response timing
 */
export interface TimingPatternResult {
  /** Pattern type identified */
  pattern: TimingPattern
  /** Confidence score (0-1) */
  confidence: number
  /** Human-readable description */
  description: string
  /** Key metrics that led to this classification */
  indicators: {
    averageResponseTime: number
    medianResponseTime: number
    sampleCount: number
  }
}

/**
 * Combined pattern recognition result
 */
export interface ConversationPatterns {
  /** Message imbalance pattern */
  imbalance: ImbalancePatternResult
  /** Response timing pattern (null if insufficient data) */
  timing: TimingPatternResult | null
}

/**
 * Recognize message imbalance patterns
 */
export function recognizeImbalancePattern(
  metrics: MessageCountMetrics
): ImbalancePatternResult {
  const { userRatio, matchRatio, balance } = metrics

  // Monologue: Only one person sent messages
  if (userRatio === 1 || matchRatio === 1) {
    return {
      pattern: 'monologue',
      confidence: 1.0,
      description:
        userRatio === 1
          ? 'One-sided conversation: only you sent messages'
          : 'One-sided conversation: only they sent messages',
      indicators: { userRatio, matchRatio, balance },
    }
  }

  // User dominated: 75%+ user messages
  if (userRatio >= 0.75) {
    return {
      pattern: 'user_dominated',
      confidence: Math.min(1.0, (userRatio - 0.75) * 4), // Scale 0.75-1.0 to 0-1
      description: 'You carried most of the conversation',
      indicators: { userRatio, matchRatio, balance },
    }
  }

  // Match dominated: 75%+ match messages
  if (matchRatio >= 0.75) {
    return {
      pattern: 'match_dominated',
      confidence: Math.min(1.0, (matchRatio - 0.75) * 4),
      description: 'They carried most of the conversation',
      indicators: { userRatio, matchRatio, balance },
    }
  }

  // Slight user heavy: 60-75% user messages
  if (userRatio >= 0.6) {
    return {
      pattern: 'slight_user_heavy',
      confidence: 0.7,
      description: 'You sent a bit more than they did',
      indicators: { userRatio, matchRatio, balance },
    }
  }

  // Slight match heavy: 60-75% match messages
  if (matchRatio >= 0.6) {
    return {
      pattern: 'slight_match_heavy',
      confidence: 0.7,
      description: 'They sent a bit more than you did',
      indicators: { userRatio, matchRatio, balance },
    }
  }

  // Balanced: Neither party dominates
  return {
    pattern: 'balanced',
    confidence: balance * 2, // balance is 0-0.5, scale to 0-1
    description: 'Balanced back-and-forth exchange',
    indicators: { userRatio, matchRatio, balance },
  }
}

/**
 * Recognize response timing patterns
 */
export function recognizeTimingPattern(
  metrics: ResponseTimeMetrics
): TimingPatternResult {
  const { averageResponseTime, medianResponseTime, sampleCount } = metrics

  // Convert to hours for easier thresholds
  const avgHours = averageResponseTime / (1000 * 60 * 60)

  // Low confidence if very few samples
  const sampleConfidence = Math.min(1.0, sampleCount / 5)

  // Instant messaging: avg < 5 minutes
  if (avgHours < 5 / 60) {
    return {
      pattern: 'instant_messaging',
      confidence: sampleConfidence,
      description: 'Real-time conversation with instant replies',
      indicators: { averageResponseTime, medianResponseTime, sampleCount },
    }
  }

  // Active conversation: avg < 1 hour
  if (avgHours < 1) {
    return {
      pattern: 'active_conversation',
      confidence: sampleConfidence,
      description: 'Active back-and-forth with quick responses',
      indicators: { averageResponseTime, medianResponseTime, sampleCount },
    }
  }

  // Casual chat: avg 1-6 hours
  if (avgHours < 6) {
    return {
      pattern: 'casual_chat',
      confidence: sampleConfidence,
      description: 'Casual conversation with responses throughout the day',
      indicators: { averageResponseTime, medianResponseTime, sampleCount },
    }
  }

  // Slow burn: avg 6-48 hours
  if (avgHours < 48) {
    return {
      pattern: 'slow_burn',
      confidence: sampleConfidence,
      description: 'Slow-paced conversation with daily check-ins',
      indicators: { averageResponseTime, medianResponseTime, sampleCount },
    }
  }

  // Sporadic: avg 2-7 days
  if (avgHours < 168) {
    // 7 days
    return {
      pattern: 'sporadic',
      confidence: sampleConfidence,
      description: 'Sporadic replies with multi-day gaps',
      indicators: { averageResponseTime, medianResponseTime, sampleCount },
    }
  }

  // Ghosting: avg 7+ days
  return {
    pattern: 'ghosting',
    confidence: sampleConfidence,
    description: 'Very long gaps between messages',
    indicators: { averageResponseTime, medianResponseTime, sampleCount },
  }
}

/**
 * Recognize all conversation patterns
 */
export function recognizeConversationPatterns(
  messageMetrics: MessageCountMetrics,
  timingMetrics?: ResponseTimeMetrics
): ConversationPatterns {
  return {
    imbalance: recognizeImbalancePattern(messageMetrics),
    timing: timingMetrics ? recognizeTimingPattern(timingMetrics) : null,
  }
}

/**
 * Batch pattern recognition across multiple conversations
 */
export interface BatchPatternAnalysis {
  /** Total conversations analyzed */
  totalConversations: number
  /** Imbalance pattern distribution */
  imbalanceDistribution: Record<ImbalancePattern, number>
  /** Timing pattern distribution */
  timingDistribution: Record<TimingPattern, number>
  /** Most common imbalance pattern */
  mostCommonImbalance: ImbalancePattern
  /** Most common timing pattern */
  mostCommonTiming: TimingPattern | null
}

/**
 * Analyze patterns across multiple conversations
 */
export function analyzeBatchPatterns(
  conversations: Array<{
    messageMetrics: MessageCountMetrics
    timingMetrics?: ResponseTimeMetrics
  }>
): BatchPatternAnalysis {
  const imbalanceDistribution: Record<ImbalancePattern, number> = {
    balanced: 0,
    slight_user_heavy: 0,
    slight_match_heavy: 0,
    user_dominated: 0,
    match_dominated: 0,
    monologue: 0,
  }

  const timingDistribution: Record<TimingPattern, number> = {
    instant_messaging: 0,
    active_conversation: 0,
    casual_chat: 0,
    slow_burn: 0,
    sporadic: 0,
    ghosting: 0,
  }

  for (const conv of conversations) {
    const patterns = recognizeConversationPatterns(
      conv.messageMetrics,
      conv.timingMetrics
    )

    imbalanceDistribution[patterns.imbalance.pattern]++

    if (patterns.timing) {
      timingDistribution[patterns.timing.pattern]++
    }
  }

  // Find most common patterns
  const mostCommonImbalance = (
    Object.entries(imbalanceDistribution) as Array<[ImbalancePattern, number]>
  ).reduce((a, b) => (b[1] > a[1] ? b : a))[0]

  const timingEntries = Object.entries(timingDistribution) as Array<
    [TimingPattern, number]
  >
  const mostCommonTiming =
    timingEntries.some(([, count]) => count > 0)
      ? timingEntries.reduce((a, b) => (b[1] > a[1] ? b : a))[0]
      : null

  return {
    totalConversations: conversations.length,
    imbalanceDistribution,
    timingDistribution,
    mostCommonImbalance,
    mostCommonTiming,
  }
}

/**
 * Get friendly label for imbalance pattern
 */
export function getImbalancePatternLabel(pattern: ImbalancePattern): string {
  const labels: Record<ImbalancePattern, string> = {
    balanced: 'Balanced',
    slight_user_heavy: 'Slightly You-Heavy',
    slight_match_heavy: 'Slightly Them-Heavy',
    user_dominated: 'You-Dominated',
    match_dominated: 'Them-Dominated',
    monologue: 'One-Sided',
  }
  return labels[pattern]
}

/**
 * Get friendly label for timing pattern
 */
export function getTimingPatternLabel(pattern: TimingPattern): string {
  const labels: Record<TimingPattern, string> = {
    instant_messaging: 'Instant',
    active_conversation: 'Active',
    casual_chat: 'Casual',
    slow_burn: 'Slow Burn',
    sporadic: 'Sporadic',
    ghosting: 'Distant',
  }
  return labels[pattern]
}

/**
 * Check if a pattern indicates potential concern
 */
export function isPatternConcerning(patterns: ConversationPatterns): boolean {
  // Concerning patterns:
  // - Monologue (one-sided)
  // - User dominated (you're carrying the conversation)
  // - Ghosting timing (very long gaps)

  if (patterns.imbalance.pattern === 'monologue') return true
  if (patterns.imbalance.pattern === 'user_dominated') return true
  if (patterns.timing?.pattern === 'ghosting') return true

  return false
}

/**
 * Get insight suggestion based on patterns
 */
export function getPatternInsight(patterns: ConversationPatterns): string {
  const { imbalance, timing } = patterns

  // Monologue patterns
  if (imbalance.pattern === 'monologue') {
    return imbalance.description

  }

  // Dominated patterns
  if (imbalance.pattern === 'user_dominated') {
    return 'You might be putting in more effort than they are'
  }

  if (imbalance.pattern === 'match_dominated') {
    return 'They seem more engaged in the conversation'
  }

  // Balanced with timing context
  if (imbalance.pattern === 'balanced') {
    if (timing?.pattern === 'instant_messaging') {
      return 'Great connection with instant back-and-forth'
    }
    if (timing?.pattern === 'active_conversation') {
      return 'Active and balanced conversation'
    }
    if (timing?.pattern === 'ghosting') {
      return 'Balanced messages but with long gaps between replies'
    }
    return 'Well-balanced conversation'
  }

  // Slight imbalance
  if (imbalance.pattern === 'slight_user_heavy') {
    return 'You initiated slightly more, but the conversation flows well'
  }

  if (imbalance.pattern === 'slight_match_heavy') {
    return 'They initiated slightly more, showing good interest'
  }

  return 'Mixed conversation pattern'
}
