import { describe, it, expect } from 'vitest'
import {
  recognizeImbalancePattern,
  recognizeTimingPattern,
  recognizeConversationPatterns,
  analyzeBatchPatterns,
  getImbalancePatternLabel,
  getTimingPatternLabel,
  isPatternConcerning,
  getPatternInsight,
} from './pattern-recognition'
import type { MessageCountMetrics, ResponseTimeMetrics } from '@/lib/metrics/basic-metrics'

describe('recognizeImbalancePattern', () => {
  it('detects balanced pattern', () => {
    const metrics: MessageCountMetrics = {
      total: 10,
      userMessages: 5,
      matchMessages: 5,
      userRatio: 0.5,
      matchRatio: 0.5,
      balance: 0.5,
    }

    const result = recognizeImbalancePattern(metrics)

    expect(result.pattern).toBe('balanced')
    expect(result.confidence).toBeGreaterThan(0.8)
    expect(result.description).toContain('Balanced')
  })

  it('detects user monologue', () => {
    const metrics: MessageCountMetrics = {
      total: 5,
      userMessages: 5,
      matchMessages: 0,
      userRatio: 1,
      matchRatio: 0,
      balance: 0,
    }

    const result = recognizeImbalancePattern(metrics)

    expect(result.pattern).toBe('monologue')
    expect(result.confidence).toBe(1.0)
    expect(result.description).toContain('only you')
  })

  it('detects match monologue', () => {
    const metrics: MessageCountMetrics = {
      total: 5,
      userMessages: 0,
      matchMessages: 5,
      userRatio: 0,
      matchRatio: 1,
      balance: 0,
    }

    const result = recognizeImbalancePattern(metrics)

    expect(result.pattern).toBe('monologue')
    expect(result.confidence).toBe(1.0)
    expect(result.description).toContain('only they')
  })

  it('detects user-dominated pattern', () => {
    const metrics: MessageCountMetrics = {
      total: 10,
      userMessages: 8,
      matchMessages: 2,
      userRatio: 0.8,
      matchRatio: 0.2,
      balance: 0.2,
    }

    const result = recognizeImbalancePattern(metrics)

    expect(result.pattern).toBe('user_dominated')
    expect(result.description).toContain('You carried')
  })

  it('detects match-dominated pattern', () => {
    const metrics: MessageCountMetrics = {
      total: 10,
      userMessages: 2,
      matchMessages: 8,
      userRatio: 0.2,
      matchRatio: 0.8,
      balance: 0.2,
    }

    const result = recognizeImbalancePattern(metrics)

    expect(result.pattern).toBe('match_dominated')
    expect(result.description).toContain('They carried')
  })

  it('detects slight user heavy pattern', () => {
    const metrics: MessageCountMetrics = {
      total: 10,
      userMessages: 6,
      matchMessages: 4,
      userRatio: 0.6,
      matchRatio: 0.4,
      balance: 0.4,
    }

    const result = recognizeImbalancePattern(metrics)

    expect(result.pattern).toBe('slight_user_heavy')
    expect(result.description).toContain('bit more')
  })

  it('detects slight match heavy pattern', () => {
    const metrics: MessageCountMetrics = {
      total: 10,
      userMessages: 4,
      matchMessages: 6,
      userRatio: 0.4,
      matchRatio: 0.6,
      balance: 0.4,
    }

    const result = recognizeImbalancePattern(metrics)

    expect(result.pattern).toBe('slight_match_heavy')
    expect(result.description).toContain('They sent a bit more')
  })
})

describe('recognizeTimingPattern', () => {
  it('detects instant messaging pattern', () => {
    const metrics: ResponseTimeMetrics = {
      averageResponseTime: 2 * 60 * 1000, // 2 minutes
      medianResponseTime: 2 * 60 * 1000,
      fastestResponse: 1 * 60 * 1000,
      slowestResponse: 5 * 60 * 1000,
      averageUserResponse: 2 * 60 * 1000,
      averageMatchResponse: 2 * 60 * 1000,
      sampleCount: 10,
    }

    const result = recognizeTimingPattern(metrics)

    expect(result.pattern).toBe('instant_messaging')
    expect(result.description).toContain('instant')
  })

  it('detects active conversation pattern', () => {
    const metrics: ResponseTimeMetrics = {
      averageResponseTime: 30 * 60 * 1000, // 30 minutes
      medianResponseTime: 30 * 60 * 1000,
      fastestResponse: 10 * 60 * 1000,
      slowestResponse: 60 * 60 * 1000,
      averageUserResponse: 30 * 60 * 1000,
      averageMatchResponse: 30 * 60 * 1000,
      sampleCount: 10,
    }

    const result = recognizeTimingPattern(metrics)

    expect(result.pattern).toBe('active_conversation')
    expect(result.description).toContain('Active')
  })

  it('detects casual chat pattern', () => {
    const metrics: ResponseTimeMetrics = {
      averageResponseTime: 3 * 60 * 60 * 1000, // 3 hours
      medianResponseTime: 3 * 60 * 60 * 1000,
      fastestResponse: 1 * 60 * 60 * 1000,
      slowestResponse: 5 * 60 * 60 * 1000,
      averageUserResponse: 3 * 60 * 60 * 1000,
      averageMatchResponse: 3 * 60 * 60 * 1000,
      sampleCount: 10,
    }

    const result = recognizeTimingPattern(metrics)

    expect(result.pattern).toBe('casual_chat')
    expect(result.description).toContain('Casual')
  })

  it('detects slow burn pattern', () => {
    const metrics: ResponseTimeMetrics = {
      averageResponseTime: 24 * 60 * 60 * 1000, // 24 hours
      medianResponseTime: 24 * 60 * 60 * 1000,
      fastestResponse: 12 * 60 * 60 * 1000,
      slowestResponse: 36 * 60 * 60 * 1000,
      averageUserResponse: 24 * 60 * 60 * 1000,
      averageMatchResponse: 24 * 60 * 60 * 1000,
      sampleCount: 10,
    }

    const result = recognizeTimingPattern(metrics)

    expect(result.pattern).toBe('slow_burn')
    expect(result.description).toContain('Slow-paced')
  })

  it('detects sporadic pattern', () => {
    const metrics: ResponseTimeMetrics = {
      averageResponseTime: 3 * 24 * 60 * 60 * 1000, // 3 days
      medianResponseTime: 3 * 24 * 60 * 60 * 1000,
      fastestResponse: 1 * 24 * 60 * 60 * 1000,
      slowestResponse: 5 * 24 * 60 * 60 * 1000,
      averageUserResponse: 3 * 24 * 60 * 60 * 1000,
      averageMatchResponse: 3 * 24 * 60 * 60 * 1000,
      sampleCount: 10,
    }

    const result = recognizeTimingPattern(metrics)

    expect(result.pattern).toBe('sporadic')
    expect(result.description).toContain('Sporadic')
  })

  it('detects ghosting pattern', () => {
    const metrics: ResponseTimeMetrics = {
      averageResponseTime: 10 * 24 * 60 * 60 * 1000, // 10 days
      medianResponseTime: 10 * 24 * 60 * 60 * 1000,
      fastestResponse: 7 * 24 * 60 * 60 * 1000,
      slowestResponse: 14 * 24 * 60 * 60 * 1000,
      averageUserResponse: 10 * 24 * 60 * 60 * 1000,
      averageMatchResponse: 10 * 24 * 60 * 60 * 1000,
      sampleCount: 10,
    }

    const result = recognizeTimingPattern(metrics)

    expect(result.pattern).toBe('ghosting')
    expect(result.description).toContain('long gaps')
  })

  it('adjusts confidence based on sample count', () => {
    const metricsLowSamples: ResponseTimeMetrics = {
      averageResponseTime: 30 * 60 * 1000, // 30 minutes
      medianResponseTime: 30 * 60 * 1000,
      fastestResponse: 10 * 60 * 1000,
      slowestResponse: 60 * 60 * 1000,
      averageUserResponse: 30 * 60 * 1000,
      averageMatchResponse: 30 * 60 * 1000,
      sampleCount: 2,
    }

    const resultLow = recognizeTimingPattern(metricsLowSamples)
    expect(resultLow.confidence).toBeLessThan(0.5)

    const metricsHighSamples: ResponseTimeMetrics = {
      ...metricsLowSamples,
      sampleCount: 10,
    }

    const resultHigh = recognizeTimingPattern(metricsHighSamples)
    expect(resultHigh.confidence).toBeGreaterThan(resultLow.confidence)
  })
})

describe('recognizeConversationPatterns', () => {
  it('recognizes both imbalance and timing patterns', () => {
    const messageMetrics: MessageCountMetrics = {
      total: 10,
      userMessages: 5,
      matchMessages: 5,
      userRatio: 0.5,
      matchRatio: 0.5,
      balance: 0.5,
    }

    const timingMetrics: ResponseTimeMetrics = {
      averageResponseTime: 30 * 60 * 1000,
      medianResponseTime: 30 * 60 * 1000,
      fastestResponse: 10 * 60 * 1000,
      slowestResponse: 60 * 60 * 1000,
      averageUserResponse: 30 * 60 * 1000,
      averageMatchResponse: 30 * 60 * 1000,
      sampleCount: 10,
    }

    const patterns = recognizeConversationPatterns(messageMetrics, timingMetrics)

    expect(patterns.imbalance.pattern).toBe('balanced')
    expect(patterns.timing).not.toBeNull()
    expect(patterns.timing?.pattern).toBe('active_conversation')
  })

  it('handles missing timing metrics', () => {
    const messageMetrics: MessageCountMetrics = {
      total: 10,
      userMessages: 5,
      matchMessages: 5,
      userRatio: 0.5,
      matchRatio: 0.5,
      balance: 0.5,
    }

    const patterns = recognizeConversationPatterns(messageMetrics)

    expect(patterns.imbalance.pattern).toBe('balanced')
    expect(patterns.timing).toBeNull()
  })
})

describe('analyzeBatchPatterns', () => {
  it('analyzes patterns across multiple conversations', () => {
    const conversations = [
      {
        messageMetrics: {
          total: 10,
          userMessages: 5,
          matchMessages: 5,
          userRatio: 0.5,
          matchRatio: 0.5,
          balance: 0.5,
        },
        timingMetrics: {
          averageResponseTime: 30 * 60 * 1000,
          medianResponseTime: 30 * 60 * 1000,
          fastestResponse: 10 * 60 * 1000,
          slowestResponse: 60 * 60 * 1000,
          averageUserResponse: 30 * 60 * 1000,
          averageMatchResponse: 30 * 60 * 1000,
          sampleCount: 10,
        },
      },
      {
        messageMetrics: {
          total: 10,
          userMessages: 8,
          matchMessages: 2,
          userRatio: 0.8,
          matchRatio: 0.2,
          balance: 0.2,
        },
        timingMetrics: {
          averageResponseTime: 2 * 60 * 1000,
          medianResponseTime: 2 * 60 * 1000,
          fastestResponse: 1 * 60 * 1000,
          slowestResponse: 5 * 60 * 1000,
          averageUserResponse: 2 * 60 * 1000,
          averageMatchResponse: 2 * 60 * 1000,
          sampleCount: 10,
        },
      },
      {
        messageMetrics: {
          total: 10,
          userMessages: 5,
          matchMessages: 5,
          userRatio: 0.5,
          matchRatio: 0.5,
          balance: 0.5,
        },
        timingMetrics: {
          averageResponseTime: 3 * 60 * 60 * 1000,
          medianResponseTime: 3 * 60 * 60 * 1000,
          fastestResponse: 1 * 60 * 60 * 1000,
          slowestResponse: 5 * 60 * 60 * 1000,
          averageUserResponse: 3 * 60 * 60 * 1000,
          averageMatchResponse: 3 * 60 * 60 * 1000,
          sampleCount: 10,
        },
      },
    ]

    const analysis = analyzeBatchPatterns(conversations)

    expect(analysis.totalConversations).toBe(3)
    expect(analysis.imbalanceDistribution.balanced).toBe(2)
    expect(analysis.imbalanceDistribution.user_dominated).toBe(1)
    expect(analysis.mostCommonImbalance).toBe('balanced')

    expect(analysis.timingDistribution.active_conversation).toBe(1)
    expect(analysis.timingDistribution.instant_messaging).toBe(1)
    expect(analysis.timingDistribution.casual_chat).toBe(1)
  })

  it('handles conversations without timing data', () => {
    const conversations = [
      {
        messageMetrics: {
          total: 10,
          userMessages: 5,
          matchMessages: 5,
          userRatio: 0.5,
          matchRatio: 0.5,
          balance: 0.5,
        },
      },
    ]

    const analysis = analyzeBatchPatterns(conversations)

    expect(analysis.totalConversations).toBe(1)
    expect(analysis.mostCommonTiming).toBeNull()
  })
})

describe('getImbalancePatternLabel', () => {
  it('returns friendly labels for all imbalance patterns', () => {
    expect(getImbalancePatternLabel('balanced')).toBe('Balanced')
    expect(getImbalancePatternLabel('slight_user_heavy')).toBe('Slightly You-Heavy')
    expect(getImbalancePatternLabel('slight_match_heavy')).toBe('Slightly Them-Heavy')
    expect(getImbalancePatternLabel('user_dominated')).toBe('You-Dominated')
    expect(getImbalancePatternLabel('match_dominated')).toBe('Them-Dominated')
    expect(getImbalancePatternLabel('monologue')).toBe('One-Sided')
  })
})

describe('getTimingPatternLabel', () => {
  it('returns friendly labels for all timing patterns', () => {
    expect(getTimingPatternLabel('instant_messaging')).toBe('Instant')
    expect(getTimingPatternLabel('active_conversation')).toBe('Active')
    expect(getTimingPatternLabel('casual_chat')).toBe('Casual')
    expect(getTimingPatternLabel('slow_burn')).toBe('Slow Burn')
    expect(getTimingPatternLabel('sporadic')).toBe('Sporadic')
    expect(getTimingPatternLabel('ghosting')).toBe('Distant')
  })
})

describe('isPatternConcerning', () => {
  it('identifies concerning monologue pattern', () => {
    const patterns = {
      imbalance: {
        pattern: 'monologue' as const,
        confidence: 1.0,
        description: 'One-sided',
        indicators: { userRatio: 1, matchRatio: 0, balance: 0 },
      },
      timing: null,
    }

    expect(isPatternConcerning(patterns)).toBe(true)
  })

  it('identifies concerning user-dominated pattern', () => {
    const patterns = {
      imbalance: {
        pattern: 'user_dominated' as const,
        confidence: 0.8,
        description: 'You carried',
        indicators: { userRatio: 0.8, matchRatio: 0.2, balance: 0.2 },
      },
      timing: null,
    }

    expect(isPatternConcerning(patterns)).toBe(true)
  })

  it('identifies concerning ghosting pattern', () => {
    const patterns = {
      imbalance: {
        pattern: 'balanced' as const,
        confidence: 1.0,
        description: 'Balanced',
        indicators: { userRatio: 0.5, matchRatio: 0.5, balance: 0.5 },
      },
      timing: {
        pattern: 'ghosting' as const,
        confidence: 1.0,
        description: 'Long gaps',
        indicators: {
          averageResponseTime: 10 * 24 * 60 * 60 * 1000,
          medianResponseTime: 10 * 24 * 60 * 60 * 1000,
          sampleCount: 10,
        },
      },
    }

    expect(isPatternConcerning(patterns)).toBe(true)
  })

  it('identifies non-concerning patterns', () => {
    const patterns = {
      imbalance: {
        pattern: 'balanced' as const,
        confidence: 1.0,
        description: 'Balanced',
        indicators: { userRatio: 0.5, matchRatio: 0.5, balance: 0.5 },
      },
      timing: {
        pattern: 'active_conversation' as const,
        confidence: 1.0,
        description: 'Active',
        indicators: {
          averageResponseTime: 30 * 60 * 1000,
          medianResponseTime: 30 * 60 * 1000,
          sampleCount: 10,
        },
      },
    }

    expect(isPatternConcerning(patterns)).toBe(false)
  })
})

describe('getPatternInsight', () => {
  it('provides insight for balanced with instant messaging', () => {
    const patterns = {
      imbalance: {
        pattern: 'balanced' as const,
        confidence: 1.0,
        description: 'Balanced',
        indicators: { userRatio: 0.5, matchRatio: 0.5, balance: 0.5 },
      },
      timing: {
        pattern: 'instant_messaging' as const,
        confidence: 1.0,
        description: 'Instant',
        indicators: {
          averageResponseTime: 2 * 60 * 1000,
          medianResponseTime: 2 * 60 * 1000,
          sampleCount: 10,
        },
      },
    }

    const insight = getPatternInsight(patterns)
    expect(insight).toContain('Great connection')
  })

  it('provides insight for user-dominated pattern', () => {
    const patterns = {
      imbalance: {
        pattern: 'user_dominated' as const,
        confidence: 0.8,
        description: 'You carried',
        indicators: { userRatio: 0.8, matchRatio: 0.2, balance: 0.2 },
      },
      timing: null,
    }

    const insight = getPatternInsight(patterns)
    expect(insight).toContain('more effort')
  })

  it('provides insight for match-dominated pattern', () => {
    const patterns = {
      imbalance: {
        pattern: 'match_dominated' as const,
        confidence: 0.8,
        description: 'They carried',
        indicators: { userRatio: 0.2, matchRatio: 0.8, balance: 0.2 },
      },
      timing: null,
    }

    const insight = getPatternInsight(patterns)
    expect(insight).toContain('more engaged')
  })

  it('provides insight for monologue pattern', () => {
    const patterns = {
      imbalance: {
        pattern: 'monologue' as const,
        confidence: 1.0,
        description: 'One-sided conversation: only you sent messages',
        indicators: { userRatio: 1, matchRatio: 0, balance: 0 },
      },
      timing: null,
    }

    const insight = getPatternInsight(patterns)
    expect(insight).toContain('One-sided')
  })
})
