/**
 * Safety Screener Analyzer Tests
 *
 * Tests the LLM-powered safety screening analyzer that detects
 * red flags and safety concerns based on contextual analysis.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { runSafetyScreener, _testing } from './safety-screener'
import type { AnalyzerInput } from './types'
import type { NormalizedMessage } from '@/types/data-model'

const { sampleConversations, shouldEscalateToRiskEvaluator, chunkMessages } = _testing

// Mock the AI modules
vi.mock('../ai/openrouter-client', () => ({
  createOpenRouterClient: vi.fn(() => ({
    chat: {
      completions: {
        create: vi.fn(),
      },
    },
  })),
}))

vi.mock('../ai/config', () => ({
  getOpenRouterApiKey: vi.fn(() => 'test-key'),
  getOpenRouterSiteUrl: vi.fn(() => 'http://test.com'),
  getOpenRouterAppName: vi.fn(() => 'test-app'),
}))

describe('Safety Screener Analyzer', () => {
  describe('sampleConversations', () => {
    const createConversationMessage = (
      id: string,
      matchId: string,
      body: string,
      daysAgo: number,
      direction: 'user' | 'match' = 'user'
    ): NormalizedMessage => ({
      id,
      matchId,
      senderId: direction === 'user' ? 'user-1' : matchId,
      sentAt: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString(),
      body,
      direction,
    })

    it('should prioritize conversations with recent activity', () => {
      const input: AnalyzerInput = {
        messages: [
          // Match 1: last message 10 days ago
          createConversationMessage('1', 'match-1', 'Old message from match 1', 50),
          createConversationMessage('2', 'match-1', 'Newer message from match 1', 10),
          // Match 2: last message 1 day ago
          createConversationMessage('3', 'match-2', 'Recent message from match 2', 5),
          createConversationMessage('4', 'match-2', 'Latest from match 2', 1),
          // Match 3: last message 30 days ago
          createConversationMessage('5', 'match-3', 'Medium old from match 3', 30),
        ],
        matches: [],
        participants: [],
        userId: 'user-1',
      }

      const result = sampleConversations(input, 3)

      // Should sample all 3 conversations
      expect(result.conversationCount).toBe(3)
      // Order should be match-2 (1 day), match-1 (10 days), match-3 (30 days)
      const messagesText = result.sampledMessages.join('\n')
      expect(messagesText).toContain('Latest from match 2')
      expect(messagesText).toContain('Newer message from match 1')
      expect(messagesText).toContain('Medium old from match 3')

      // Verify match-2 appears before match-1 (most recent first)
      const match2Index = messagesText.indexOf('Latest from match 2')
      const match1Index = messagesText.indexOf('Newer message from match 1')
      expect(match2Index).toBeLessThan(match1Index)
    })

    it('should limit to maxConversations', () => {
      const input: AnalyzerInput = {
        messages: [
          ...Array.from({ length: 10 }, (_, i) =>
            createConversationMessage(`msg-1-${i}`, 'match-1', `Message ${i}`, i)
          ),
          ...Array.from({ length: 10 }, (_, i) =>
            createConversationMessage(`msg-2-${i}`, 'match-2', `Message ${i}`, i)
          ),
          ...Array.from({ length: 10 }, (_, i) =>
            createConversationMessage(`msg-3-${i}`, 'match-3', `Message ${i}`, i)
          ),
        ],
        matches: [],
        participants: [],
        userId: 'user-1',
      }

      const result = sampleConversations(input, 2)

      // Should only sample 2 most recent conversations
      expect(result.conversationCount).toBe(2)
    })

    it('should limit messages per conversation to 50', () => {
      const input: AnalyzerInput = {
        // Create 100 messages in a single conversation
        messages: Array.from({ length: 100 }, (_, i) =>
          createConversationMessage(`msg-${i}`, 'match-1', `Message ${i}`, 1)
        ),
        matches: [],
        participants: [],
        userId: 'user-1',
      }

      const result = sampleConversations(input, 1)

      // Should have 1 conversation
      expect(result.conversationCount).toBe(1)
      // Should have max 50 messages (most recent ones)
      expect(result.totalMessageCount).toBe(50)
    })

    it('should include conversation headers', () => {
      const input: AnalyzerInput = {
        messages: [
          createConversationMessage('1', 'match-1', 'Message 1', 1),
          createConversationMessage('2', 'match-2', 'Message 2', 1),
        ],
        matches: [],
        participants: [],
        userId: 'user-1',
      }

      const result = sampleConversations(input, 2)

      // Should have conversation headers
      expect(result.sampledMessages.some(m => m.includes('--- Conversation'))).toBe(true)
      expect(result.sampledMessages.some(m => m.includes('messages) ---'))).toBe(true)
    })

    it('should include sender labels', () => {
      const input: AnalyzerInput = {
        messages: [
          createConversationMessage('1', 'match-1', 'User message', 1, 'user'),
          createConversationMessage('2', 'match-1', 'Match message', 1, 'match'),
        ],
        matches: [],
        participants: [],
        userId: 'user-1',
      }

      const result = sampleConversations(input, 1)

      // Should have sender labels
      const messagesText = result.sampledMessages.join('\n')
      expect(messagesText).toContain('User:')
      expect(messagesText).toContain('Match:')
    })

    it('should return correct counts', () => {
      const input: AnalyzerInput = {
        messages: [
          createConversationMessage('1', 'match-1', 'Message 1', 1),
          createConversationMessage('2', 'match-1', 'Message 2', 1),
          createConversationMessage('3', 'match-2', 'Message 3', 1),
        ],
        matches: [],
        participants: [],
        userId: 'user-1',
      }

      const result = sampleConversations(input, 2)

      expect(result.conversationCount).toBe(2)
      expect(result.totalMessageCount).toBe(3)
    })
  })

  describe('chunkMessages', () => {
    it('should not chunk if messages fit within token limit', () => {
      const messages = ['Short message 1', 'Short message 2', 'Short message 3']
      const chunks = chunkMessages(messages, 1000)

      expect(chunks).toHaveLength(1)
      expect(chunks[0]).toEqual(messages)
    })

    it('should split messages into multiple chunks when exceeding token limit', () => {
      // Create messages that are approximately 100 tokens each (400 chars)
      const longMessage = 'x'.repeat(400)
      const messages = Array.from({ length: 10 }, (_, i) => `Message ${i}: ${longMessage}`)

      // With maxTokens of 200, each chunk should hold ~2 messages
      const chunks = chunkMessages(messages, 200)

      expect(chunks.length).toBeGreaterThan(1)
      // Each chunk should have messages
      chunks.forEach((chunk) => {
        expect(chunk.length).toBeGreaterThan(0)
      })
      // All messages should be preserved
      const totalMessages = chunks.flat().length
      expect(totalMessages).toBe(messages.length)
    })

    it('should handle a single very large message', () => {
      const veryLongMessage = 'x'.repeat(10000) // ~2500 tokens
      const messages = [veryLongMessage]

      const chunks = chunkMessages(messages, 1000)

      // Should still create one chunk with the oversized message
      expect(chunks).toHaveLength(1)
      expect(chunks[0]).toEqual([veryLongMessage])
    })

    it('should preserve message order across chunks', () => {
      const messages = Array.from({ length: 20 }, (_, i) => `Message ${i}: ${'x'.repeat(400)}`)
      const chunks = chunkMessages(messages, 200)

      const flattened = chunks.flat()
      expect(flattened).toEqual(messages)
    })
  })

  describe('shouldEscalateToRiskEvaluator', () => {
    it('should NOT escalate on yellow risk level (too minor)', () => {
      const result = shouldEscalateToRiskEvaluator('yellow', [])
      expect(result).toBe(false)
    })

    it('should escalate on orange risk level', () => {
      const result = shouldEscalateToRiskEvaluator('orange', [])
      expect(result).toBe(true)
    })

    it('should escalate on red risk level', () => {
      const result = shouldEscalateToRiskEvaluator('red', [])
      expect(result).toBe(true)
    })

    it('should NOT escalate on medium severity flag (only high severity)', () => {
      const redFlags = [
        {
          type: 'explicit-manipulation' as const,
          severity: 'medium' as const,
          description: 'Some manipulation detected',
          examples: ['Example'],
        },
      ]

      const result = shouldEscalateToRiskEvaluator('green', redFlags)
      expect(result).toBe(false)
    })

    it('should escalate on high severity flag', () => {
      const redFlags = [
        {
          type: 'threat' as const,
          severity: 'high' as const,
          description: 'Threat detected',
          examples: ['Example'],
        },
      ]

      const result = shouldEscalateToRiskEvaluator('green', redFlags)
      expect(result).toBe(true)
    })

    it('should not escalate on green with only low severity flags', () => {
      const redFlags = [
        {
          type: 'inconsistency' as const,
          severity: 'low' as const,
          description: 'Minor inconsistency',
          examples: ['Example'],
        },
      ]

      const result = shouldEscalateToRiskEvaluator('green', redFlags)
      expect(result).toBe(false)
    })

    it('should not escalate on green with no flags', () => {
      const result = shouldEscalateToRiskEvaluator('green', [])
      expect(result).toBe(false)
    })
  })

  describe('runSafetyScreener (LLM-powered analysis)', () => {
    let mockCreate: ReturnType<typeof vi.fn>

    beforeEach(async () => {
      vi.clearAllMocks()

      // Setup mock for createOpenRouterClient
      mockCreate = vi.fn()
      const mockModule = await import('../ai/openrouter-client')

      vi.mocked(mockModule.createOpenRouterClient).mockReturnValue({
        chat: {
          completions: {
            create: mockCreate,
          },
        },
      } as unknown as ReturnType<typeof mockModule.createOpenRouterClient>)
    })

    it('should analyze safe conversations and return green risk level', async () => {
      // Mock AI response
      mockCreate.mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify({
                riskLevel: 'green',
                redFlags: [],
                greenFlags: ['Respectful communication', 'Healthy boundaries'],
                summary: 'Safe conversation with positive indicators',
              }),
            },
            finish_reason: 'stop',
            index: 0,
          },
        ],
      })

      const input: AnalyzerInput = {
        messages: [
          {
            id: '1',
            matchId: 'match-1',
            senderId: 'user-1',
            sentAt: new Date().toISOString(),
            body: 'Hey! How are you?',
            direction: 'user',
          },
          {
            id: '2',
            matchId: 'match-1',
            senderId: 'match-1',
            sentAt: new Date().toISOString(),
            body: "I'm great! How about you?",
            direction: 'match',
          },
        ],
        matches: [],
        participants: [],
        userId: 'user-1',
      }

      const result = await runSafetyScreener(input)

      expect(result.analyzer).toBe('safety-screener')
      expect(result.riskLevel).toBe('green')
      expect(result.redFlags).toHaveLength(0)
      expect(result.greenFlags.length).toBeGreaterThan(0)
      expect(result.escalateToRiskEvaluator).toBe(false)
      expect(result.metadata.analyzedAt).toBeDefined()
      expect(result.metadata.durationMs).toBeGreaterThanOrEqual(0)
      expect(result.metadata.model).toBe('openai/gpt-5')
      expect(result.metadata.costUsd).toBeGreaterThan(0)
    })

    it('should detect manipulation through contextual LLM analysis and escalate', async () => {
      // Mock AI response with red flags
      mockCreate.mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify({
                riskLevel: 'orange',
                redFlags: [
                  {
                    type: 'explicit-manipulation',
                    severity: 'medium',
                    description: 'Guilt-tripping pattern detected with contextual emotional manipulation',
                    examples: ['You owe me after everything I did for you'],
                  },
                ],
                greenFlags: [],
                summary: 'Concerning manipulation patterns detected through contextual analysis',
              }),
            },
            finish_reason: 'stop',
            index: 0,
          },
        ],
      })

      const input: AnalyzerInput = {
        messages: [
          {
            id: '1',
            matchId: 'match-1',
            senderId: 'match-1',
            sentAt: new Date().toISOString(),
            // LLM analyzes this message in context and detects manipulation
            body: 'You owe me after everything I did for you',
            direction: 'match',
          },
        ],
        matches: [],
        participants: [],
        userId: 'user-1',
      }

      const result = await runSafetyScreener(input)

      expect(result.riskLevel).toBe('orange')
      expect(result.redFlags.length).toBeGreaterThan(0)
      expect(result.escalateToRiskEvaluator).toBe(true)
    })

    it('should use LLM to detect nuanced threats without keyword matching', async () => {
      // Mock LLM detecting implied threat through context, not keywords
      mockCreate.mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify({
                riskLevel: 'red',
                redFlags: [
                  {
                    type: 'threat',
                    severity: 'high',
                    description: 'Implied threat detected through tone escalation and intimidation pattern',
                    examples: ['Know where you live', 'Would be a shame if something happened'],
                  },
                ],
                greenFlags: [],
                summary: 'LLM detected implied threats through contextual understanding of intimidation patterns',
              }),
            },
            finish_reason: 'stop',
            index: 0,
          },
        ],
      })

      const input: AnalyzerInput = {
        messages: [
          {
            id: '1',
            matchId: 'match-1',
            senderId: 'match-1',
            sentAt: new Date().toISOString(),
            // No obvious "threat" keywords, but LLM understands the implied intimidation
            body: 'I know where you live. Nice neighborhood.',
            direction: 'match',
          },
          {
            id: '2',
            matchId: 'match-1',
            senderId: 'match-1',
            sentAt: new Date().toISOString(),
            body: "Would be a shame if something happened to your car.",
            direction: 'match',
          },
        ],
        matches: [],
        participants: [],
        userId: 'user-1',
      }

      const result = await runSafetyScreener(input)

      expect(result.riskLevel).toBe('red')
      expect(result.escalateToRiskEvaluator).toBe(true)
      expect(result.redFlags).toHaveLength(1)
      expect(result.redFlags[0].type).toBe('threat')
      expect(result.redFlags[0].severity).toBe('high')
    })

    it('should handle API errors gracefully', async () => {
      // Mock API error
      mockCreate.mockRejectedValue(new Error('API Error'))

      const input: AnalyzerInput = {
        messages: [
          {
            id: '1',
            matchId: 'match-1',
            senderId: 'user-1',
            sentAt: new Date().toISOString(),
            body: 'Test message',
            direction: 'user',
          },
        ],
        matches: [],
        participants: [],
        userId: 'user-1',
      }

      await expect(runSafetyScreener(input)).rejects.toThrow('API Error')
    })
  })
})
