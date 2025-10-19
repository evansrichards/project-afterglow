import { describe, it, expect } from 'vitest'
import {
  analyzeMessageVolumeBalance,
  analyzeResponseTimingPatterns,
  analyzeConversationLengthDistribution,
  analyzeCoreMetrics,
} from './core-metrics'
import type { NormalizedMessage } from '@/types/data-model'

describe('analyzeMessageVolumeBalance', () => {
  it('analyzes balanced conversations', () => {
    const messages: NormalizedMessage[] = [
      // Match 1: Perfectly balanced (2 user, 2 match)
      { id: '1', matchId: 'm1', senderId: 'user', sentAt: '2024-01-01T10:00:00Z', body: 'Hi', direction: 'user' },
      { id: '2', matchId: 'm1', senderId: 'match1', sentAt: '2024-01-01T10:01:00Z', body: 'Hey', direction: 'match' },
      { id: '3', matchId: 'm1', senderId: 'user', sentAt: '2024-01-01T10:02:00Z', body: 'How are you?', direction: 'user' },
      { id: '4', matchId: 'm1', senderId: 'match1', sentAt: '2024-01-01T10:03:00Z', body: 'Good!', direction: 'match' },
      // Match 2: Perfectly balanced (3 user, 3 match)
      { id: '5', matchId: 'm2', senderId: 'user', sentAt: '2024-01-01T11:00:00Z', body: 'Hello', direction: 'user' },
      { id: '6', matchId: 'm2', senderId: 'match2', sentAt: '2024-01-01T11:01:00Z', body: 'Hi', direction: 'match' },
      { id: '7', matchId: 'm2', senderId: 'user', sentAt: '2024-01-01T11:02:00Z', body: 'Test', direction: 'user' },
      { id: '8', matchId: 'm2', senderId: 'match2', sentAt: '2024-01-01T11:03:00Z', body: 'Test', direction: 'match' },
      { id: '9', matchId: 'm2', senderId: 'user', sentAt: '2024-01-01T11:04:00Z', body: 'Cool', direction: 'user' },
      { id: '10', matchId: 'm2', senderId: 'match2', sentAt: '2024-01-01T11:05:00Z', body: 'Cool', direction: 'match' },
    ]

    const analysis = analyzeMessageVolumeBalance(messages)

    expect(analysis.conversationCount).toBe(2)
    expect(analysis.averageBalance).toBe(0.5)
    expect(analysis.balanceDistribution.balanced).toBe(2)
    expect(analysis.balanceDistribution.slightlyImbalanced).toBe(0)
    expect(analysis.balanceDistribution.heavilyImbalanced).toBe(0)
    expect(analysis.userDominatedCount).toBe(0)
    expect(analysis.matchDominatedCount).toBe(0)
  })

  it('identifies user-dominated conversations', () => {
    const messages: NormalizedMessage[] = [
      // User-dominated: 4 user, 1 match
      { id: '1', matchId: 'm1', senderId: 'user', sentAt: '2024-01-01T10:00:00Z', body: 'Hi', direction: 'user' },
      { id: '2', matchId: 'm1', senderId: 'user', sentAt: '2024-01-01T10:01:00Z', body: 'How are you?', direction: 'user' },
      { id: '3', matchId: 'm1', senderId: 'user', sentAt: '2024-01-01T10:02:00Z', body: 'Are you there?', direction: 'user' },
      { id: '4', matchId: 'm1', senderId: 'user', sentAt: '2024-01-01T10:03:00Z', body: 'Hello?', direction: 'user' },
      { id: '5', matchId: 'm1', senderId: 'match1', sentAt: '2024-01-01T10:04:00Z', body: 'Hey', direction: 'match' },
    ]

    const analysis = analyzeMessageVolumeBalance(messages)

    expect(analysis.userDominatedCount).toBe(1)
    expect(analysis.matchDominatedCount).toBe(0)
    expect(analysis.balanceDistribution.heavilyImbalanced).toBe(1)
  })

  it('identifies match-dominated conversations', () => {
    const messages: NormalizedMessage[] = [
      // Match-dominated: 1 user, 4 match
      { id: '1', matchId: 'm1', senderId: 'user', sentAt: '2024-01-01T10:00:00Z', body: 'Hi', direction: 'user' },
      { id: '2', matchId: 'm1', senderId: 'match1', sentAt: '2024-01-01T10:01:00Z', body: 'Hey', direction: 'match' },
      { id: '3', matchId: 'm1', senderId: 'match1', sentAt: '2024-01-01T10:02:00Z', body: 'How are you?', direction: 'match' },
      { id: '4', matchId: 'm1', senderId: 'match1', sentAt: '2024-01-01T10:03:00Z', body: 'What do you do?', direction: 'match' },
      { id: '5', matchId: 'm1', senderId: 'match1', sentAt: '2024-01-01T10:04:00Z', body: 'Hello?', direction: 'match' },
    ]

    const analysis = analyzeMessageVolumeBalance(messages)

    expect(analysis.userDominatedCount).toBe(0)
    expect(analysis.matchDominatedCount).toBe(1)
    expect(analysis.balanceDistribution.heavilyImbalanced).toBe(1)
  })

  it('handles empty messages array', () => {
    const analysis = analyzeMessageVolumeBalance([])

    expect(analysis.conversationCount).toBe(0)
    expect(analysis.averageBalance).toBe(0)
    expect(analysis.balanceDistribution.balanced).toBe(0)
  })
})

describe('analyzeResponseTimingPatterns', () => {
  it('analyzes response timing patterns', () => {
    const messages: NormalizedMessage[] = [
      // Match 1: Fast conversation (5 min responses)
      { id: '1', matchId: 'm1', senderId: 'user', sentAt: '2024-01-01T10:00:00Z', body: 'Hi', direction: 'user' },
      { id: '2', matchId: 'm1', senderId: 'match1', sentAt: '2024-01-01T10:05:00Z', body: 'Hey', direction: 'match' },
      { id: '3', matchId: 'm1', senderId: 'user', sentAt: '2024-01-01T10:10:00Z', body: 'How are you?', direction: 'user' },
      { id: '4', matchId: 'm1', senderId: 'match1', sentAt: '2024-01-01T10:15:00Z', body: 'Good!', direction: 'match' },
      // Match 2: Slow conversation (2 hour responses)
      { id: '5', matchId: 'm2', senderId: 'user', sentAt: '2024-01-01T10:00:00Z', body: 'Hello', direction: 'user' },
      { id: '6', matchId: 'm2', senderId: 'match2', sentAt: '2024-01-01T12:00:00Z', body: 'Hi', direction: 'match' },
      { id: '7', matchId: 'm2', senderId: 'user', sentAt: '2024-01-01T14:00:00Z', body: 'How are you?', direction: 'user' },
    ]

    const analysis = analyzeResponseTimingPatterns(messages)

    expect(analysis.conversationCount).toBe(2)
    expect(analysis.speedDistribution.veryFast).toBe(1) // m1: 5 min avg < 1 hour
    expect(analysis.speedDistribution.fast).toBe(1) // m2: 2 hour avg < 6 hours
    expect(analysis.fastestConversation?.matchId).toBe('m1')
    expect(analysis.slowestConversation?.matchId).toBe('m2')
  })

  it('categorizes conversations by response speed', () => {
    const messages: NormalizedMessage[] = [
      // Very fast: 30 min avg
      { id: '1', matchId: 'm1', senderId: 'user', sentAt: '2024-01-01T10:00:00Z', body: 'Hi', direction: 'user' },
      { id: '2', matchId: 'm1', senderId: 'match1', sentAt: '2024-01-01T10:30:00Z', body: 'Hey', direction: 'match' },
      // Fast: 3 hour avg
      { id: '3', matchId: 'm2', senderId: 'user', sentAt: '2024-01-01T10:00:00Z', body: 'Hi', direction: 'user' },
      { id: '4', matchId: 'm2', senderId: 'match2', sentAt: '2024-01-01T13:00:00Z', body: 'Hey', direction: 'match' },
      // Moderate: 12 hour avg
      { id: '5', matchId: 'm3', senderId: 'user', sentAt: '2024-01-01T10:00:00Z', body: 'Hi', direction: 'user' },
      { id: '6', matchId: 'm3', senderId: 'match3', sentAt: '2024-01-01T22:00:00Z', body: 'Hey', direction: 'match' },
      // Slow: 48 hour avg
      { id: '7', matchId: 'm4', senderId: 'user', sentAt: '2024-01-01T10:00:00Z', body: 'Hi', direction: 'user' },
      { id: '8', matchId: 'm4', senderId: 'match4', sentAt: '2024-01-03T10:00:00Z', body: 'Hey', direction: 'match' },
      // Very slow: 4 day avg
      { id: '9', matchId: 'm5', senderId: 'user', sentAt: '2024-01-01T10:00:00Z', body: 'Hi', direction: 'user' },
      { id: '10', matchId: 'm5', senderId: 'match5', sentAt: '2024-01-05T10:00:00Z', body: 'Hey', direction: 'match' },
    ]

    const analysis = analyzeResponseTimingPatterns(messages)

    expect(analysis.conversationCount).toBe(5)
    expect(analysis.speedDistribution.veryFast).toBe(1)
    expect(analysis.speedDistribution.fast).toBe(1)
    expect(analysis.speedDistribution.moderate).toBe(1)
    expect(analysis.speedDistribution.slow).toBe(1)
    expect(analysis.speedDistribution.verySlow).toBe(1)
  })

  it('handles conversations without response data', () => {
    const messages: NormalizedMessage[] = [
      // Single message conversation (no response data)
      { id: '1', matchId: 'm1', senderId: 'user', sentAt: '2024-01-01T10:00:00Z', body: 'Hi', direction: 'user' },
    ]

    const analysis = analyzeResponseTimingPatterns(messages)

    expect(analysis.conversationCount).toBe(0)
    expect(analysis.overallAverageResponseTime).toBe(0)
  })

  it('handles empty messages array', () => {
    const analysis = analyzeResponseTimingPatterns([])

    expect(analysis.conversationCount).toBe(0)
    expect(analysis.fastestConversation).toBeNull()
    expect(analysis.slowestConversation).toBeNull()
  })
})

describe('analyzeConversationLengthDistribution', () => {
  it('analyzes conversation length distribution', () => {
    const messages: NormalizedMessage[] = [
      // Very short: 3 messages
      { id: '1', matchId: 'm1', senderId: 'user', sentAt: '2024-01-01T10:00:00Z', body: 'Hi', direction: 'user' },
      { id: '2', matchId: 'm1', senderId: 'match1', sentAt: '2024-01-01T10:01:00Z', body: 'Hey', direction: 'match' },
      { id: '3', matchId: 'm1', senderId: 'user', sentAt: '2024-01-01T10:02:00Z', body: 'Bye', direction: 'user' },
      // Short: 10 messages
      ...Array.from({ length: 10 }, (_, i) => ({
        id: `${i + 4}`,
        matchId: 'm2',
        senderId: i % 2 === 0 ? 'user' : 'match2',
        sentAt: `2024-01-01T11:${String(i).padStart(2, '0')}:00Z`,
        body: `Message ${i}`,
        direction: (i % 2 === 0 ? 'user' : 'match') as 'user' | 'match',
      })),
      // Medium: 30 messages
      ...Array.from({ length: 30 }, (_, i) => ({
        id: `${i + 14}`,
        matchId: 'm3',
        senderId: i % 2 === 0 ? 'user' : 'match3',
        sentAt: `2024-01-01T12:${String(i).padStart(2, '0')}:00Z`,
        body: `Message ${i}`,
        direction: (i % 2 === 0 ? 'user' : 'match') as 'user' | 'match',
      })),
    ]

    const analysis = analyzeConversationLengthDistribution(messages)

    expect(analysis.conversationCount).toBe(3)
    expect(analysis.lengthDistribution.veryShort).toBe(1)
    expect(analysis.lengthDistribution.short).toBe(1)
    expect(analysis.lengthDistribution.medium).toBe(1)
    expect(analysis.shortestConversation?.matchId).toBe('m1')
    expect(analysis.shortestConversation?.messageCount).toBe(3)
    expect(analysis.longestConversation?.matchId).toBe('m3')
    expect(analysis.longestConversation?.messageCount).toBe(30)
  })

  it('categorizes conversations by length', () => {
    const messages: NormalizedMessage[] = [
      // Very short: 2 messages
      { id: '1', matchId: 'm1', senderId: 'user', sentAt: '2024-01-01T10:00:00Z', body: 'Hi', direction: 'user' },
      { id: '2', matchId: 'm1', senderId: 'match1', sentAt: '2024-01-01T10:01:00Z', body: 'Hey', direction: 'match' },
      // Short: 15 messages
      ...Array.from({ length: 15 }, (_, i) => ({
        id: `${i + 3}`,
        matchId: 'm2',
        senderId: 'user',
        sentAt: `2024-01-01T11:00:00Z`,
        body: `Msg ${i}`,
        direction: 'user' as const,
      })),
      // Medium: 35 messages
      ...Array.from({ length: 35 }, (_, i) => ({
        id: `${i + 18}`,
        matchId: 'm3',
        senderId: 'user',
        sentAt: `2024-01-01T12:00:00Z`,
        body: `Msg ${i}`,
        direction: 'user' as const,
      })),
      // Long: 75 messages
      ...Array.from({ length: 75 }, (_, i) => ({
        id: `${i + 53}`,
        matchId: 'm4',
        senderId: 'user',
        sentAt: `2024-01-01T13:00:00Z`,
        body: `Msg ${i}`,
        direction: 'user' as const,
      })),
      // Very long: 150 messages
      ...Array.from({ length: 150 }, (_, i) => ({
        id: `${i + 128}`,
        matchId: 'm5',
        senderId: 'user',
        sentAt: `2024-01-01T14:00:00Z`,
        body: `Msg ${i}`,
        direction: 'user' as const,
      })),
    ]

    const analysis = analyzeConversationLengthDistribution(messages)

    expect(analysis.conversationCount).toBe(5)
    expect(analysis.lengthDistribution.veryShort).toBe(1)
    expect(analysis.lengthDistribution.short).toBe(1)
    expect(analysis.lengthDistribution.medium).toBe(1)
    expect(analysis.lengthDistribution.long).toBe(1)
    expect(analysis.lengthDistribution.veryLong).toBe(1)
  })

  it('calculates median message count', () => {
    const messages: NormalizedMessage[] = [
      // 5 messages
      ...Array.from({ length: 5 }, (_, i) => ({
        id: `${i}`,
        matchId: 'm1',
        senderId: 'user',
        sentAt: `2024-01-01T10:00:00Z`,
        body: `Msg ${i}`,
        direction: 'user' as const,
      })),
      // 10 messages
      ...Array.from({ length: 10 }, (_, i) => ({
        id: `${i + 5}`,
        matchId: 'm2',
        senderId: 'user',
        sentAt: `2024-01-01T11:00:00Z`,
        body: `Msg ${i}`,
        direction: 'user' as const,
      })),
      // 15 messages
      ...Array.from({ length: 15 }, (_, i) => ({
        id: `${i + 15}`,
        matchId: 'm3',
        senderId: 'user',
        sentAt: `2024-01-01T12:00:00Z`,
        body: `Msg ${i}`,
        direction: 'user' as const,
      })),
    ]

    const analysis = analyzeConversationLengthDistribution(messages)

    expect(analysis.medianMessageCount).toBe(10) // Middle value of [5, 10, 15]
    expect(analysis.averageMessageCount).toBe(10) // (5 + 10 + 15) / 3
  })

  it('handles empty messages array', () => {
    const analysis = analyzeConversationLengthDistribution([])

    expect(analysis.conversationCount).toBe(0)
    expect(analysis.averageMessageCount).toBe(0)
    expect(analysis.medianMessageCount).toBe(0)
    expect(analysis.shortestConversation).toBeNull()
    expect(analysis.longestConversation).toBeNull()
  })
})

describe('analyzeCoreMetrics', () => {
  it('combines all core metrics', () => {
    const messages: NormalizedMessage[] = [
      { id: '1', matchId: 'm1', senderId: 'user', sentAt: '2024-01-01T10:00:00Z', body: 'Hi', direction: 'user' },
      { id: '2', matchId: 'm1', senderId: 'match1', sentAt: '2024-01-01T10:05:00Z', body: 'Hey', direction: 'match' },
      { id: '3', matchId: 'm1', senderId: 'user', sentAt: '2024-01-01T10:10:00Z', body: 'How are you?', direction: 'user' },
    ]

    const analysis = analyzeCoreMetrics(messages)

    expect(analysis.volumeBalance).toBeDefined()
    expect(analysis.timingPatterns).toBeDefined()
    expect(analysis.lengthDistribution).toBeDefined()

    expect(analysis.volumeBalance.conversationCount).toBe(1)
    expect(analysis.timingPatterns.conversationCount).toBe(1)
    expect(analysis.lengthDistribution.conversationCount).toBe(1)
  })

  it('handles empty messages array', () => {
    const analysis = analyzeCoreMetrics([])

    expect(analysis.volumeBalance.conversationCount).toBe(0)
    expect(analysis.timingPatterns.conversationCount).toBe(0)
    expect(analysis.lengthDistribution.conversationCount).toBe(0)
  })
})
