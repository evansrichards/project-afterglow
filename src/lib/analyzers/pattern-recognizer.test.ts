/**
 * Pattern Recognizer Analyzer Tests
 *
 * Tests the LLM-powered pattern recognition analyzer that identifies
 * communication styles, attachment markers, and behavioral patterns.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { runPatternRecognizer, _testing } from './pattern-recognizer'
import type { AnalyzerInput } from './types'
import type { NormalizedMessage } from '@/types/data-model'

const { filterRecentMessages, sampleMessages, shouldEscalateToAttachmentEvaluator } = _testing

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

describe('Pattern Recognizer Analyzer', () => {
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
        ],
        matches: [],
        participants: [],
        userId: 'user-1',
      }

      const filtered = filterRecentMessages(input)

      expect(filtered).toHaveLength(2)
      expect(filtered.find((m) => m.id === '1')).toBeDefined()
      expect(filtered.find((m) => m.id === '3')).toBeDefined()
      expect(filtered.find((m) => m.id === '2')).toBeUndefined()
      expect(filtered.find((m) => m.id === '4')).toBeUndefined()
    })
  })

  describe('sampleMessages', () => {
    it('should sample messages within 90-day window', () => {
      const input: AnalyzerInput = {
        messages: [
          createMessage('1', 'Message 1', 1),
          createMessage('2', 'Message 2', 10),
          createMessage('3', 'Message 3', 30),
          createMessage('4', 'Old message', 100),
        ],
        matches: [],
        participants: [],
        userId: 'user-1',
      }

      const sampled = sampleMessages(input, 10)

      expect(sampled).toHaveLength(3) // Only 3 within 90 days
      expect(sampled.join(' ')).not.toContain('Old message')
    })

    it('should include timestamp and sender in format', () => {
      const input: AnalyzerInput = {
        messages: [
          { ...createMessage('1', 'Test message', 1), direction: 'user' },
          { ...createMessage('2', 'Response', 1), direction: 'match' },
        ],
        matches: [],
        participants: [],
        userId: 'user-1',
      }

      const sampled = sampleMessages(input, 10)

      expect(sampled[0]).toMatch(/\[\d{4}-\d{2}-\d{2}\] User: Test message/)
      expect(sampled[1]).toMatch(/\[\d{4}-\d{2}-\d{2}\] Match: Response/)
    })

    it('should limit to maxMessages', () => {
      const input: AnalyzerInput = {
        messages: Array.from({ length: 500 }, (_, i) =>
          createMessage(`msg-${i}`, `Message ${i}`, i % 90)
        ),
        matches: [],
        participants: [],
        userId: 'user-1',
      }

      const sampled = sampleMessages(input, 300)

      expect(sampled.length).toBeLessThanOrEqual(300)
    })
  })

  describe('shouldEscalateToAttachmentEvaluator', () => {
    const baseStyle = {
      consistency: 'mostly-consistent' as const,
      emotionalExpressiveness: 'medium' as const,
      initiationPattern: 'balanced' as const,
    }

    const baseMarkers = {
      anxietyMarkers: [],
      avoidanceMarkers: [],
      secureMarkers: ['healthy communication'],
    }

    it('should escalate on high complexity score', () => {
      const result = shouldEscalateToAttachmentEvaluator(0.5, baseStyle, baseMarkers)
      expect(result).toBe(true)
    })

    it('should escalate on mixed communication patterns', () => {
      const mixedStyle = { ...baseStyle, consistency: 'mixed' as const }
      const result = shouldEscalateToAttachmentEvaluator(0.1, mixedStyle, baseMarkers)
      expect(result).toBe(true)
    })

    it('should escalate on inconsistent communication patterns', () => {
      const inconsistentStyle = { ...baseStyle, consistency: 'inconsistent' as const }
      const result = shouldEscalateToAttachmentEvaluator(0.1, inconsistentStyle, baseMarkers)
      expect(result).toBe(true)
    })

    it('should escalate when both anxiety and avoidance markers present', () => {
      const mixedMarkers = {
        anxietyMarkers: ['reassurance-seeking'],
        avoidanceMarkers: ['emotional distance'],
        secureMarkers: [],
      }
      const result = shouldEscalateToAttachmentEvaluator(0.1, baseStyle, mixedMarkers)
      expect(result).toBe(true)
    })

    it('should not escalate with low complexity and consistent patterns', () => {
      const result = shouldEscalateToAttachmentEvaluator(0.1, baseStyle, baseMarkers)
      expect(result).toBe(false)
    })

    it('should not escalate with only anxiety markers', () => {
      const anxiousMarkers = {
        anxietyMarkers: ['reassurance-seeking'],
        avoidanceMarkers: [],
        secureMarkers: [],
      }
      const result = shouldEscalateToAttachmentEvaluator(0.1, baseStyle, anxiousMarkers)
      expect(result).toBe(false)
    })

    it('should not escalate with only avoidance markers', () => {
      const avoidantMarkers = {
        anxietyMarkers: [],
        avoidanceMarkers: ['emotional distance'],
        secureMarkers: [],
      }
      const result = shouldEscalateToAttachmentEvaluator(0.1, baseStyle, avoidantMarkers)
      expect(result).toBe(false)
    })
  })

  describe('runPatternRecognizer (LLM-powered analysis)', () => {
    let mockCreate: ReturnType<typeof vi.fn>

    beforeEach(async () => {
      vi.clearAllMocks()

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

    it('should analyze consistent communication patterns', async () => {
      mockCreate.mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify({
                communicationStyle: {
                  consistency: 'very-consistent',
                  emotionalExpressiveness: 'high',
                  initiationPattern: 'balanced',
                },
                attachmentMarkers: {
                  anxietyMarkers: [],
                  avoidanceMarkers: [],
                  secureMarkers: ['healthy vulnerability', 'comfortable with closeness'],
                },
                authenticity: {
                  score: 0.85,
                  vulnerabilityShown: true,
                  genuineInterest: true,
                },
                boundaries: {
                  userSetsBoundaries: true,
                  userRespectsBoundaries: true,
                  examples: ['Politely declined late-night requests', 'Expressed needs clearly'],
                },
                complexityScore: 0.1,
                summary: 'Secure attachment style with consistent, authentic communication',
              }),
            },
            finish_reason: 'stop',
            index: 0,
          },
        ],
      })

      const input: AnalyzerInput = {
        messages: [
          createMessage('1', 'Hey! How was your day?', 1),
          createMessage('2', 'I really enjoyed our conversation yesterday', 2),
        ],
        matches: [],
        participants: [],
        userId: 'user-1',
      }

      const result = await runPatternRecognizer(input)

      expect(result.analyzer).toBe('pattern-recognizer')
      expect(result.communicationStyle.consistency).toBe('very-consistent')
      expect(result.attachmentMarkers.secureMarkers.length).toBeGreaterThan(0)
      expect(result.authenticity.score).toBeGreaterThan(0.5)
      expect(result.escalateToAttachmentEvaluator).toBe(false)
      expect(result.metadata.model).toBe('openai/gpt-4-turbo')
      expect(result.metadata.costUsd).toBeGreaterThan(0)
    })

    it('should detect mixed attachment patterns and escalate', async () => {
      mockCreate.mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify({
                communicationStyle: {
                  consistency: 'mixed',
                  emotionalExpressiveness: 'medium',
                  initiationPattern: 'proactive',
                },
                attachmentMarkers: {
                  anxietyMarkers: ['Frequent check-ins', 'Reassurance-seeking'],
                  avoidanceMarkers: ['Pulls away after intimacy', 'Difficulty expressing feelings'],
                  secureMarkers: [],
                },
                authenticity: {
                  score: 0.6,
                  vulnerabilityShown: false,
                  genuineInterest: true,
                },
                boundaries: {
                  userSetsBoundaries: false,
                  userRespectsBoundaries: true,
                  examples: [],
                },
                complexityScore: 0.7,
                summary:
                  'Mixed attachment signals with both anxious and avoidant patterns requiring deeper analysis',
              }),
            },
            finish_reason: 'stop',
            index: 0,
          },
        ],
      })

      const input: AnalyzerInput = {
        messages: [
          createMessage('1', 'Are you still interested?', 1),
          createMessage('2', 'I need some space', 2),
        ],
        matches: [],
        participants: [],
        userId: 'user-1',
      }

      const result = await runPatternRecognizer(input)

      expect(result.complexityScore).toBeGreaterThan(0.3)
      expect(result.attachmentMarkers.anxietyMarkers.length).toBeGreaterThan(0)
      expect(result.attachmentMarkers.avoidanceMarkers.length).toBeGreaterThan(0)
      expect(result.escalateToAttachmentEvaluator).toBe(true)
    })

    it('should track metadata correctly', async () => {
      mockCreate.mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify({
                communicationStyle: {
                  consistency: 'mostly-consistent',
                  emotionalExpressiveness: 'medium',
                  initiationPattern: 'balanced',
                },
                attachmentMarkers: {
                  anxietyMarkers: [],
                  avoidanceMarkers: [],
                  secureMarkers: ['test'],
                },
                authenticity: {
                  score: 0.5,
                  vulnerabilityShown: true,
                  genuineInterest: true,
                },
                boundaries: {
                  userSetsBoundaries: true,
                  userRespectsBoundaries: true,
                  examples: [],
                },
                complexityScore: 0.2,
                summary: 'Test summary',
              }),
            },
            finish_reason: 'stop',
            index: 0,
          },
        ],
      })

      const input: AnalyzerInput = {
        messages: [createMessage('1', 'Test', 1)],
        matches: [],
        participants: [],
        userId: 'user-1',
      }

      const result = await runPatternRecognizer(input)

      expect(result.metadata.analyzedAt).toBeDefined()
      expect(result.metadata.durationMs).toBeGreaterThanOrEqual(0)
      expect(result.metadata.model).toBe('openai/gpt-4-turbo')
      expect(result.metadata.tokensUsed).toBeDefined()
      expect(result.metadata.costUsd).toBeGreaterThan(0)
    })

    it('should handle API errors gracefully', async () => {
      mockCreate.mockRejectedValue(new Error('API Error'))

      const input: AnalyzerInput = {
        messages: [createMessage('1', 'Test', 1)],
        matches: [],
        participants: [],
        userId: 'user-1',
      }

      await expect(runPatternRecognizer(input)).rejects.toThrow('API Error')
    })
  })
})
