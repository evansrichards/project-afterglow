/**
 * Core Analytics Metrics
 *
 * High-level analytics functions that combine message processing utilities
 * and basic metrics to provide insights across conversations.
 *
 * Implements the 3 core metrics for MVP:
 * 1. Message volume balance (ratio of user to match messages per conversation)
 * 2. Response timing patterns (average response times between exchanges)
 * 3. Conversation length distribution (number of messages per conversation)
 */

import type { NormalizedMessage } from '@/types/data-model'
import { groupMessagesByMatch } from './message-processing'
import {
  calculateMessageCounts,
  calculateResponseTimes,
  calculateConversationLength,
  type MessageCountMetrics,
  type ResponseTimeMetrics,
  type ConversationLengthMetrics,
} from '@/lib/metrics/basic-metrics'

/**
 * Message volume balance across all conversations
 */
export interface MessageVolumeBalance {
  /** Total conversations analyzed */
  conversationCount: number
  /** Average balance score across all conversations (0.5 = balanced) */
  averageBalance: number
  /** Distribution of balance scores */
  balanceDistribution: {
    /** Number of balanced conversations (balance >= 0.4) */
    balanced: number
    /** Number of slightly imbalanced conversations (0.25 <= balance < 0.4) */
    slightlyImbalanced: number
    /** Number of heavily imbalanced conversations (balance < 0.25) */
    heavilyImbalanced: number
  }
  /** User-dominated conversations (userRatio >= 0.6) */
  userDominatedCount: number
  /** Match-dominated conversations (matchRatio >= 0.6) */
  matchDominatedCount: number
  /** Per-conversation details */
  conversations: Array<{
    matchId: string
    metrics: MessageCountMetrics
  }>
}

/**
 * Response timing patterns across all conversations
 */
export interface ResponseTimingPatterns {
  /** Total conversations with response data */
  conversationCount: number
  /** Overall average response time (ms) */
  overallAverageResponseTime: number
  /** Overall median response time (ms) */
  overallMedianResponseTime: number
  /** Fastest conversation (lowest average response time) */
  fastestConversation: {
    matchId: string
    averageResponseTime: number
  } | null
  /** Slowest conversation (highest average response time) */
  slowestConversation: {
    matchId: string
    averageResponseTime: number
  } | null
  /** Distribution by response speed category */
  speedDistribution: {
    /** Very fast: avg < 1 hour */
    veryFast: number
    /** Fast: 1 hour <= avg < 6 hours */
    fast: number
    /** Moderate: 6 hours <= avg < 24 hours */
    moderate: number
    /** Slow: 24 hours <= avg < 3 days */
    slow: number
    /** Very slow: avg >= 3 days */
    verySlow: number
  }
  /** Average user response time across all conversations */
  averageUserResponseTime: number
  /** Average match response time across all conversations */
  averageMatchResponseTime: number
  /** Per-conversation details */
  conversations: Array<{
    matchId: string
    metrics: ResponseTimeMetrics
  }>
}

/**
 * Conversation length distribution across all conversations
 */
export interface ConversationLengthDistribution {
  /** Total conversations analyzed */
  conversationCount: number
  /** Average number of messages per conversation */
  averageMessageCount: number
  /** Median number of messages per conversation */
  medianMessageCount: number
  /** Shortest conversation (message count) */
  shortestConversation: {
    matchId: string
    messageCount: number
  } | null
  /** Longest conversation (message count) */
  longestConversation: {
    matchId: string
    messageCount: number
  } | null
  /** Distribution by conversation length category */
  lengthDistribution: {
    /** Very short: 1-5 messages */
    veryShort: number
    /** Short: 6-20 messages */
    short: number
    /** Medium: 21-50 messages */
    medium: number
    /** Long: 51-100 messages */
    long: number
    /** Very long: 100+ messages */
    veryLong: number
  }
  /** Average conversation duration (ms) */
  averageDuration: number
  /** Median conversation duration (ms) */
  medianDuration: number
  /** Per-conversation details */
  conversations: Array<{
    matchId: string
    metrics: ConversationLengthMetrics
  }>
}

/**
 * Calculate message volume balance across all conversations
 */
export function analyzeMessageVolumeBalance(
  messages: NormalizedMessage[]
): MessageVolumeBalance {
  const grouped = groupMessagesByMatch(messages)
  const conversations: Array<{ matchId: string; metrics: MessageCountMetrics }> = []

  let totalBalance = 0
  let balancedCount = 0
  let slightlyImbalancedCount = 0
  let heavilyImbalancedCount = 0
  let userDominatedCount = 0
  let matchDominatedCount = 0

  for (const [matchId, matchMessages] of grouped) {
    const metrics = calculateMessageCounts(matchMessages)
    conversations.push({ matchId, metrics })

    totalBalance += metrics.balance

    // Categorize by balance
    if (metrics.balance >= 0.4) {
      balancedCount++
    } else if (metrics.balance >= 0.25) {
      slightlyImbalancedCount++
    } else {
      heavilyImbalancedCount++
    }

    // Track domination
    if (metrics.userRatio >= 0.6) {
      userDominatedCount++
    }
    if (metrics.matchRatio >= 0.6) {
      matchDominatedCount++
    }
  }

  const conversationCount = conversations.length

  return {
    conversationCount,
    averageBalance: conversationCount > 0 ? totalBalance / conversationCount : 0,
    balanceDistribution: {
      balanced: balancedCount,
      slightlyImbalanced: slightlyImbalancedCount,
      heavilyImbalanced: heavilyImbalancedCount,
    },
    userDominatedCount,
    matchDominatedCount,
    conversations,
  }
}

/**
 * Analyze response timing patterns across all conversations
 */
export function analyzeResponseTimingPatterns(
  messages: NormalizedMessage[]
): ResponseTimingPatterns {
  const grouped = groupMessagesByMatch(messages)
  const conversations: Array<{ matchId: string; metrics: ResponseTimeMetrics }> = []

  let totalResponseTime = 0
  let totalUserResponseTime = 0
  let totalMatchResponseTime = 0
  const allResponseTimes: number[] = []

  let veryFastCount = 0
  let fastCount = 0
  let moderateCount = 0
  let slowCount = 0
  let verySlowCount = 0

  let fastestConv: { matchId: string; averageResponseTime: number } | null = null
  let slowestConv: { matchId: string; averageResponseTime: number } | null = null

  for (const [matchId, matchMessages] of grouped) {
    const metrics = calculateResponseTimes(matchMessages)
    if (!metrics) continue // Skip conversations without response data

    conversations.push({ matchId, metrics })

    totalResponseTime += metrics.averageResponseTime
    totalUserResponseTime += metrics.averageUserResponse
    totalMatchResponseTime += metrics.averageMatchResponse
    allResponseTimes.push(metrics.averageResponseTime)

    // Track fastest/slowest
    if (!fastestConv || metrics.averageResponseTime < fastestConv.averageResponseTime) {
      fastestConv = { matchId, averageResponseTime: metrics.averageResponseTime }
    }
    if (!slowestConv || metrics.averageResponseTime > slowestConv.averageResponseTime) {
      slowestConv = { matchId, averageResponseTime: metrics.averageResponseTime }
    }

    // Categorize by speed
    const avgHours = metrics.averageResponseTime / (1000 * 60 * 60)
    if (avgHours < 1) {
      veryFastCount++
    } else if (avgHours < 6) {
      fastCount++
    } else if (avgHours < 24) {
      moderateCount++
    } else if (avgHours < 72) {
      slowCount++
    } else {
      verySlowCount++
    }
  }

  const conversationCount = conversations.length

  // Calculate overall median
  const sortedTimes = allResponseTimes.sort((a, b) => a - b)
  const overallMedianResponseTime =
    sortedTimes.length === 0
      ? 0
      : sortedTimes.length % 2 === 0
        ? (sortedTimes[sortedTimes.length / 2 - 1] + sortedTimes[sortedTimes.length / 2]) / 2
        : sortedTimes[Math.floor(sortedTimes.length / 2)]

  return {
    conversationCount,
    overallAverageResponseTime:
      conversationCount > 0 ? totalResponseTime / conversationCount : 0,
    overallMedianResponseTime,
    fastestConversation: fastestConv,
    slowestConversation: slowestConv,
    speedDistribution: {
      veryFast: veryFastCount,
      fast: fastCount,
      moderate: moderateCount,
      slow: slowCount,
      verySlow: verySlowCount,
    },
    averageUserResponseTime:
      conversationCount > 0 ? totalUserResponseTime / conversationCount : 0,
    averageMatchResponseTime:
      conversationCount > 0 ? totalMatchResponseTime / conversationCount : 0,
    conversations,
  }
}

/**
 * Analyze conversation length distribution across all conversations
 */
export function analyzeConversationLengthDistribution(
  messages: NormalizedMessage[]
): ConversationLengthDistribution {
  const grouped = groupMessagesByMatch(messages)
  const conversations: Array<{ matchId: string; metrics: ConversationLengthMetrics }> = []

  let totalMessageCount = 0
  let totalDuration = 0
  const allMessageCounts: number[] = []
  const allDurations: number[] = []

  let veryShortCount = 0
  let shortCount = 0
  let mediumCount = 0
  let longCount = 0
  let veryLongCount = 0

  let shortestConv: { matchId: string; messageCount: number } | null = null
  let longestConv: { matchId: string; messageCount: number } | null = null

  for (const [matchId, matchMessages] of grouped) {
    const metrics = calculateConversationLength(matchMessages)
    conversations.push({ matchId, metrics })

    totalMessageCount += metrics.messageCount
    totalDuration += metrics.duration
    allMessageCounts.push(metrics.messageCount)
    allDurations.push(metrics.duration)

    // Track shortest/longest
    if (!shortestConv || metrics.messageCount < shortestConv.messageCount) {
      shortestConv = { matchId, messageCount: metrics.messageCount }
    }
    if (!longestConv || metrics.messageCount > longestConv.messageCount) {
      longestConv = { matchId, messageCount: metrics.messageCount }
    }

    // Categorize by length
    if (metrics.messageCount <= 5) {
      veryShortCount++
    } else if (metrics.messageCount <= 20) {
      shortCount++
    } else if (metrics.messageCount <= 50) {
      mediumCount++
    } else if (metrics.messageCount <= 100) {
      longCount++
    } else {
      veryLongCount++
    }
  }

  const conversationCount = conversations.length

  // Calculate median message count
  const sortedCounts = allMessageCounts.sort((a, b) => a - b)
  const medianMessageCount =
    sortedCounts.length === 0
      ? 0
      : sortedCounts.length % 2 === 0
        ? (sortedCounts[sortedCounts.length / 2 - 1] + sortedCounts[sortedCounts.length / 2]) / 2
        : sortedCounts[Math.floor(sortedCounts.length / 2)]

  // Calculate median duration
  const sortedDurations = allDurations.sort((a, b) => a - b)
  const medianDuration =
    sortedDurations.length === 0
      ? 0
      : sortedDurations.length % 2 === 0
        ? (sortedDurations[sortedDurations.length / 2 - 1] +
            sortedDurations[sortedDurations.length / 2]) /
          2
        : sortedDurations[Math.floor(sortedDurations.length / 2)]

  return {
    conversationCount,
    averageMessageCount: conversationCount > 0 ? totalMessageCount / conversationCount : 0,
    medianMessageCount,
    shortestConversation: shortestConv,
    longestConversation: longestConv,
    lengthDistribution: {
      veryShort: veryShortCount,
      short: shortCount,
      medium: mediumCount,
      long: longCount,
      veryLong: veryLongCount,
    },
    averageDuration: conversationCount > 0 ? totalDuration / conversationCount : 0,
    medianDuration,
    conversations,
  }
}

/**
 * Combined core metrics analysis
 */
export interface CoreMetricsAnalysis {
  /** Message volume balance analysis */
  volumeBalance: MessageVolumeBalance
  /** Response timing patterns analysis */
  timingPatterns: ResponseTimingPatterns
  /** Conversation length distribution analysis */
  lengthDistribution: ConversationLengthDistribution
}

/**
 * Analyze all core metrics for a dataset
 */
export function analyzeCoreMetrics(messages: NormalizedMessage[]): CoreMetricsAnalysis {
  return {
    volumeBalance: analyzeMessageVolumeBalance(messages),
    timingPatterns: analyzeResponseTimingPatterns(messages),
    lengthDistribution: analyzeConversationLengthDistribution(messages),
  }
}
