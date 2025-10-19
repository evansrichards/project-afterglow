import { describe, it, expect } from 'vitest'
import {
  sanitizeMessageText,
  formatTimeDuration,
  generateOverviewInsight,
  generateBalanceInsight,
  generateTimingInsight,
  generateLengthInsight,
  generatePatternInsight,
  generateAllInsights,
  createSanitizedExamples,
} from './insight-generation'
import type { NormalizedMessage } from '@/types/data-model'
import type {
  MessageVolumeBalance,
  ResponseTimingPatterns,
  ConversationLengthDistribution,
} from './core-metrics'
import type { ConversationPatterns } from './pattern-recognition'

describe('sanitizeMessageText', () => {
  it('creates placeholders for short messages', () => {
    expect(sanitizeMessageText('Hi', 'you')).toBe('[Your short message]')
    expect(sanitizeMessageText('Hey', 'them')).toBe('[Their short message]')
  })

  it('creates placeholders for medium messages', () => {
    expect(sanitizeMessageText('How are you doing today?', 'you')).toBe('[Your message]')
    expect(sanitizeMessageText('I am doing great thanks!', 'them')).toBe('[Their message]')
  })

  it('creates placeholders for long messages', () => {
    const longMsg = 'This is a much longer message that contains more detail and information'
    expect(sanitizeMessageText(longMsg, 'you')).toBe('[Your longer message]')
    expect(sanitizeMessageText(longMsg, 'them')).toBe('[Their longer message]')
  })
})

describe('formatTimeDuration', () => {
  it('formats seconds', () => {
    expect(formatTimeDuration(30 * 1000)).toBe('less than a minute')
  })

  it('formats minutes', () => {
    expect(formatTimeDuration(5 * 60 * 1000)).toBe('5 minutes')
    expect(formatTimeDuration(1 * 60 * 1000)).toBe('1 minute')
  })

  it('formats hours', () => {
    expect(formatTimeDuration(3 * 60 * 60 * 1000)).toBe('3 hours')
    expect(formatTimeDuration(1 * 60 * 60 * 1000)).toBe('1 hour')
  })

  it('formats days', () => {
    expect(formatTimeDuration(2 * 24 * 60 * 60 * 1000)).toBe('2 days')
    expect(formatTimeDuration(1 * 24 * 60 * 60 * 1000)).toBe('1 day')
  })
})

describe('generateOverviewInsight', () => {
  it('generates overview insight', () => {
    const insight = generateOverviewInsight(5, 100, 20)

    expect(insight.category).toBe('overview')
    expect(insight.severity).toBe('neutral')
    expect(insight.title).toBe('Your Conversation Overview')
    expect(insight.summary).toContain('5 conversations')
    expect(insight.summary).toContain('100 total messages')
    expect(insight.summary).toContain('20 messages')
    expect(insight.metrics?.totalConversations).toBe(5)
  })

  it('handles singular forms', () => {
    const insight = generateOverviewInsight(1, 1, 1)

    expect(insight.summary).toContain('1 conversation')
    expect(insight.summary).toContain('1 total message')
  })
})

describe('generateBalanceInsight', () => {
  it('generates positive insight for balanced conversations', () => {
    const balance: MessageVolumeBalance = {
      conversationCount: 10,
      averageBalance: 0.48,
      balanceDistribution: {
        balanced: 8,
        slightlyImbalanced: 2,
        heavilyImbalanced: 0,
      },
      userDominatedCount: 0,
      matchDominatedCount: 0,
      conversations: [],
    }

    const insight = generateBalanceInsight(balance)

    expect(insight.category).toBe('balance')
    expect(insight.severity).toBe('positive')
    expect(insight.title).toContain('Great')
    expect(insight.summary).toContain('8 out of 10')
  })

  it('generates concern insight for user-dominated conversations', () => {
    const balance: MessageVolumeBalance = {
      conversationCount: 10,
      averageBalance: 0.25,
      balanceDistribution: {
        balanced: 2,
        slightlyImbalanced: 3,
        heavilyImbalanced: 5,
      },
      userDominatedCount: 6,
      matchDominatedCount: 0,
      conversations: [],
    }

    const insight = generateBalanceInsight(balance)

    expect(insight.category).toBe('balance')
    expect(insight.severity).toBe('concern')
    expect(insight.title).toContain('Carry')
    expect(insight.reflection).toBeDefined()
  })

  it('generates neutral insight for match-dominated conversations', () => {
    const balance: MessageVolumeBalance = {
      conversationCount: 10,
      averageBalance: 0.3,
      balanceDistribution: {
        balanced: 3,
        slightlyImbalanced: 3,
        heavilyImbalanced: 4,
      },
      userDominatedCount: 0,
      matchDominatedCount: 5,
      conversations: [],
    }

    const insight = generateBalanceInsight(balance)

    expect(insight.category).toBe('balance')
    expect(insight.title).toContain('They')
    expect(insight.summary).toContain('5 out of 10')
  })
})

describe('generateTimingInsight', () => {
  it('generates positive insight for fast conversations', () => {
    const timing: ResponseTimingPatterns = {
      conversationCount: 10,
      overallAverageResponseTime: 5 * 60 * 1000, // 5 minutes
      overallMedianResponseTime: 5 * 60 * 1000,
      fastestConversation: null,
      slowestConversation: null,
      speedDistribution: {
        veryFast: 6,
        fast: 3,
        moderate: 1,
        slow: 0,
        verySlow: 0,
      },
      averageUserResponseTime: 5 * 60 * 1000,
      averageMatchResponseTime: 5 * 60 * 1000,
      conversations: [],
    }

    const insight = generateTimingInsight(timing)

    expect(insight.category).toBe('timing')
    expect(insight.severity).toBe('positive')
    expect(insight.title).toContain('Active')
    expect(insight.summary).toContain('6 out of 10')
  })

  it('generates concern insight for ghosting patterns', () => {
    const timing: ResponseTimingPatterns = {
      conversationCount: 10,
      overallAverageResponseTime: 10 * 24 * 60 * 60 * 1000, // 10 days
      overallMedianResponseTime: 10 * 24 * 60 * 60 * 1000,
      fastestConversation: null,
      slowestConversation: null,
      speedDistribution: {
        veryFast: 0,
        fast: 0,
        moderate: 2,
        slow: 3,
        verySlow: 5,
      },
      averageUserResponseTime: 10 * 24 * 60 * 60 * 1000,
      averageMatchResponseTime: 10 * 24 * 60 * 60 * 1000,
      conversations: [],
    }

    const insight = generateTimingInsight(timing)

    expect(insight.category).toBe('timing')
    expect(insight.severity).toBe('concern')
    expect(insight.title).toContain('Long Gaps')
    expect(insight.reflection).toBeDefined()
  })

  it('generates neutral insight for casual pace', () => {
    const timing: ResponseTimingPatterns = {
      conversationCount: 10,
      overallAverageResponseTime: 3 * 60 * 60 * 1000, // 3 hours
      overallMedianResponseTime: 3 * 60 * 60 * 1000,
      fastestConversation: null,
      slowestConversation: null,
      speedDistribution: {
        veryFast: 1,
        fast: 2,
        moderate: 5,
        slow: 2,
        verySlow: 0,
      },
      averageUserResponseTime: 3 * 60 * 60 * 1000,
      averageMatchResponseTime: 3 * 60 * 60 * 1000,
      conversations: [],
    }

    const insight = generateTimingInsight(timing)

    expect(insight.category).toBe('timing')
    expect(insight.severity).toBe('neutral')
    expect(insight.title).toContain('Casual')
  })
})

describe('generateLengthInsight', () => {
  it('generates neutral insight for many brief exchanges', () => {
    const length: ConversationLengthDistribution = {
      conversationCount: 10,
      averageMessageCount: 4,
      medianMessageCount: 3,
      shortestConversation: null,
      longestConversation: null,
      lengthDistribution: {
        veryShort: 8,
        short: 2,
        medium: 0,
        long: 0,
        veryLong: 0,
      },
      averageDuration: 1000,
      medianDuration: 1000,
      conversations: [],
    }

    const insight = generateLengthInsight(length)

    expect(insight.category).toBe('length')
    expect(insight.severity).toBe('neutral')
    expect(insight.title).toContain('Brief')
    expect(insight.summary).toContain('8 out of 10')
  })

  it('generates positive insight for deeper connections', () => {
    const length: ConversationLengthDistribution = {
      conversationCount: 10,
      averageMessageCount: 75,
      medianMessageCount: 60,
      shortestConversation: null,
      longestConversation: null,
      lengthDistribution: {
        veryShort: 1,
        short: 2,
        medium: 3,
        long: 3,
        veryLong: 1,
      },
      averageDuration: 1000,
      medianDuration: 1000,
      conversations: [],
    }

    const insight = generateLengthInsight(length)

    expect(insight.category).toBe('length')
    expect(insight.severity).toBe('positive')
    expect(insight.title).toContain('Deeper')
    expect(insight.summary).toContain('4 out of 10')
  })

  it('generates neutral insight for mixed lengths', () => {
    const length: ConversationLengthDistribution = {
      conversationCount: 10,
      averageMessageCount: 25,
      medianMessageCount: 20,
      shortestConversation: null,
      longestConversation: null,
      lengthDistribution: {
        veryShort: 2,
        short: 3,
        medium: 4,
        long: 1,
        veryLong: 0,
      },
      averageDuration: 1000,
      medianDuration: 1000,
      conversations: [],
    }

    const insight = generateLengthInsight(length)

    expect(insight.category).toBe('length')
    expect(insight.severity).toBe('neutral')
    expect(insight.title).toContain('Mix')
  })
})

describe('generatePatternInsight', () => {
  it('generates positive insight for balanced pattern', () => {
    const patterns: ConversationPatterns = {
      imbalance: {
        pattern: 'balanced',
        confidence: 1.0,
        description: 'Balanced',
        indicators: { userRatio: 0.5, matchRatio: 0.5, balance: 0.5 },
      },
      timing: {
        pattern: 'active_conversation',
        confidence: 1.0,
        description: 'Active',
        indicators: {
          averageResponseTime: 30 * 60 * 1000,
          medianResponseTime: 30 * 60 * 1000,
          sampleCount: 10,
        },
      },
    }

    const insight = generatePatternInsight('m1', patterns, 20)

    expect(insight.category).toBe('pattern')
    expect(insight.severity).toBe('positive')
    expect(insight.title).toContain('Balanced')
    expect(insight.summary).toContain('20 messages')
  })

  it('generates concern insight for monologue pattern', () => {
    const patterns: ConversationPatterns = {
      imbalance: {
        pattern: 'monologue',
        confidence: 1.0,
        description: 'One-sided conversation: only you sent messages',
        indicators: { userRatio: 1, matchRatio: 0, balance: 0 },
      },
      timing: null,
    }

    const insight = generatePatternInsight('m1', patterns, 5)

    expect(insight.category).toBe('pattern')
    expect(insight.severity).toBe('concern')
    expect(insight.title).toContain('One-Sided')
    expect(insight.reflection).toBeDefined()
  })

  it('generates concern insight for user-dominated pattern', () => {
    const patterns: ConversationPatterns = {
      imbalance: {
        pattern: 'user_dominated',
        confidence: 0.8,
        description: 'You carried',
        indicators: { userRatio: 0.8, matchRatio: 0.2, balance: 0.2 },
      },
      timing: null,
    }

    const insight = generatePatternInsight('m1', patterns, 10)

    expect(insight.category).toBe('pattern')
    expect(insight.severity).toBe('concern')
    expect(insight.title).toContain('Uneven')
  })
})

describe('generateAllInsights', () => {
  it('generates all insights from analytics data', () => {
    const balance: MessageVolumeBalance = {
      conversationCount: 5,
      averageBalance: 0.45,
      balanceDistribution: {
        balanced: 4,
        slightlyImbalanced: 1,
        heavilyImbalanced: 0,
      },
      userDominatedCount: 0,
      matchDominatedCount: 0,
      conversations: [
        {
          matchId: 'm1',
          metrics: {
            total: 10,
            userMessages: 5,
            matchMessages: 5,
            userRatio: 0.5,
            matchRatio: 0.5,
            balance: 0.5,
          },
        },
        {
          matchId: 'm2',
          metrics: {
            total: 15,
            userMessages: 8,
            matchMessages: 7,
            userRatio: 0.53,
            matchRatio: 0.47,
            balance: 0.47,
          },
        },
      ],
    }

    const timing: ResponseTimingPatterns = {
      conversationCount: 5,
      overallAverageResponseTime: 2 * 60 * 60 * 1000,
      overallMedianResponseTime: 2 * 60 * 60 * 1000,
      fastestConversation: null,
      slowestConversation: null,
      speedDistribution: {
        veryFast: 1,
        fast: 2,
        moderate: 2,
        slow: 0,
        verySlow: 0,
      },
      averageUserResponseTime: 2 * 60 * 60 * 1000,
      averageMatchResponseTime: 2 * 60 * 60 * 1000,
      conversations: [],
    }

    const length: ConversationLengthDistribution = {
      conversationCount: 5,
      averageMessageCount: 12.5,
      medianMessageCount: 12,
      shortestConversation: null,
      longestConversation: null,
      lengthDistribution: {
        veryShort: 0,
        short: 3,
        medium: 2,
        long: 0,
        veryLong: 0,
      },
      averageDuration: 1000,
      medianDuration: 1000,
      conversations: [],
    }

    const insights = generateAllInsights(balance, timing, length)

    expect(insights.length).toBe(4)
    expect(insights[0].category).toBe('overview')
    expect(insights[1].category).toBe('balance')
    expect(insights[2].category).toBe('timing')
    expect(insights[3].category).toBe('length')
  })

  it('handles empty data gracefully', () => {
    const balance: MessageVolumeBalance = {
      conversationCount: 0,
      averageBalance: 0,
      balanceDistribution: {
        balanced: 0,
        slightlyImbalanced: 0,
        heavilyImbalanced: 0,
      },
      userDominatedCount: 0,
      matchDominatedCount: 0,
      conversations: [],
    }

    const timing: ResponseTimingPatterns = {
      conversationCount: 0,
      overallAverageResponseTime: 0,
      overallMedianResponseTime: 0,
      fastestConversation: null,
      slowestConversation: null,
      speedDistribution: {
        veryFast: 0,
        fast: 0,
        moderate: 0,
        slow: 0,
        verySlow: 0,
      },
      averageUserResponseTime: 0,
      averageMatchResponseTime: 0,
      conversations: [],
    }

    const length: ConversationLengthDistribution = {
      conversationCount: 0,
      averageMessageCount: 0,
      medianMessageCount: 0,
      shortestConversation: null,
      longestConversation: null,
      lengthDistribution: {
        veryShort: 0,
        short: 0,
        medium: 0,
        long: 0,
        veryLong: 0,
      },
      averageDuration: 0,
      medianDuration: 0,
      conversations: [],
    }

    const insights = generateAllInsights(balance, timing, length)

    expect(insights.length).toBe(1) // Only overview
    expect(insights[0].category).toBe('overview')
  })
})

describe('createSanitizedExamples', () => {
  it('creates sanitized examples from messages', () => {
    const messages: NormalizedMessage[] = [
      {
        id: '1',
        matchId: 'm1',
        senderId: 'user',
        sentAt: '2024-01-01T10:00:00Z',
        body: 'Hello there!',
        direction: 'user',
      },
      {
        id: '2',
        matchId: 'm1',
        senderId: 'match1',
        sentAt: '2024-01-01T10:05:00Z',
        body: 'Hey!',
        direction: 'match',
      },
      {
        id: '3',
        matchId: 'm1',
        senderId: 'user',
        sentAt: '2024-01-01T11:00:00Z',
        body: 'How are you doing today?',
        direction: 'user',
      },
    ]

    const examples = createSanitizedExamples(messages, 3)

    expect(examples.length).toBe(3)
    expect(examples[0].sender).toBe('you')
    expect(examples[0].text).toContain('[Your')
    expect(examples[0].timing).toBeUndefined() // First message has no timing

    expect(examples[1].sender).toBe('them')
    expect(examples[1].timing).toBe('5 minutes later')

    expect(examples[2].sender).toBe('you')
    expect(examples[2].timing).toBe('55 minutes later')
  })

  it('limits examples to max count', () => {
    const messages: NormalizedMessage[] = Array.from({ length: 10 }, (_, i) => ({
      id: `${i}`,
      matchId: 'm1',
      senderId: 'user',
      sentAt: `2024-01-01T10:${String(i).padStart(2, '0')}:00Z`,
      body: 'Message',
      direction: 'user' as const,
    }))

    const examples = createSanitizedExamples(messages, 3)

    expect(examples.length).toBe(3)
  })

  it('handles empty messages', () => {
    const examples = createSanitizedExamples([])

    expect(examples.length).toBe(0)
  })
})
