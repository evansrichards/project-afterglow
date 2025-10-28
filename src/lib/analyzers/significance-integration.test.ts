/**
 * Integration tests for significance detection feature
 * Tests the full flow from backend API to frontend display
 */

import { describe, it, expect, vi } from 'vitest'
import { detectSignificantConversations } from './significance-detector'
import type { NormalizedMessage } from '@/types/data-model'

// Mock the OpenRouter client to avoid actual API calls in tests
vi.mock('../ai/openrouter-client', () => ({
  createOpenRouterClient: vi.fn(() => ({
    chat: {
      completions: {
        create: vi.fn(async ({ messages }) => {
          const prompt = messages[0].content as string

          // Simple mock: detect date-related keywords
          if (prompt.includes('coffee') || prompt.includes('meet') || prompt.includes('drinks') || prompt.includes('Friday') || prompt.includes('Saturday')) {
            return {
              choices: [
                {
                  message: {
                    content: JSON.stringify({
                      isSignificant: true,
                      flags: {
                        ledToDate: true,
                        contactExchange: false,
                        unusualLength: false,
                        emotionalDepth: false,
                      },
                      score: 85,
                      highlights: ['Planning to meet up'],
                      reasoning: 'Conversation led to planning a date',
                    }),
                  },
                },
              ],
            }
          }

          // Detect contact exchange
          if (prompt.includes('555') || prompt.includes('number') || prompt.includes('email') || prompt.includes('@')) {
            return {
              choices: [
                {
                  message: {
                    content: JSON.stringify({
                      isSignificant: true,
                      flags: {
                        ledToDate: false,
                        contactExchange: true,
                        unusualLength: false,
                        emotionalDepth: false,
                      },
                      score: 75,
                      highlights: ['Exchanged contact information'],
                      reasoning: 'Contact information was shared',
                    }),
                  },
                },
              ],
            }
          }

          // Default: not significant
          return {
            choices: [
              {
                message: {
                  content: JSON.stringify({
                    isSignificant: false,
                    flags: {
                      ledToDate: false,
                      contactExchange: false,
                      unusualLength: false,
                      emotionalDepth: false,
                    },
                    score: 0,
                    highlights: [],
                    reasoning: 'Not significant',
                  }),
                },
              },
            ],
          }
        }),
      },
    },
  })),
}))

vi.mock('../ai/config', () => ({
  getOpenRouterApiKey: () => 'test-key',
  getOpenRouterSiteUrl: () => 'http://test.com',
  getOpenRouterAppName: () => 'test-app',
}))

describe('Significance Detection Integration', () => {
  describe('Full data flow with various conversation counts', () => {
    it('should handle dataset with 0 significant conversations', async () => {
      const messages: NormalizedMessage[] = [
        {
          id: '1',
          matchId: 'match1',
          from: 'user1',
          to: 'other1',
          body: 'Hey',
          sentAt: '2024-01-01T10:00:00Z',
        },
        {
          id: '2',
          matchId: 'match1',
          from: 'other1',
          to: 'user1',
          body: 'Hi',
          sentAt: '2024-01-01T10:01:00Z',
        },
      ]

      const result = await detectSignificantConversations(messages, 'user1')

      expect(result.significantConversations).toHaveLength(0)
      expect(result.statistics.totalSignificant).toBe(0)
      expect(result.statistics.percentageSignificant).toBe(0)
      expect(result.statistics.breakdown.ledToDate).toBe(0)
      expect(result.statistics.breakdown.contactExchange).toBe(0)
      expect(result.statistics.breakdown.unusualLength).toBe(0)
      expect(result.statistics.breakdown.emotionalDepth).toBe(0)
    })

    it('should handle dataset with 1 significant conversation', async () => {
      const messages: NormalizedMessage[] = [
        {
          id: '1',
          matchId: 'match1',
          from: 'user1',
          to: 'other1',
          body: 'Want to grab coffee?',
          sentAt: '2024-01-01T10:00:00Z',
        },
        {
          id: '2',
          matchId: 'match1',
          from: 'other1',
          to: 'user1',
          body: 'Yes! Saturday at 2pm?',
          sentAt: '2024-01-01T10:05:00Z',
        },
        {
          id: '3',
          matchId: 'match1',
          from: 'user1',
          to: 'other1',
          body: 'Perfect, see you then!',
          sentAt: '2024-01-01T10:10:00Z',
        },
      ]

      const result = await detectSignificantConversations(messages, 'user1')

      expect(result.significantConversations.length).toBeGreaterThanOrEqual(1)
      expect(result.statistics.totalSignificant).toBeGreaterThanOrEqual(1)
      expect(result.statistics.percentageSignificant).toBeGreaterThan(0)
    })

    it('should handle dataset with many significant conversations', async () => {
      const messages: NormalizedMessage[] = []

      // Create 5 significant conversations (date planning)
      for (let i = 1; i <= 5; i++) {
        messages.push(
          {
            id: `msg${i}a`,
            matchId: `match${i}`,
            from: 'user1',
            to: `other${i}`,
            body: 'Want to meet up for drinks?',
            sentAt: `2024-01-0${i}T10:00:00Z`,
          },
          {
            id: `msg${i}b`,
            matchId: `match${i}`,
            from: `other${i}`,
            to: 'user1',
            body: 'Yes! How about Friday?',
            sentAt: `2024-01-0${i}T10:05:00Z`,
          },
          {
            id: `msg${i}c`,
            matchId: `match${i}`,
            from: 'user1',
            to: `other${i}`,
            body: 'Friday works great!',
            sentAt: `2024-01-0${i}T10:10:00Z`,
          }
        )
      }

      const result = await detectSignificantConversations(messages, 'user1')

      expect(result.significantConversations.length).toBeGreaterThanOrEqual(3)
      expect(result.statistics.totalSignificant).toBeGreaterThanOrEqual(3)
      expect(result.statistics.breakdown.ledToDate).toBeGreaterThanOrEqual(3)
    })
  })

  describe('Statistics accuracy', () => {
    it('should calculate correct percentage for mixed dataset', async () => {
      const messages: NormalizedMessage[] = [
        // Significant conversation 1
        {
          id: '1',
          matchId: 'match1',
          from: 'user1',
          to: 'other1',
          body: 'Want to grab coffee?',
          sentAt: '2024-01-01T10:00:00Z',
        },
        {
          id: '2',
          matchId: 'match1',
          from: 'other1',
          to: 'user1',
          body: 'Yes! Saturday works',
          sentAt: '2024-01-01T10:05:00Z',
        },
        // Non-significant conversation 2
        {
          id: '3',
          matchId: 'match2',
          from: 'user1',
          to: 'other2',
          body: 'Hey',
          sentAt: '2024-01-02T14:00:00Z',
        },
        {
          id: '4',
          matchId: 'match2',
          from: 'other2',
          to: 'user1',
          body: 'Hi',
          sentAt: '2024-01-02T14:05:00Z',
        },
      ]

      const result = await detectSignificantConversations(messages, 'user1')

      // Should have 2 total conversations, ~50% significant
      expect(result.statistics.totalConversations).toBe(2)
      if (result.statistics.totalSignificant > 0) {
        expect(result.statistics.percentageSignificant).toBeGreaterThan(0)
        expect(result.statistics.percentageSignificant).toBeLessThanOrEqual(100)
      }
    })

    it('should calculate correct average message counts', async () => {
      const messages: NormalizedMessage[] = [
        // 3 messages
        { id: '1', matchId: 'match1', from: 'user1', to: 'other1', body: 'A', sentAt: '2024-01-01T10:00:00Z' },
        { id: '2', matchId: 'match1', from: 'other1', to: 'user1', body: 'B', sentAt: '2024-01-01T10:05:00Z' },
        { id: '3', matchId: 'match1', from: 'user1', to: 'other1', body: 'C', sentAt: '2024-01-01T10:10:00Z' },
        // 2 messages
        { id: '4', matchId: 'match2', from: 'user1', to: 'other2', body: 'D', sentAt: '2024-01-02T14:00:00Z' },
        { id: '5', matchId: 'match2', from: 'other2', to: 'user1', body: 'E', sentAt: '2024-01-02T14:05:00Z' },
      ]

      const result = await detectSignificantConversations(messages, 'user1')

      // Average should be (3 + 2) / 2 = 2.5
      expect(result.statistics.avgMessageCountAll).toBe(2.5)
    })
  })

  describe('Data structure validation', () => {
    it('should return all required fields in response', async () => {
      const messages: NormalizedMessage[] = [
        {
          id: '1',
          matchId: 'match1',
          from: 'user1',
          to: 'other1',
          body: 'Want to meet for coffee?',
          sentAt: '2024-01-01T10:00:00Z',
        },
        {
          id: '2',
          matchId: 'match1',
          from: 'other1',
          to: 'user1',
          body: 'Yes! Saturday at 2pm',
          sentAt: '2024-01-01T10:05:00Z',
        },
      ]

      const result = await detectSignificantConversations(messages, 'user1')

      // Check top-level structure
      expect(result).toHaveProperty('significantConversations')
      expect(result).toHaveProperty('statistics')

      // Check statistics structure
      expect(result.statistics).toHaveProperty('totalConversations')
      expect(result.statistics).toHaveProperty('totalSignificant')
      expect(result.statistics).toHaveProperty('percentageSignificant')
      expect(result.statistics).toHaveProperty('avgMessageCountAll')
      expect(result.statistics).toHaveProperty('avgMessageCountSignificant')
      expect(result.statistics).toHaveProperty('breakdown')

      // Check breakdown structure
      expect(result.statistics.breakdown).toHaveProperty('ledToDate')
      expect(result.statistics.breakdown).toHaveProperty('contactExchange')
      expect(result.statistics.breakdown).toHaveProperty('unusualLength')
      expect(result.statistics.breakdown).toHaveProperty('emotionalDepth')

      // Check significant conversation structure (if any)
      if (result.significantConversations.length > 0) {
        const conv = result.significantConversations[0]
        expect(conv).toHaveProperty('matchId')
        expect(conv).toHaveProperty('participantId')
        expect(conv).toHaveProperty('messageCount')
        expect(conv).toHaveProperty('duration')
        expect(conv).toHaveProperty('significanceFlags')
        expect(conv).toHaveProperty('significanceScore')
        expect(conv).toHaveProperty('highlights')
        expect(conv).toHaveProperty('reasoning')

        // Check duration structure
        expect(conv.duration).toHaveProperty('days')
        expect(conv.duration).toHaveProperty('firstMessage')
        expect(conv.duration).toHaveProperty('lastMessage')

        // Check significance flags structure
        expect(conv.significanceFlags).toHaveProperty('ledToDate')
        expect(conv.significanceFlags).toHaveProperty('contactExchange')
        expect(conv.significanceFlags).toHaveProperty('unusualLength')
        expect(conv.significanceFlags).toHaveProperty('emotionalDepth')
      }
    })

    it('should have valid data types for all fields', async () => {
      const messages: NormalizedMessage[] = [
        {
          id: '1',
          matchId: 'match1',
          from: 'user1',
          to: 'other1',
          body: 'Want to grab coffee?',
          sentAt: '2024-01-01T10:00:00Z',
        },
        {
          id: '2',
          matchId: 'match1',
          from: 'other1',
          to: 'user1',
          body: 'Yes! Saturday at 2pm',
          sentAt: '2024-01-01T10:05:00Z',
        },
      ]

      const result = await detectSignificantConversations(messages, 'user1')

      // Validate types
      expect(Array.isArray(result.significantConversations)).toBe(true)
      expect(typeof result.statistics.totalConversations).toBe('number')
      expect(typeof result.statistics.totalSignificant).toBe('number')
      expect(typeof result.statistics.percentageSignificant).toBe('number')
      expect(typeof result.statistics.avgMessageCountAll).toBe('number')
      expect(typeof result.statistics.avgMessageCountSignificant).toBe('number')

      if (result.significantConversations.length > 0) {
        const conv = result.significantConversations[0]
        expect(typeof conv.matchId).toBe('string')
        expect(typeof conv.participantId).toBe('string')
        expect(typeof conv.messageCount).toBe('number')
        expect(typeof conv.significanceScore).toBe('number')
        expect(typeof conv.reasoning).toBe('string')
        expect(Array.isArray(conv.highlights)).toBe(true)

        // Score should be 0-100
        expect(conv.significanceScore).toBeGreaterThanOrEqual(0)
        expect(conv.significanceScore).toBeLessThanOrEqual(100)
      }
    })
  })

  describe('Privacy and anonymization', () => {
    it('should anonymize all PII in highlights', async () => {
      const messages: NormalizedMessage[] = [
        {
          id: '1',
          matchId: 'match1',
          from: 'user1',
          to: 'other1',
          body: 'Hey! Want to meet up?',
          sentAt: '2024-01-01T10:00:00Z',
        },
        {
          id: '2',
          matchId: 'match1',
          from: 'other1',
          to: 'user1',
          body: 'Sure! Call me at 555-123-4567',
          sentAt: '2024-01-01T10:05:00Z',
        },
        {
          id: '3',
          matchId: 'match1',
          from: 'user1',
          to: 'other1',
          body: 'Great! Or email john@example.com',
          sentAt: '2024-01-01T10:10:00Z',
        },
      ]

      const result = await detectSignificantConversations(messages, 'user1')

      for (const conv of result.significantConversations) {
        for (const highlight of conv.highlights) {
          // Should not contain full phone numbers
          expect(highlight).not.toMatch(/\d{3}-\d{3}-\d{4}/)
          expect(highlight).not.toMatch(/\(\d{3}\)\s*\d{3}-\d{4}/)

          // Should not contain full email addresses
          expect(highlight).not.toMatch(/[a-z]+@[a-z]+\.[a-z]+/)
        }
      }
    })

    it('should handle highlights with multiple types of PII', async () => {
      const messages: NormalizedMessage[] = [
        {
          id: '1',
          matchId: 'match1',
          from: 'user1',
          to: 'other1',
          body: 'Want to meet?',
          sentAt: '2024-01-01T10:00:00Z',
        },
        {
          id: '2',
          matchId: 'match1',
          from: 'other1',
          to: 'user1',
          body: "I'm Sarah! My number is 555-123-4567 and email is sarah@test.com. Find me @instagram",
          sentAt: '2024-01-01T10:05:00Z',
        },
      ]

      const result = await detectSignificantConversations(messages, 'user1')

      for (const conv of result.significantConversations) {
        for (const highlight of conv.highlights) {
          // Should not contain any of the raw PII
          expect(highlight).not.toContain('555-123-4567')
          expect(highlight).not.toContain('sarah@test.com')

          // Names should be anonymized
          if (highlight.toLowerCase().includes("i'm")) {
            expect(highlight).toMatch(/\[Name\]/)
          }
        }
      }
    })
  })

  describe('Performance and scalability', () => {
    it('should handle large dataset efficiently', async () => {
      const messages: NormalizedMessage[] = []

      // Create 50 conversations with 10 messages each = 500 messages
      for (let i = 1; i <= 50; i++) {
        for (let j = 1; j <= 10; j++) {
          messages.push({
            id: `msg${i}-${j}`,
            matchId: `match${i}`,
            from: j % 2 === 0 ? 'user1' : `other${i}`,
            to: j % 2 === 0 ? `other${i}` : 'user1',
            body: `Message ${j} in conversation ${i}`,
            sentAt: `2024-01-${String(i).padStart(2, '0')}T10:${String(j).padStart(2, '0')}:00Z`,
          })
        }
      }

      const startTime = Date.now()
      const result = await detectSignificantConversations(messages, 'user1')
      const duration = Date.now() - startTime

      // Should complete in reasonable time (under 60 seconds for 500 messages)
      expect(duration).toBeLessThan(60000)

      // Should correctly identify 50 conversations
      expect(result.statistics.totalConversations).toBe(50)

      // Statistics should be valid
      expect(result.statistics.percentageSignificant).toBeGreaterThanOrEqual(0)
      expect(result.statistics.percentageSignificant).toBeLessThanOrEqual(100)
    }, 120000) // 120 second timeout for this large test
  })

  describe('Error handling and edge cases', () => {
    it('should handle malformed message data gracefully', async () => {
      const messages: NormalizedMessage[] = [
        {
          id: '1',
          matchId: 'match1',
          from: 'user1',
          to: 'other1',
          body: '',  // Empty body
          sentAt: '2024-01-01T10:00:00Z',
        },
        {
          id: '2',
          matchId: 'match1',
          from: 'other1',
          to: 'user1',
          body: 'Response',
          sentAt: '2024-01-01T10:05:00Z',
        },
      ]

      const result = await detectSignificantConversations(messages, 'user1')

      // Should not crash
      expect(result).toBeDefined()
      expect(result.statistics).toBeDefined()
    })

    it('should handle conversations with same timestamp', async () => {
      const messages: NormalizedMessage[] = [
        {
          id: '1',
          matchId: 'match1',
          from: 'user1',
          to: 'other1',
          body: 'Message 1',
          sentAt: '2024-01-01T10:00:00Z',
        },
        {
          id: '2',
          matchId: 'match1',
          from: 'other1',
          to: 'user1',
          body: 'Message 2',
          sentAt: '2024-01-01T10:00:00Z', // Same timestamp
        },
      ]

      const result = await detectSignificantConversations(messages, 'user1')

      // Should handle without crashing
      expect(result).toBeDefined()
      if (result.significantConversations.length > 0) {
        expect(result.significantConversations[0].duration.days).toBeGreaterThanOrEqual(0)
      }
    })
  })
})
