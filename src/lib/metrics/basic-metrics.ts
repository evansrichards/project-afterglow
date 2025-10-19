/**
 * Basic Metrics Calculations
 *
 * Simple, straightforward calculations for deriving insights from conversation data.
 * Focused on message counts, response times, and conversation length.
 */

import type { NormalizedMessage, MatchContext } from '@/types/data-model'

/**
 * Message count metrics for a conversation
 */
export interface MessageCountMetrics {
  /** Total number of messages in the conversation */
  total: number
  /** Number of messages sent by the user */
  userMessages: number
  /** Number of messages sent by the match */
  matchMessages: number
  /** Ratio of user messages to total (0-1) */
  userRatio: number
  /** Ratio of match messages to total (0-1) */
  matchRatio: number
  /** Balance score: 0.5 is perfectly balanced, closer to 0 or 1 is imbalanced */
  balance: number
}

/**
 * Response time metrics for a conversation
 */
export interface ResponseTimeMetrics {
  /** Average response time in milliseconds */
  averageResponseTime: number
  /** Median response time in milliseconds */
  medianResponseTime: number
  /** Fastest response time in milliseconds */
  fastestResponse: number
  /** Slowest response time in milliseconds */
  slowestResponse: number
  /** Average user response time in milliseconds */
  averageUserResponse: number
  /** Average match response time in milliseconds */
  averageMatchResponse: number
  /** Total number of response time samples */
  sampleCount: number
}

/**
 * Conversation length metrics
 */
export interface ConversationLengthMetrics {
  /** Total number of messages */
  messageCount: number
  /** Duration of conversation in milliseconds */
  duration: number
  /** Duration in human-readable format */
  durationFormatted: string
  /** First message timestamp */
  firstMessageAt: string
  /** Last message timestamp */
  lastMessageAt: string
  /** Average messages per day */
  messagesPerDay: number
}

/**
 * Combined conversation metrics
 */
export interface ConversationMetrics {
  /** Match ID this metrics applies to */
  matchId: string
  /** Message count metrics */
  messageCounts: MessageCountMetrics
  /** Response time metrics (if applicable) */
  responseTimes?: ResponseTimeMetrics
  /** Conversation length metrics */
  conversationLength: ConversationLengthMetrics
}

/**
 * Calculate message count metrics for a conversation
 */
export function calculateMessageCounts(messages: NormalizedMessage[]): MessageCountMetrics {
  const total = messages.length
  const userMessages = messages.filter(m => m.direction === 'user').length
  const matchMessages = messages.filter(m => m.direction === 'match').length

  const userRatio = total > 0 ? userMessages / total : 0
  const matchRatio = total > 0 ? matchMessages / total : 0

  // Balance: 0.5 is perfect, distance from 0.5 indicates imbalance
  // Convert to 0-1 scale where 0.5 is balanced, 0 or 1 is completely imbalanced
  const balance = 0.5 - Math.abs(userRatio - 0.5)

  return {
    total,
    userMessages,
    matchMessages,
    userRatio,
    matchRatio,
    balance,
  }
}

/**
 * Calculate response times between messages
 */
export function calculateResponseTimes(messages: NormalizedMessage[]): ResponseTimeMetrics | undefined {
  if (messages.length < 2) {
    return undefined
  }

  // Sort messages by timestamp
  const sorted = [...messages].sort((a, b) =>
    new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime()
  )

  const responseTimes: number[] = []
  const userResponseTimes: number[] = []
  const matchResponseTimes: number[] = []

  // Track the start of the current sender's message group
  let groupStartIndex = 0

  // Calculate time between message groups from different senders
  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[groupStartIndex]
    const curr = sorted[i]

    // Check if sender changed (new response)
    if (prev.senderId !== curr.senderId) {
      const responseTime = new Date(curr.sentAt).getTime() - new Date(prev.sentAt).getTime()

      // Only count positive response times (negative would indicate data issues)
      if (responseTime > 0) {
        responseTimes.push(responseTime)

        if (curr.direction === 'user') {
          userResponseTimes.push(responseTime)
        } else {
          matchResponseTimes.push(responseTime)
        }
      }

      // Start new group at current message
      groupStartIndex = i
    }
    // If same sender, continue the group (don't update groupStartIndex)
  }

  if (responseTimes.length === 0) {
    return undefined
  }

  // Calculate average
  const averageResponseTime = responseTimes.reduce((sum, t) => sum + t, 0) / responseTimes.length

  // Calculate median
  const sortedTimes = [...responseTimes].sort((a, b) => a - b)
  const medianResponseTime = sortedTimes.length % 2 === 0
    ? (sortedTimes[sortedTimes.length / 2 - 1] + sortedTimes[sortedTimes.length / 2]) / 2
    : sortedTimes[Math.floor(sortedTimes.length / 2)]

  // Min/max
  const fastestResponse = Math.min(...responseTimes)
  const slowestResponse = Math.max(...responseTimes)

  // Averages by direction
  const averageUserResponse = userResponseTimes.length > 0
    ? userResponseTimes.reduce((sum, t) => sum + t, 0) / userResponseTimes.length
    : 0

  const averageMatchResponse = matchResponseTimes.length > 0
    ? matchResponseTimes.reduce((sum, t) => sum + t, 0) / matchResponseTimes.length
    : 0

  return {
    averageResponseTime,
    medianResponseTime,
    fastestResponse,
    slowestResponse,
    averageUserResponse,
    averageMatchResponse,
    sampleCount: responseTimes.length,
  }
}

/**
 * Format duration in milliseconds to human-readable string
 */
export function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (days > 0) {
    const remainingHours = hours % 24
    return remainingHours > 0
      ? `${days}d ${remainingHours}h`
      : `${days}d`
  }

  if (hours > 0) {
    const remainingMinutes = minutes % 60
    return remainingMinutes > 0
      ? `${hours}h ${remainingMinutes}m`
      : `${hours}h`
  }

  if (minutes > 0) {
    return `${minutes}m`
  }

  return `${seconds}s`
}

/**
 * Calculate conversation length metrics
 */
export function calculateConversationLength(messages: NormalizedMessage[]): ConversationLengthMetrics {
  const messageCount = messages.length

  if (messageCount === 0) {
    return {
      messageCount: 0,
      duration: 0,
      durationFormatted: '0s',
      firstMessageAt: '',
      lastMessageAt: '',
      messagesPerDay: 0,
    }
  }

  // Sort messages by timestamp
  const sorted = [...messages].sort((a, b) =>
    new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime()
  )

  const firstMessageAt = sorted[0].sentAt
  const lastMessageAt = sorted[sorted.length - 1].sentAt

  const duration = new Date(lastMessageAt).getTime() - new Date(firstMessageAt).getTime()
  const durationFormatted = formatDuration(duration)

  // Calculate messages per day
  const durationInDays = duration / (1000 * 60 * 60 * 24)
  const messagesPerDay = durationInDays > 0 ? messageCount / durationInDays : messageCount

  return {
    messageCount,
    duration,
    durationFormatted,
    firstMessageAt,
    lastMessageAt,
    messagesPerDay,
  }
}

/**
 * Calculate all metrics for a single conversation
 */
export function calculateConversationMetrics(
  matchId: string,
  messages: NormalizedMessage[]
): ConversationMetrics {
  return {
    matchId,
    messageCounts: calculateMessageCounts(messages),
    responseTimes: calculateResponseTimes(messages),
    conversationLength: calculateConversationLength(messages),
  }
}

/**
 * Calculate metrics for multiple conversations
 */
export function calculateAllConversationMetrics(
  matches: MatchContext[],
  allMessages: NormalizedMessage[]
): ConversationMetrics[] {
  return matches.map(match => {
    const matchMessages = allMessages.filter(m => m.matchId === match.id)
    return calculateConversationMetrics(match.id, matchMessages)
  })
}

/**
 * Aggregate statistics across all conversations
 */
export interface AggregateMetrics {
  /** Total number of conversations */
  totalConversations: number
  /** Total messages across all conversations */
  totalMessages: number
  /** Average messages per conversation */
  averageMessagesPerConversation: number
  /** Average user/match balance across conversations */
  averageBalance: number
  /** Overall average response time across all conversations (ms) */
  overallAverageResponseTime: number
  /** Median conversation length (message count) */
  medianConversationLength: number
  /** Longest conversation (message count) */
  longestConversation: number
  /** Shortest conversation with messages (message count) */
  shortestConversation: number
}

/**
 * Calculate aggregate metrics across all conversations
 */
export function calculateAggregateMetrics(metrics: ConversationMetrics[]): AggregateMetrics {
  const totalConversations = metrics.length

  if (totalConversations === 0) {
    return {
      totalConversations: 0,
      totalMessages: 0,
      averageMessagesPerConversation: 0,
      averageBalance: 0,
      overallAverageResponseTime: 0,
      medianConversationLength: 0,
      longestConversation: 0,
      shortestConversation: 0,
    }
  }

  const totalMessages = metrics.reduce((sum, m) => sum + m.messageCounts.total, 0)
  const averageMessagesPerConversation = totalMessages / totalConversations

  const averageBalance = metrics.reduce((sum, m) => sum + m.messageCounts.balance, 0) / totalConversations

  // Calculate overall average response time from conversations that have response time data
  const conversationsWithResponses = metrics.filter(m => m.responseTimes !== undefined)
  const overallAverageResponseTime = conversationsWithResponses.length > 0
    ? conversationsWithResponses.reduce((sum, m) => sum + (m.responseTimes?.averageResponseTime || 0), 0) / conversationsWithResponses.length
    : 0

  // Calculate median conversation length
  const messageCounts = metrics.map(m => m.messageCounts.total).sort((a, b) => a - b)
  const medianConversationLength = messageCounts.length % 2 === 0
    ? (messageCounts[messageCounts.length / 2 - 1] + messageCounts[messageCounts.length / 2]) / 2
    : messageCounts[Math.floor(messageCounts.length / 2)]

  // Find longest and shortest conversations (excluding empty ones)
  const nonEmptyConversations = messageCounts.filter(count => count > 0)
  const longestConversation = nonEmptyConversations.length > 0 ? Math.max(...nonEmptyConversations) : 0
  const shortestConversation = nonEmptyConversations.length > 0 ? Math.min(...nonEmptyConversations) : 0

  return {
    totalConversations,
    totalMessages,
    averageMessagesPerConversation,
    averageBalance,
    overallAverageResponseTime,
    medianConversationLength,
    longestConversation,
    shortestConversation,
  }
}
