/**
 * Insight Generation
 *
 * Generates friendly, actionable insights from conversation data
 * with sanitized examples and encouraging summaries.
 */

import type { NormalizedMessage } from '@/types/data-model'
import type {
  MessageVolumeBalance,
  ResponseTimingPatterns,
  ConversationLengthDistribution,
} from './core-metrics'
import type { ConversationPatterns } from './pattern-recognition'
import { getPatternInsight, isPatternConcerning } from './pattern-recognition'

/**
 * Insight severity level
 */
export type InsightSeverity = 'positive' | 'neutral' | 'concern'

/**
 * Insight category
 */
export type InsightCategory = 'balance' | 'timing' | 'length' | 'pattern' | 'overview'

/**
 * Sanitized message example for illustration
 */
export interface SanitizedExample {
  /** Sanitized message text */
  text: string
  /** Who sent it */
  sender: 'you' | 'them'
  /** When it was sent (relative time like "2 hours later") */
  timing?: string
}

/**
 * Generated insight
 */
export interface Insight {
  /** Unique identifier */
  id: string
  /** Category of insight */
  category: InsightCategory
  /** Severity level */
  severity: InsightSeverity
  /** Main title */
  title: string
  /** Detailed summary */
  summary: string
  /** Optional encouragement or reflection prompt */
  reflection?: string
  /** Optional sanitized examples */
  examples?: SanitizedExample[]
  /** Supporting metrics */
  metrics?: Record<string, number | string>
}

/**
 * Sanitize message text by replacing with generic placeholder
 */
export function sanitizeMessageText(text: string, sender: 'you' | 'them'): string {
  // For MVP, we use generic placeholders
  // Future: actual PII detection and contextual redaction
  if (text.length < 10) {
    return sender === 'you' ? '[Your short message]' : '[Their short message]'
  }
  if (text.length < 50) {
    return sender === 'you' ? '[Your message]' : '[Their message]'
  }
  return sender === 'you' ? '[Your longer message]' : '[Their longer message]'
}

/**
 * Format time duration for human readability
 */
export function formatTimeDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (days > 0) {
    return days === 1 ? '1 day' : `${days} days`
  }
  if (hours > 0) {
    return hours === 1 ? '1 hour' : `${hours} hours`
  }
  if (minutes > 0) {
    return minutes === 1 ? '1 minute' : `${minutes} minutes`
  }
  return 'less than a minute'
}

/**
 * Generate overview insight from aggregate data
 */
export function generateOverviewInsight(
  totalConversations: number,
  totalMessages: number,
  averageMessagesPerConversation: number
): Insight {
  return {
    id: 'overview-stats',
    category: 'overview',
    severity: 'neutral',
    title: 'Your Conversation Overview',
    summary: `You have had ${totalConversations} conversation${totalConversations === 1 ? '' : 's'} with ${totalMessages} total message${totalMessages === 1 ? '' : 's'}. On average, conversations have ${Math.round(averageMessagesPerConversation)} messages.`,
    metrics: {
      totalConversations,
      totalMessages,
      averageMessages: Math.round(averageMessagesPerConversation),
    },
  }
}

/**
 * Generate insight from message volume balance
 */
export function generateBalanceInsight(balance: MessageVolumeBalance): Insight {
  const { averageBalance, balanceDistribution, userDominatedCount, matchDominatedCount } = balance

  // Determine severity
  const concerningCount = balanceDistribution.heavilyImbalanced
  const severity: InsightSeverity =
    concerningCount >= balance.conversationCount * 0.3 ? 'concern' :
    averageBalance >= 0.4 ? 'positive' : 'neutral'

  // Generate title and summary
  let title: string
  let summary: string
  let reflection: string | undefined

  if (balanceDistribution.balanced > balance.conversationCount * 0.7) {
    title = 'Great Conversation Balance'
    summary = `Most of your conversations (${balanceDistribution.balanced} out of ${balance.conversationCount}) show balanced back-and-forth messaging. This suggests mutual engagement and interest.`
    reflection = 'Balanced conversations often indicate strong chemistry and mutual effort.'
  } else if (userDominatedCount > balance.conversationCount * 0.4) {
    title = 'You Tend to Carry Conversations'
    summary = `In ${userDominatedCount} out of ${balance.conversationCount} conversations, you sent significantly more messages than they did. This might suggest you are putting in more effort to keep things going.`
    reflection = 'Consider whether the effort feels mutual. It is okay to let some conversations fade if the interest is not reciprocated.'
  } else if (matchDominatedCount > balance.conversationCount * 0.4) {
    title = 'They Often Lead Conversations'
    summary = `In ${matchDominatedCount} out of ${balance.conversationCount} conversations, they sent significantly more messages than you did. This suggests strong interest from your matches.`
    reflection = 'When someone shows this much interest, it might be worth engaging more actively if you are interested too.'
  } else {
    title = 'Mixed Conversation Balance'
    summary = `Your conversations show varied patterns: ${balanceDistribution.balanced} balanced, ${userDominatedCount} where you led, and ${matchDominatedCount} where they led. This variety is normal.`
    reflection = 'Different people have different communication styles. Pay attention to what feels comfortable for you.'
  }

  return {
    id: 'balance-overview',
    category: 'balance',
    severity,
    title,
    summary,
    reflection,
    metrics: {
      averageBalance: Math.round(averageBalance * 100) / 100,
      balanced: balanceDistribution.balanced,
      userDominated: userDominatedCount,
      matchDominated: matchDominatedCount,
    },
  }
}

/**
 * Generate insight from response timing patterns
 */
export function generateTimingInsight(timing: ResponseTimingPatterns): Insight {
  const { conversationCount, speedDistribution, overallAverageResponseTime } = timing

  // Determine severity
  const fastCount = speedDistribution.veryFast + speedDistribution.fast
  const slowCount = speedDistribution.slow + speedDistribution.verySlow
  const severity: InsightSeverity =
    slowCount > conversationCount * 0.4 ? 'concern' :
    fastCount > conversationCount * 0.5 ? 'positive' : 'neutral'

  let title: string
  let summary: string
  let reflection: string | undefined

  const avgFormatted = formatTimeDuration(overallAverageResponseTime)

  if (speedDistribution.veryFast > conversationCount * 0.5) {
    title = 'Very Active Conversations'
    summary = `Most of your conversations (${speedDistribution.veryFast} out of ${conversationCount}) had near-instant responses, averaging ${avgFormatted} between messages. This suggests strong real-time engagement.`
    reflection = 'Quick responses often indicate excitement and interest. Enjoy these connections!'
  } else if (slowCount > conversationCount * 0.3) {
    title = 'Long Gaps Between Messages'
    summary = `${slowCount} out of ${conversationCount} conversations had very long gaps (${avgFormatted} average). This might indicate fading interest or mismatched communication styles.`
    reflection = 'Long gaps are not always bad, but notice how they make you feel. It is okay to move on from slow-fading conversations.'
  } else if (speedDistribution.moderate > conversationCount * 0.4) {
    title = 'Casual, Comfortable Pace'
    summary = `Most conversations had a relaxed pace (${avgFormatted} average response time). You are having thoughtful exchanges without pressure.`
    reflection = 'A comfortable pace can lead to more meaningful conversations. Quality over speed!'
  } else {
    title = 'Varied Response Patterns'
    summary = `Your conversations range from instant messaging (${speedDistribution.veryFast}) to more relaxed exchanges (${speedDistribution.slow} slow-paced). Average response time is ${avgFormatted}.`
    reflection = 'Different paces work for different people. Notice which pace feels best to you.'
  }

  return {
    id: 'timing-overview',
    category: 'timing',
    severity,
    title,
    summary,
    reflection,
    metrics: {
      averageResponseTime: avgFormatted,
      instantCount: speedDistribution.veryFast,
      slowCount: slowCount,
    },
  }
}

/**
 * Generate insight from conversation length distribution
 */
export function generateLengthInsight(length: ConversationLengthDistribution): Insight {
  const { conversationCount, averageMessageCount, lengthDistribution } = length

  const shortCount = lengthDistribution.veryShort + lengthDistribution.short
  const longCount = lengthDistribution.long + lengthDistribution.veryLong

  const severity: InsightSeverity =
    longCount > conversationCount * 0.3 ? 'positive' :
    shortCount > conversationCount * 0.7 ? 'neutral' : 'neutral'

  let title: string
  let summary: string
  let reflection: string | undefined

  if (lengthDistribution.veryShort > conversationCount * 0.7) {
    title = 'Many Brief Exchanges'
    summary = `Most conversations (${lengthDistribution.veryShort} out of ${conversationCount}) ended quickly with just a few messages. Average conversation length is ${Math.round(averageMessageCount)} messages.`
    reflection = 'Short conversations are normal! Not every match will click. Focus on the ones that naturally flow.'
  } else if (longCount > conversationCount * 0.3) {
    title = 'You Build Deeper Connections'
    summary = `${longCount} out of ${conversationCount} conversations developed into longer exchanges (${Math.round(averageMessageCount)} messages average). This suggests you are good at building rapport.`
    reflection = 'Longer conversations show genuine interest. These are worth nurturing!'
  } else {
    title = 'Healthy Mix of Conversation Lengths'
    summary = `Your conversations vary naturally: ${shortCount} brief exchanges, ${lengthDistribution.medium} medium chats, and ${longCount} longer connections. Average length is ${Math.round(averageMessageCount)} messages.`
    reflection = 'This variety is healthy. Some connections spark immediately, others take time.'
  }

  return {
    id: 'length-overview',
    category: 'length',
    severity,
    title,
    summary,
    reflection,
    metrics: {
      averageLength: Math.round(averageMessageCount),
      shortConversations: shortCount,
      longConversations: longCount,
    },
  }
}

/**
 * Generate insight from conversation pattern
 */
export function generatePatternInsight(
  matchId: string,
  patterns: ConversationPatterns,
  messageCount: number
): Insight {
  const concerning = isPatternConcerning(patterns)
  const severity: InsightSeverity = concerning ? 'concern' :
    patterns.imbalance.pattern === 'balanced' ? 'positive' : 'neutral'

  const insight = getPatternInsight(patterns)

  let title: string
  if (patterns.imbalance.pattern === 'monologue') {
    title = 'One-Sided Conversation'
  } else if (concerning) {
    title = 'Uneven Conversation Dynamic'
  } else if (patterns.imbalance.pattern === 'balanced') {
    title = 'Balanced Conversation'
  } else {
    title = 'Mixed Communication Pattern'
  }

  const timingContext = patterns.timing
    ? ` Response times averaged ${formatTimeDuration(patterns.timing.indicators.averageResponseTime)}.`
    : ''

  return {
    id: `pattern-${matchId}`,
    category: 'pattern',
    severity,
    title,
    summary: `${insight} This conversation had ${messageCount} message${messageCount === 1 ? '' : 's'}.${timingContext}`,
    reflection: concerning
      ? 'Pay attention to how conversations make you feel. Balanced effort often leads to better connections.'
      : undefined,
    metrics: {
      messageCount,
      balance: patterns.imbalance.pattern,
      timing: patterns.timing?.pattern || 'unknown',
    },
  }
}

/**
 * Generate all insights from analytics data
 */
export function generateAllInsights(
  volumeBalance: MessageVolumeBalance,
  timingPatterns: ResponseTimingPatterns,
  lengthDistribution: ConversationLengthDistribution
): Insight[] {
  const insights: Insight[] = []

  // Overview insight
  insights.push(
    generateOverviewInsight(
      volumeBalance.conversationCount,
      volumeBalance.conversations.reduce((sum, c) => sum + c.metrics.total, 0),
      volumeBalance.conversations.length > 0
        ? volumeBalance.conversations.reduce((sum, c) => sum + c.metrics.total, 0) /
            volumeBalance.conversations.length
        : 0
    )
  )

  // Balance insight
  if (volumeBalance.conversationCount > 0) {
    insights.push(generateBalanceInsight(volumeBalance))
  }

  // Timing insight
  if (timingPatterns.conversationCount > 0) {
    insights.push(generateTimingInsight(timingPatterns))
  }

  // Length insight
  if (lengthDistribution.conversationCount > 0) {
    insights.push(generateLengthInsight(lengthDistribution))
  }

  return insights
}

/**
 * Create sanitized examples from conversation messages
 */
export function createSanitizedExamples(
  messages: NormalizedMessage[],
  maxExamples: number = 3
): SanitizedExample[] {
  if (messages.length === 0) return []

  // Sort by timestamp
  const sorted = [...messages].sort(
    (a, b) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime()
  )

  const examples: SanitizedExample[] = []
  let lastTime: number | null = null

  for (let i = 0; i < Math.min(sorted.length, maxExamples * 2); i++) {
    const msg = sorted[i]
    const sender = msg.direction === 'user' ? 'you' : 'them'
    const currentTime = new Date(msg.sentAt).getTime()

    let timing: string | undefined
    if (lastTime !== null) {
      const gap = currentTime - lastTime
      timing = formatTimeDuration(gap) + ' later'
    }

    examples.push({
      text: sanitizeMessageText(msg.body, sender),
      sender,
      timing,
    })

    lastTime = currentTime

    if (examples.length >= maxExamples) break
  }

  return examples
}
