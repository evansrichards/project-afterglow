/**
 * Tests for Significance Detector
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  groupMessagesByMatch,
  detectSignificantConversations,
  type SignificantConversation,
} from './significance-detector'
import type { NormalizedMessage } from '@/types/data-model'

// Mock the OpenRouter client
vi.mock('../ai/openrouter-client', () => ({
  createOpenRouterClient: vi.fn(() => ({
    chat: {
      completions: {
        create: vi.fn(async ({ messages }) => {
          const prompt = messages[0].content as string

          // Mock AI responses based on conversation content and characteristics
          // Check message count from prompt (e.g., "this one has 50 messages")
          const messageCountMatch = prompt.match(/this one has (\d+) messages/)
          const messageCount = messageCountMatch ? parseInt(messageCountMatch[1]) : 0

          // Debug: Check for "number" appearing in prompt which might be mismatching
          if (prompt.includes('Long conversation message') && !prompt.includes('phone') && !prompt.includes('555')) {
            console.log(`[Mock Debug] Found long conversation message, count: ${messageCount}, prompt snippet: ${prompt.substring(0, 200)}`)
          }

          // Date planning indicators
          if (prompt.includes('coffee') || prompt.includes('meet up') || prompt.includes('meet for coffee')) {
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
                      highlights: ['Agreed to meet for coffee'],
                      reasoning: 'Conversation led to planning a date',
                    }),
                  },
                },
              ],
            }
          }

          // Contact exchange indicators
          if (prompt.includes('phone') || prompt.includes('number') || prompt.includes('555-1234')) {
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
                      highlights: ['Exchanged phone numbers'],
                      reasoning: 'Contact information was shared',
                    }),
                  },
                },
              ],
            }
          }

          // Emotional depth indicators
          if (prompt.includes('feeling') || prompt.includes('family') || prompt.includes('anxious') || prompt.includes('struggles')) {
            return {
              choices: [
                {
                  message: {
                    content: JSON.stringify({
                      isSignificant: true,
                      flags: {
                        ledToDate: false,
                        contactExchange: false,
                        unusualLength: false,
                        emotionalDepth: true,
                      },
                      score: 80,
                      highlights: ['Shared personal stories about family'],
                      reasoning: 'Conversation showed emotional depth and vulnerability',
                    }),
                  },
                },
              ],
            }
          }

          // Long conversation (based on message count)
          if (messageCount >= 40) {
            return {
              choices: [
                {
                  message: {
                    content: JSON.stringify({
                      isSignificant: true,
                      flags: {
                        ledToDate: false,
                        contactExchange: false,
                        unusualLength: true,
                        emotionalDepth: false,
                      },
                      score: 70,
                      highlights: ['Extended multi-day conversation'],
                      reasoning: 'Unusually long conversation with sustained engagement',
                    }),
                  },
                },
              ],
            }
          }

          // Not significant
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

// Mock the config functions
vi.mock('../ai/config', () => ({
  getOpenRouterApiKey: vi.fn(() => 'test-api-key'),
  getOpenRouterSiteUrl: vi.fn(() => 'http://test.com'),
  getOpenRouterAppName: vi.fn(() => 'Test App'),
}))

describe('Significance Detector', () => {
  describe('groupMessagesByMatch', () => {
    it('should group messages by match ID', () => {
      const messages: NormalizedMessage[] = [
        {
          id: 'msg1',
          matchId: 'match1',
          senderId: 'user1',
          sentAt: '2020-01-01T10:00:00Z',
          body: 'Hello',
          direction: 'user',
        },
        {
          id: 'msg2',
          matchId: 'match1',
          senderId: 'match1',
          sentAt: '2020-01-01T11:00:00Z',
          body: 'Hi',
          direction: 'match',
        },
        {
          id: 'msg3',
          matchId: 'match2',
          senderId: 'user1',
          sentAt: '2020-01-02T10:00:00Z',
          body: 'Hey',
          direction: 'user',
        },
      ]

      const conversations = groupMessagesByMatch(messages, 'user1')

      expect(conversations).toHaveLength(2)
      expect(conversations[0].matchId).toBe('match1')
      expect(conversations[0].messages).toHaveLength(2)
      expect(conversations[1].matchId).toBe('match2')
      expect(conversations[1].messages).toHaveLength(1)
    })

    it('should identify correct participant ID', () => {
      const messages: NormalizedMessage[] = [
        {
          id: 'msg1',
          matchId: 'match1',
          senderId: 'user1',
          sentAt: '2020-01-01T10:00:00Z',
          body: 'Hello',
          direction: 'user',
        },
        {
          id: 'msg2',
          matchId: 'match1',
          senderId: 'participant123',
          sentAt: '2020-01-01T11:00:00Z',
          body: 'Hi',
          direction: 'match',
        },
      ]

      const conversations = groupMessagesByMatch(messages, 'user1')

      expect(conversations[0].participantId).toBe('participant123')
    })
  })

  describe('detectSignificantConversations', () => {
    it('should detect conversations that led to a date', async () => {
      const messages: NormalizedMessage[] = [
        {
          id: 'msg1',
          matchId: 'match1',
          senderId: 'user1',
          sentAt: '2020-01-01T10:00:00Z',
          body: 'Want to grab coffee sometime?',
          direction: 'user',
        },
        {
          id: 'msg2',
          matchId: 'match1',
          senderId: 'match1',
          sentAt: '2020-01-01T11:00:00Z',
          body: 'Yes! How about Saturday?',
          direction: 'match',
        },
        {
          id: 'msg3',
          matchId: 'match1',
          senderId: 'user1',
          sentAt: '2020-01-01T12:00:00Z',
          body: 'Perfect, let me meet up at 2pm',
          direction: 'user',
        },
      ]

      const result = await detectSignificantConversations(messages, 'user1')

      expect(result.significantConversations).toHaveLength(1)
      expect(result.significantConversations[0].significanceFlags.ledToDate).toBe(true)
      expect(result.statistics.breakdown.ledToDate).toBe(1)
    })

    it('should detect contact information exchange', async () => {
      const messages: NormalizedMessage[] = [
        {
          id: 'msg1',
          matchId: 'match1',
          senderId: 'user1',
          sentAt: '2020-01-01T10:00:00Z',
          body: 'This app is glitchy',
          direction: 'user',
        },
        {
          id: 'msg2',
          matchId: 'match1',
          senderId: 'match1',
          sentAt: '2020-01-01T11:00:00Z',
          body: "Here's my phone number: 555-1234",
          direction: 'match',
        },
        {
          id: 'msg3',
          matchId: 'match1',
          senderId: 'user1',
          sentAt: '2020-01-01T12:00:00Z',
          body: 'Great, I will text you',
          direction: 'user',
        },
      ]

      const result = await detectSignificantConversations(messages, 'user1')

      expect(result.significantConversations).toHaveLength(1)
      expect(result.significantConversations[0].significanceFlags.contactExchange).toBe(true)
      expect(result.statistics.breakdown.contactExchange).toBe(1)
    })

    it('should detect unusually long conversations', async () => {
      // Create a conversation with 50 messages that will be recognized as long
      const messages: NormalizedMessage[] = []
      for (let i = 0; i < 50; i++) {
        messages.push({
          id: `msg${i}`,
          matchId: 'match1',
          senderId: i % 2 === 0 ? 'user1' : 'match1',
          sentAt: `2020-01-01T${String(10 + Math.floor(i / 2)).padStart(2, '0')}:00:00Z`,
          body: `Long conversation message ${i}`, // This will match the mock pattern
          direction: i % 2 === 0 ? 'user' : 'match',
        })
      }

      const result = await detectSignificantConversations(messages, 'user1')

      expect(result.significantConversations).toHaveLength(1)
      expect(result.significantConversations[0].significanceFlags.unusualLength).toBe(true)
      expect(result.significantConversations[0].messageCount).toBe(50)
    })

    it('should detect emotionally deep conversations', async () => {
      const messages: NormalizedMessage[] = [
        {
          id: 'msg1',
          matchId: 'match1',
          senderId: 'user1',
          sentAt: '2020-01-01T10:00:00Z',
          body: "I've been feeling really anxious about my family situation lately", // Contains 'feeling', 'anxious', and 'family'
          direction: 'user',
        },
        {
          id: 'msg2',
          matchId: 'match1',
          senderId: 'match1',
          sentAt: '2020-01-01T11:00:00Z',
          body: 'I understand, my family has been through similar struggles', // Contains 'family' and 'struggles'
          direction: 'match',
        },
        {
          id: 'msg3',
          matchId: 'match1',
          senderId: 'user1',
          sentAt: '2020-01-01T12:00:00Z',
          body: 'Thank you for sharing that with me',
          direction: 'user',
        },
      ]

      const result = await detectSignificantConversations(messages, 'user1')

      expect(result.significantConversations).toHaveLength(1)
      expect(result.significantConversations[0].significanceFlags.emotionalDepth).toBe(true)
      expect(result.statistics.breakdown.emotionalDepth).toBe(1)
    })

    it('should not detect very short conversations as significant', async () => {
      const messages: NormalizedMessage[] = [
        {
          id: 'msg1',
          matchId: 'match1',
          senderId: 'user1',
          sentAt: '2020-01-01T10:00:00Z',
          body: 'Hey',
          direction: 'user',
        },
        {
          id: 'msg2',
          matchId: 'match1',
          senderId: 'match1',
          sentAt: '2020-01-01T11:00:00Z',
          body: 'Hi',
          direction: 'match',
        },
      ]

      const result = await detectSignificantConversations(messages, 'user1')

      expect(result.significantConversations).toHaveLength(0)
    })

    it('should calculate correct statistics', async () => {
      const messages: NormalizedMessage[] = []

      // Create 10 conversations - 3 significant, 7 not
      // Conversation 1: Date (significant)
      for (let i = 0; i < 5; i++) {
        messages.push({
          id: `msg1_${i}`,
          matchId: 'match1',
          senderId: i % 2 === 0 ? 'user1' : 'match1',
          sentAt: `2020-01-01T${String(10 + i).padStart(2, '0')}:00:00Z`,
          body: i === 0 ? 'Want to meet for coffee?' : `Message ${i}`,
          direction: i % 2 === 0 ? 'user' : 'match',
        })
      }

      // Conversation 2: Long (significant) - 40 messages
      for (let i = 0; i < 40; i++) {
        messages.push({
          id: `msg2_${i}`,
          matchId: 'match2',
          senderId: i % 2 === 0 ? 'user1' : 'match2',
          sentAt: `2020-01-02T${String(10 + Math.floor(i / 2)).padStart(2, '0')}:00:00Z`,
          body: `Long conversation message ${i}`,
          direction: i % 2 === 0 ? 'user' : 'match',
        })
      }

      // Conversation 3: Emotional (significant)
      for (let i = 0; i < 5; i++) {
        messages.push({
          id: `msg3_${i}`,
          matchId: 'match3',
          senderId: i % 2 === 0 ? 'user1' : 'match3',
          sentAt: `2020-01-03T${String(10 + i).padStart(2, '0')}:00:00Z`,
          body: i === 0 ? 'I have deep feeling about my family' : `Message ${i}`,
          direction: i % 2 === 0 ? 'user' : 'match',
        })
      }

      // 7 short, insignificant conversations
      for (let conv = 4; conv <= 10; conv++) {
        for (let i = 0; i < 3; i++) {
          messages.push({
            id: `msg${conv}_${i}`,
            matchId: `match${conv}`,
            senderId: i % 2 === 0 ? 'user1' : `match${conv}`,
            sentAt: `2020-01-0${conv}T${String(10 + i).padStart(2, '0')}:00:00Z`,
            body: `Regular message ${i}`,
            direction: i % 2 === 0 ? 'user' : 'match',
          })
        }
      }

      const result = await detectSignificantConversations(messages, 'user1')

      expect(result.statistics.totalSignificant).toBe(3)
      expect(result.statistics.percentageSignificant).toBeCloseTo(30, 0) // 3 out of 10 = 30%
      expect(result.statistics.avgMessageCountAll).toBeGreaterThan(0)
    })

    it('should handle empty message array', async () => {
      const result = await detectSignificantConversations([], 'user1')

      expect(result.significantConversations).toHaveLength(0)
      expect(result.statistics.totalSignificant).toBe(0)
      expect(result.statistics.percentageSignificant).toBe(0)
    })
  })
})
