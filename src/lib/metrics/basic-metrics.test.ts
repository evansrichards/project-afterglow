/**
 * Tests for basic metrics calculations
 */

import { describe, it, expect } from 'vitest'
import {
  calculateMessageCounts,
  calculateResponseTimes,
  calculateConversationLength,
  calculateConversationMetrics,
  calculateAggregateMetrics,
  formatDuration,
} from './basic-metrics'
import type { NormalizedMessage } from '@/types/data-model'

describe('calculateMessageCounts', () => {
  it('calculates counts for balanced conversation', () => {
    const messages: NormalizedMessage[] = [
      { id: '1', matchId: 'm1', senderId: 'user', sentAt: '2024-01-01T10:00:00Z', body: 'Hi', direction: 'user' },
      { id: '2', matchId: 'm1', senderId: 'match1', sentAt: '2024-01-01T10:01:00Z', body: 'Hey', direction: 'match' },
      { id: '3', matchId: 'm1', senderId: 'user', sentAt: '2024-01-01T10:02:00Z', body: 'How are you?', direction: 'user' },
      { id: '4', matchId: 'm1', senderId: 'match1', sentAt: '2024-01-01T10:03:00Z', body: 'Good!', direction: 'match' },
    ]

    const metrics = calculateMessageCounts(messages)

    expect(metrics.total).toBe(4)
    expect(metrics.userMessages).toBe(2)
    expect(metrics.matchMessages).toBe(2)
    expect(metrics.userRatio).toBe(0.5)
    expect(metrics.matchRatio).toBe(0.5)
    expect(metrics.balance).toBe(0.5) // Perfect balance
  })

  it('calculates counts for imbalanced conversation (user-heavy)', () => {
    const messages: NormalizedMessage[] = [
      { id: '1', matchId: 'm1', senderId: 'user', sentAt: '2024-01-01T10:00:00Z', body: 'Hi', direction: 'user' },
      { id: '2', matchId: 'm1', senderId: 'user', sentAt: '2024-01-01T10:01:00Z', body: 'Hello?', direction: 'user' },
      { id: '3', matchId: 'm1', senderId: 'user', sentAt: '2024-01-01T10:02:00Z', body: 'Are you there?', direction: 'user' },
      { id: '4', matchId: 'm1', senderId: 'match1', sentAt: '2024-01-01T10:03:00Z', body: 'Sorry!', direction: 'match' },
    ]

    const metrics = calculateMessageCounts(messages)

    expect(metrics.total).toBe(4)
    expect(metrics.userMessages).toBe(3)
    expect(metrics.matchMessages).toBe(1)
    expect(metrics.userRatio).toBe(0.75)
    expect(metrics.matchRatio).toBe(0.25)
    expect(metrics.balance).toBe(0.25) // Imbalanced
  })

  it('handles empty conversation', () => {
    const metrics = calculateMessageCounts([])

    expect(metrics.total).toBe(0)
    expect(metrics.userMessages).toBe(0)
    expect(metrics.matchMessages).toBe(0)
    expect(metrics.userRatio).toBe(0)
    expect(metrics.matchRatio).toBe(0)
    expect(metrics.balance).toBe(0) // Complete imbalance when no messages
  })

  it('handles single message', () => {
    const messages: NormalizedMessage[] = [
      { id: '1', matchId: 'm1', senderId: 'user', sentAt: '2024-01-01T10:00:00Z', body: 'Hi', direction: 'user' },
    ]

    const metrics = calculateMessageCounts(messages)

    expect(metrics.total).toBe(1)
    expect(metrics.userMessages).toBe(1)
    expect(metrics.matchMessages).toBe(0)
    expect(metrics.userRatio).toBe(1)
    expect(metrics.matchRatio).toBe(0)
    expect(metrics.balance).toBe(0) // Completely imbalanced
  })
})

describe('calculateResponseTimes', () => {
  it('calculates response times for alternating conversation', () => {
    const messages: NormalizedMessage[] = [
      { id: '1', matchId: 'm1', senderId: 'user', sentAt: '2024-01-01T10:00:00Z', body: 'Hi', direction: 'user' },
      { id: '2', matchId: 'm1', senderId: 'match1', sentAt: '2024-01-01T10:05:00Z', body: 'Hey', direction: 'match' }, // 5 min
      { id: '3', matchId: 'm1', senderId: 'user', sentAt: '2024-01-01T10:10:00Z', body: 'How are you?', direction: 'user' }, // 5 min
      { id: '4', matchId: 'm1', senderId: 'match1', sentAt: '2024-01-01T10:25:00Z', body: 'Good!', direction: 'match' }, // 15 min
    ]

    const metrics = calculateResponseTimes(messages)

    expect(metrics).toBeDefined()
    expect(metrics!.sampleCount).toBe(3)
    expect(metrics!.averageResponseTime).toBeCloseTo(8.333333333333334 * 60 * 1000, 0) // (5+5+15)/3 = 8.33 minutes
    expect(metrics!.medianResponseTime).toBe(5 * 60 * 1000) // 5 minutes
    expect(metrics!.fastestResponse).toBe(5 * 60 * 1000)
    expect(metrics!.slowestResponse).toBe(15 * 60 * 1000)
  })

  it('calculates separate user and match response times', () => {
    const messages: NormalizedMessage[] = [
      { id: '1', matchId: 'm1', senderId: 'user', sentAt: '2024-01-01T10:00:00Z', body: 'Hi', direction: 'user' },
      { id: '2', matchId: 'm1', senderId: 'match1', sentAt: '2024-01-01T10:10:00Z', body: 'Hey', direction: 'match' }, // Match: 10 min
      { id: '3', matchId: 'm1', senderId: 'user', sentAt: '2024-01-01T10:15:00Z', body: 'How are you?', direction: 'user' }, // User: 5 min
      { id: '4', matchId: 'm1', senderId: 'match1', sentAt: '2024-01-01T10:35:00Z', body: 'Good!', direction: 'match' }, // Match: 20 min
    ]

    const metrics = calculateResponseTimes(messages)

    expect(metrics).toBeDefined()
    expect(metrics!.averageUserResponse).toBe(5 * 60 * 1000) // 5 minutes
    expect(metrics!.averageMatchResponse).toBe(15 * 60 * 1000) // (10+20)/2 = 15 minutes
  })

  it('returns undefined for single message', () => {
    const messages: NormalizedMessage[] = [
      { id: '1', matchId: 'm1', senderId: 'user', sentAt: '2024-01-01T10:00:00Z', body: 'Hi', direction: 'user' },
    ]

    const metrics = calculateResponseTimes(messages)
    expect(metrics).toBeUndefined()
  })

  it('returns undefined for empty conversation', () => {
    const metrics = calculateResponseTimes([])
    expect(metrics).toBeUndefined()
  })

  it('ignores consecutive messages from same sender', () => {
    const messages: NormalizedMessage[] = [
      { id: '1', matchId: 'm1', senderId: 'user', sentAt: '2024-01-01T10:00:00Z', body: 'Hi', direction: 'user' },
      { id: '2', matchId: 'm1', senderId: 'user', sentAt: '2024-01-01T10:01:00Z', body: 'Hello?', direction: 'user' },
      { id: '3', matchId: 'm1', senderId: 'match1', sentAt: '2024-01-01T10:10:00Z', body: 'Hey', direction: 'match' }, // 10 min from first user message
    ]

    const metrics = calculateResponseTimes(messages)

    expect(metrics).toBeDefined()
    expect(metrics!.sampleCount).toBe(1) // Only one actual response
    expect(metrics!.averageResponseTime).toBe(10 * 60 * 1000)
  })
})

describe('formatDuration', () => {
  it('formats seconds', () => {
    expect(formatDuration(30 * 1000)).toBe('30s')
  })

  it('formats minutes', () => {
    expect(formatDuration(5 * 60 * 1000)).toBe('5m')
  })

  it('formats hours', () => {
    expect(formatDuration(3 * 60 * 60 * 1000)).toBe('3h')
  })

  it('formats hours and minutes', () => {
    expect(formatDuration(3.5 * 60 * 60 * 1000)).toBe('3h 30m')
  })

  it('formats days', () => {
    expect(formatDuration(2 * 24 * 60 * 60 * 1000)).toBe('2d')
  })

  it('formats days and hours', () => {
    expect(formatDuration(2.5 * 24 * 60 * 60 * 1000)).toBe('2d 12h')
  })
})

describe('calculateConversationLength', () => {
  it('calculates length for conversation', () => {
    const messages: NormalizedMessage[] = [
      { id: '1', matchId: 'm1', senderId: 'user', sentAt: '2024-01-01T10:00:00Z', body: 'Hi', direction: 'user' },
      { id: '2', matchId: 'm1', senderId: 'match1', sentAt: '2024-01-01T10:30:00Z', body: 'Hey', direction: 'match' },
      { id: '3', matchId: 'm1', senderId: 'user', sentAt: '2024-01-01T11:00:00Z', body: 'How are you?', direction: 'user' },
    ]

    const metrics = calculateConversationLength(messages)

    expect(metrics.messageCount).toBe(3)
    expect(metrics.firstMessageAt).toBe('2024-01-01T10:00:00Z')
    expect(metrics.lastMessageAt).toBe('2024-01-01T11:00:00Z')
    expect(metrics.duration).toBe(60 * 60 * 1000) // 1 hour
    expect(metrics.durationFormatted).toBe('1h')
    expect(metrics.messagesPerDay).toBeCloseTo(72, 0) // 3 messages in 1 hour = 72 per day
  })

  it('handles empty conversation', () => {
    const metrics = calculateConversationLength([])

    expect(metrics.messageCount).toBe(0)
    expect(metrics.duration).toBe(0)
    expect(metrics.durationFormatted).toBe('0s')
    expect(metrics.messagesPerDay).toBe(0)
  })

  it('handles single message', () => {
    const messages: NormalizedMessage[] = [
      { id: '1', matchId: 'm1', senderId: 'user', sentAt: '2024-01-01T10:00:00Z', body: 'Hi', direction: 'user' },
    ]

    const metrics = calculateConversationLength(messages)

    expect(metrics.messageCount).toBe(1)
    expect(metrics.duration).toBe(0) // No duration for single message
    expect(metrics.messagesPerDay).toBe(1) // Treat as 1 message per "instant"
  })

  it('calculates messages per day correctly', () => {
    const messages: NormalizedMessage[] = [
      { id: '1', matchId: 'm1', senderId: 'user', sentAt: '2024-01-01T10:00:00Z', body: 'Hi', direction: 'user' },
      { id: '2', matchId: 'm1', senderId: 'match1', sentAt: '2024-01-03T10:00:00Z', body: 'Hey', direction: 'match' },
    ]

    const metrics = calculateConversationLength(messages)

    expect(metrics.messageCount).toBe(2)
    expect(metrics.duration).toBe(2 * 24 * 60 * 60 * 1000) // 2 days
    expect(metrics.messagesPerDay).toBe(1) // 2 messages over 2 days = 1 per day
  })
})

describe('calculateConversationMetrics', () => {
  it('combines all metrics for a conversation', () => {
    const messages: NormalizedMessage[] = [
      { id: '1', matchId: 'm1', senderId: 'user', sentAt: '2024-01-01T10:00:00Z', body: 'Hi', direction: 'user' },
      { id: '2', matchId: 'm1', senderId: 'match1', sentAt: '2024-01-01T10:05:00Z', body: 'Hey', direction: 'match' },
    ]

    const metrics = calculateConversationMetrics('m1', messages)

    expect(metrics.matchId).toBe('m1')
    expect(metrics.messageCounts.total).toBe(2)
    expect(metrics.responseTimes).toBeDefined()
    expect(metrics.conversationLength.messageCount).toBe(2)
  })
})

describe('calculateAggregateMetrics', () => {
  it('calculates aggregate statistics across conversations', () => {
    const messages1: NormalizedMessage[] = [
      { id: '1', matchId: 'm1', senderId: 'user', sentAt: '2024-01-01T10:00:00Z', body: 'Hi', direction: 'user' },
      { id: '2', matchId: 'm1', senderId: 'match1', sentAt: '2024-01-01T10:05:00Z', body: 'Hey', direction: 'match' },
      { id: '3', matchId: 'm1', senderId: 'user', sentAt: '2024-01-01T10:10:00Z', body: 'How are you?', direction: 'user' },
    ]

    const messages2: NormalizedMessage[] = [
      { id: '4', matchId: 'm2', senderId: 'user', sentAt: '2024-01-02T10:00:00Z', body: 'Hi', direction: 'user' },
      { id: '5', matchId: 'm2', senderId: 'match2', sentAt: '2024-01-02T10:10:00Z', body: 'Hey', direction: 'match' },
    ]

    const conversationMetrics = [
      calculateConversationMetrics('m1', messages1),
      calculateConversationMetrics('m2', messages2),
    ]

    const aggregate = calculateAggregateMetrics(conversationMetrics)

    expect(aggregate.totalConversations).toBe(2)
    expect(aggregate.totalMessages).toBe(5)
    expect(aggregate.averageMessagesPerConversation).toBe(2.5)
    expect(aggregate.longestConversation).toBe(3)
    expect(aggregate.shortestConversation).toBe(2)
    expect(aggregate.medianConversationLength).toBe(2.5)
  })

  it('handles empty metrics array', () => {
    const aggregate = calculateAggregateMetrics([])

    expect(aggregate.totalConversations).toBe(0)
    expect(aggregate.totalMessages).toBe(0)
    expect(aggregate.averageMessagesPerConversation).toBe(0)
  })

  it('calculates average balance correctly', () => {
    const messages1: NormalizedMessage[] = [
      { id: '1', matchId: 'm1', senderId: 'user', sentAt: '2024-01-01T10:00:00Z', body: 'Hi', direction: 'user' },
      { id: '2', matchId: 'm1', senderId: 'match1', sentAt: '2024-01-01T10:05:00Z', body: 'Hey', direction: 'match' },
    ]

    const messages2: NormalizedMessage[] = [
      { id: '3', matchId: 'm2', senderId: 'user', sentAt: '2024-01-02T10:00:00Z', body: 'Hi', direction: 'user' },
      { id: '4', matchId: 'm2', senderId: 'user', sentAt: '2024-01-02T10:05:00Z', body: 'Hello?', direction: 'user' },
      { id: '5', matchId: 'm2', senderId: 'user', sentAt: '2024-01-02T10:10:00Z', body: 'Are you there?', direction: 'user' },
      { id: '6', matchId: 'm2', senderId: 'match2', sentAt: '2024-01-02T10:15:00Z', body: 'Sorry!', direction: 'match' },
    ]

    const conversationMetrics = [
      calculateConversationMetrics('m1', messages1), // balance = 0.5
      calculateConversationMetrics('m2', messages2), // balance = 0.25
    ]

    const aggregate = calculateAggregateMetrics(conversationMetrics)

    expect(aggregate.averageBalance).toBe(0.375) // (0.5 + 0.25) / 2
  })
})
