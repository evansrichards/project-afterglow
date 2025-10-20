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

const { filterRecentMessages, sampleMessages, shouldEscalateToRiskEvaluator } = _testing

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
  const createMessage = (id: string, body: string, daysAgo: number): NormalizedMessage => ({
    id,
    matchId: 'match-1',
    senderId: 'user-1',
    sentAt: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString(),
    body,
    direction: 'user',
  })

  describe('filterRecentMessages (90-day filter)', () => {
    it('should only include messages from the past 90 days', () => {
      const input: AnalyzerInput = {
        messages: [
          createMessage('1', 'Recent message', 10),
          createMessage('2', 'Old message', 100),
          createMessage('3', 'Very recent message', 1),
          createMessage('4', 'Ancient message', 365),
          createMessage('5', 'Message at boundary', 90),
        ],
        matches: [],
        participants: [],
        userId: 'user-1',
      }

      const filtered = filterRecentMessages(input)

      expect(filtered).toHaveLength(3)
      expect(filtered.find((m) => m.id === '1')).toBeDefined() // 10 days ago
      expect(filtered.find((m) => m.id === '3')).toBeDefined() // 1 day ago
      expect(filtered.find((m) => m.id === '5')).toBeDefined() // 90 days ago (boundary)
      expect(filtered.find((m) => m.id === '2')).toBeUndefined() // 100 days ago
      expect(filtered.find((m) => m.id === '4')).toBeUndefined() // 365 days ago
    })

    it('should return empty array if all messages are older than 90 days', () => {
      const input: AnalyzerInput = {
        messages: [
          createMessage('1', 'Old message 1', 100),
          createMessage('2', 'Old message 2', 200),
          createMessage('3', 'Old message 3', 365),
        ],
        matches: [],
        participants: [],
        userId: 'user-1',
      }

      const filtered = filterRecentMessages(input)

      expect(filtered).toHaveLength(0)
    })

    it('should return all messages if all are within 90 days', () => {
      const input: AnalyzerInput = {
        messages: [
          createMessage('1', 'Recent 1', 1),
          createMessage('2', 'Recent 2', 30),
          createMessage('3', 'Recent 3', 60),
          createMessage('4', 'Recent 4', 89),
        ],
        matches: [],
        participants: [],
        userId: 'user-1',
      }

      const filtered = filterRecentMessages(input)

      expect(filtered).toHaveLength(4)
    })
  })

  describe('sampleMessages', () => {
    it('should prioritize recent messages within 90-day window', () => {
      const input: AnalyzerInput = {
        messages: [
          createMessage('1', 'Medium old message', 80),
          createMessage('2', 'Old message', 89),
          createMessage('3', 'Recent message 1', 1),
          createMessage('4', 'Recent message 2', 2),
          createMessage('5', 'Recent message 3', 3),
        ],
        matches: [],
        participants: [],
        userId: 'user-1',
      }

      const sampled = sampleMessages(input, 5)

      // Should include recent messages, all within 90 days
      expect(sampled.join(' ')).toContain('Recent message')
      expect(sampled).toHaveLength(5)
    })

    it('should filter out messages older than 90 days', () => {
      const input: AnalyzerInput = {
        messages: [
          createMessage('1', 'Very old message', 365),
          createMessage('2', 'Old message', 100),
          createMessage('3', 'Recent message 1', 1),
          createMessage('4', 'Recent message 2', 10),
          createMessage('5', 'Recent message 3', 30),
        ],
        matches: [],
        participants: [],
        userId: 'user-1',
      }

      const sampled = sampleMessages(input, 10)

      // Should only include the 3 recent messages (within 90 days)
      expect(sampled).toHaveLength(3)
      expect(sampled.join(' ')).not.toContain('Very old')
      expect(sampled.join(' ')).not.toContain('Old message')
      expect(sampled.join(' ')).toContain('Recent message')
    })

    it('should limit to maxMessages within 90-day window', () => {
      const input: AnalyzerInput = {
        // Create 150 messages within 90 days (0-89 days ago)
        messages: Array.from({ length: 150 }, (_, i) =>
          createMessage(`msg-${i}`, `Message ${i}`, i % 90)
        ),
        matches: [],
        participants: [],
        userId: 'user-1',
      }

      const sampled = sampleMessages(input, 100)

      // Should limit to 100 even though 150 are available
      expect(sampled).toHaveLength(100)
    })

    it('should include sender label in formatted message', () => {
      const input: AnalyzerInput = {
        messages: [
          { ...createMessage('1', 'User says hi', 1), direction: 'user' },
          { ...createMessage('2', 'Match responds', 1), direction: 'match' },
        ],
        matches: [],
        participants: [],
        userId: 'user-1',
      }

      const sampled = sampleMessages(input, 10)

      expect(sampled[0]).toContain('User:')
      expect(sampled[1]).toContain('Match:')
    })
  })

  describe('shouldEscalateToRiskEvaluator', () => {
    it('should escalate on yellow risk level', () => {
      const result = shouldEscalateToRiskEvaluator('yellow', [])
      expect(result).toBe(true)
    })

    it('should escalate on orange risk level', () => {
      const result = shouldEscalateToRiskEvaluator('orange', [])
      expect(result).toBe(true)
    })

    it('should escalate on red risk level', () => {
      const result = shouldEscalateToRiskEvaluator('red', [])
      expect(result).toBe(true)
    })

    it('should escalate on medium severity flag', () => {
      const redFlags = [
        {
          type: 'explicit-manipulation' as const,
          severity: 'medium' as const,
          description: 'Some manipulation detected',
          examples: ['Example'],
        },
      ]

      const result = shouldEscalateToRiskEvaluator('green', redFlags)
      expect(result).toBe(true)
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
      expect(result.metadata.model).toBe('openai/gpt-3.5-turbo')
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
