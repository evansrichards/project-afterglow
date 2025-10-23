/**
 * Tests for Metadata Analyzer
 */

import { describe, it, expect } from 'vitest'
import { analyzeMetadata } from './metadata-analyzer'
import type { AnalyzerInput } from './types'

describe('Metadata Analyzer', () => {
  describe('Volume Metrics', () => {
    it('should calculate basic volume metrics correctly', () => {
      const input: AnalyzerInput = {
        matches: [
          {
            id: 'match-1',
            platform: 'tinder',
            createdAt: '2020-01-15T10:00:00Z',
            status: 'active',
            participants: ['user-1', 'match-1'],
            attributes: {},
          },
          {
            id: 'match-2',
            platform: 'tinder',
            createdAt: '2020-02-20T10:00:00Z',
            status: 'active',
            participants: ['user-1', 'match-2'],
            attributes: {},
          },
        ],
        messages: [
          {
            id: 'msg-1',
            matchId: 'match-1',
            senderId: 'user-1',
            sentAt: '2020-01-15T11:00:00Z',
            body: 'Hello',
            direction: 'user',
          },
          {
            id: 'msg-2',
            matchId: 'match-1',
            senderId: 'match-1',
            sentAt: '2020-01-15T12:00:00Z',
            body: 'Hi there',
            direction: 'match',
          },
          {
            id: 'msg-3',
            matchId: 'match-1',
            senderId: 'user-1',
            sentAt: '2020-01-15T13:00:00Z',
            body: 'How are you?',
            direction: 'user',
          },
        ],
        participants: [
          {
            id: 'user-1',
            platform: 'tinder',
            isUser: true,
          },
        ],
        userId: 'user-1',
      }

      const result = analyzeMetadata(input, 'Tinder')

      expect(result.volume.totalMatches).toBe(2)
      expect(result.volume.totalMessages).toBe(3)
      expect(result.volume.messagesSentByUser).toBe(2)
      expect(result.volume.messagesReceived).toBe(1)
      expect(result.volume.activeConversations).toBe(0) // Need 5+ messages
    })

    it('should identify active conversations (5+ messages)', () => {
      const messages = []
      for (let i = 0; i < 10; i++) {
        messages.push({
          id: `msg-${i}`,
          matchId: 'match-1',
          senderId: i % 2 === 0 ? 'user-1' : 'match-1',
          sentAt: `2020-01-15T${10 + i}:00:00Z`,
          body: `Message ${i}`,
          direction: i % 2 === 0 ? ('user' as const) : ('match' as const),
        })
      }

      const input: AnalyzerInput = {
        matches: [
          {
            id: 'match-1',
            platform: 'tinder',
            createdAt: '2020-01-15T10:00:00Z',
            status: 'active',
            participants: ['user-1', 'match-1'],
            attributes: {},
          },
        ],
        messages,
        participants: [
          {
            id: 'user-1',
            platform: 'tinder',
            isUser: true,
          },
        ],
        userId: 'user-1',
      }

      const result = analyzeMetadata(input, 'Tinder')

      expect(result.volume.activeConversations).toBe(1)
      expect(result.volume.averageMessagesPerConversation).toBe(10)
    })
  })

  describe('Timeline Metrics', () => {
    it('should calculate timeline metrics correctly', () => {
      const input: AnalyzerInput = {
        matches: [
          {
            id: 'match-1',
            platform: 'tinder',
            createdAt: '2020-01-15T10:00:00Z',
            status: 'active',
            participants: ['user-1', 'match-1'],
            attributes: {},
          },
        ],
        messages: [
          {
            id: 'msg-1',
            matchId: 'match-1',
            senderId: 'user-1',
            sentAt: '2020-01-15T11:00:00Z',
            body: 'Hello',
            direction: 'user',
          },
          {
            id: 'msg-2',
            matchId: 'match-1',
            senderId: 'match-1',
            sentAt: '2022-03-08T18:00:00Z',
            body: 'Hi',
            direction: 'match',
          },
        ],
        participants: [
          {
            id: 'user-1',
            platform: 'tinder',
            isUser: true,
          },
        ],
        userId: 'user-1',
      }

      const result = analyzeMetadata(input, 'Tinder')

      expect(result.timeline.firstActivity).toBe('2020-01-15T10:00:00.000Z')
      expect(result.timeline.lastActivity).toBe('2022-03-08T18:00:00.000Z')
      expect(result.timeline.totalDays).toBeGreaterThan(780) // ~2.2 years
      expect(result.timeline.totalDays).toBeLessThan(790)
    })

    it('should handle empty data gracefully', () => {
      const input: AnalyzerInput = {
        matches: [],
        messages: [],
        participants: [
          {
            id: 'user-1',
            platform: 'tinder',
            isUser: true,
          },
        ],
        userId: 'user-1',
      }

      const result = analyzeMetadata(input, 'Tinder')

      expect(result.timeline.firstActivity).toBeNull()
      expect(result.timeline.lastActivity).toBeNull()
      expect(result.timeline.totalDays).toBe(0)
      expect(result.timeline.daysSinceLastActivity).toBe(0)
    })
  })

  describe('Activity Distribution', () => {
    it('should group matches and messages by month', () => {
      const input: AnalyzerInput = {
        matches: [
          {
            id: 'match-1',
            platform: 'tinder',
            createdAt: '2020-06-15T10:00:00Z',
            status: 'active',
            participants: ['user-1', 'match-1'],
            attributes: {},
          },
          {
            id: 'match-2',
            platform: 'tinder',
            createdAt: '2020-06-20T10:00:00Z',
            status: 'active',
            participants: ['user-1', 'match-2'],
            attributes: {},
          },
          {
            id: 'match-3',
            platform: 'tinder',
            createdAt: '2020-07-10T10:00:00Z',
            status: 'active',
            participants: ['user-1', 'match-3'],
            attributes: {},
          },
        ],
        messages: [
          {
            id: 'msg-1',
            matchId: 'match-1',
            senderId: 'user-1',
            sentAt: '2020-06-15T11:00:00Z',
            body: 'Hello',
            direction: 'user',
          },
          {
            id: 'msg-2',
            matchId: 'match-1',
            senderId: 'match-1',
            sentAt: '2020-06-15T12:00:00Z',
            body: 'Hi',
            direction: 'match',
          },
        ],
        participants: [
          {
            id: 'user-1',
            platform: 'tinder',
            isUser: true,
          },
        ],
        userId: 'user-1',
      }

      const result = analyzeMetadata(input, 'Tinder')

      expect(result.distribution.matchesByMonth).toContainEqual({
        month: '2020-06',
        count: 2,
      })
      expect(result.distribution.matchesByMonth).toContainEqual({
        month: '2020-07',
        count: 1,
      })
      expect(result.distribution.messagesByMonth).toContainEqual({
        month: '2020-06',
        count: 2,
      })
    })
  })

  describe('Human-Readable Output', () => {
    it('should generate appropriate summary and assessment', () => {
      const input: AnalyzerInput = {
        matches: [
          {
            id: 'match-1',
            platform: 'tinder',
            createdAt: '2020-01-15T10:00:00Z',
            status: 'active',
            participants: ['user-1', 'match-1'],
            attributes: {},
          },
        ],
        messages: [
          {
            id: 'msg-1',
            matchId: 'match-1',
            senderId: 'user-1',
            sentAt: '2020-01-15T11:00:00Z',
            body: 'Hello',
            direction: 'user',
          },
          {
            id: 'msg-2',
            matchId: 'match-1',
            senderId: 'match-1',
            sentAt: '2022-03-08T18:00:00Z',
            body: 'Hi',
            direction: 'match',
          },
        ],
        participants: [
          {
            id: 'user-1',
            platform: 'tinder',
            isUser: true,
          },
        ],
        userId: 'user-1',
      }

      const result = analyzeMetadata(input, 'Tinder')

      expect(result.summary).toContain('Tinder')
      expect(result.summary).toContain('Jan 2020')
      expect(result.summary).toContain('Mar 2022')

      expect(result.assessment).toContain('Tinder')
      expect(result.assessment).toContain('match')
    })

    it('should handle empty data with appropriate message', () => {
      const input: AnalyzerInput = {
        matches: [],
        messages: [],
        participants: [
          {
            id: 'user-1',
            platform: 'tinder',
            isUser: true,
          },
        ],
        userId: 'user-1',
      }

      const result = analyzeMetadata(input, 'Tinder')

      expect(result.summary).toContain('No activity data available')
      expect(result.assessment).toContain('No activity found')
    })
  })

  describe('Platform Information', () => {
    it('should include platform name in result', () => {
      const input: AnalyzerInput = {
        matches: [],
        messages: [],
        participants: [
          {
            id: 'user-1',
            platform: 'hinge',
            isUser: true,
          },
        ],
        userId: 'user-1',
      }

      const result = analyzeMetadata(input, 'Hinge')

      expect(result.platform).toBe('Hinge')
    })
  })
})
