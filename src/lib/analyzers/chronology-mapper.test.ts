/**
 * Chronology Mapper Analyzer Tests
 *
 * Tests the LLM-powered chronological analysis that identifies
 * temporal patterns, growth trajectories, and evolution over time.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { runChronologyMapper, _testing } from './chronology-mapper'
import type { AnalyzerInput } from './types'
import type { NormalizedMessage } from '@/types/data-model'

const { calculateTimeRange, segmentMessagesByTime, shouldEscalateToGrowthEvaluator } = _testing

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

describe('Chronology Mapper Analyzer', () => {
  const createMessage = (id: string, body: string, daysAgo: number): NormalizedMessage => ({
    id,
    matchId: 'match-1',
    senderId: 'user-1',
    sentAt: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString(),
    body,
    direction: 'user',
  })

  describe('calculateTimeRange', () => {
    it('should calculate correct time range for messages', () => {
      const input: AnalyzerInput = {
        messages: [
          createMessage('1', 'Recent', 10),
          createMessage('2', 'Middle', 180),
          createMessage('3', 'Old', 365),
        ],
        matches: [],
        participants: [],
        userId: 'user-1',
      }

      const result = calculateTimeRange(input.messages)

      expect(result.durationMonths).toBeGreaterThan(11)
      expect(result.earliest).toBeDefined()
      expect(result.latest).toBeDefined()
      expect(new Date(result.earliest).getTime()).toBeLessThan(
        new Date(result.latest).getTime()
      )
    })

    it('should handle empty messages', () => {
      const result = calculateTimeRange([])

      expect(result.durationMonths).toBe(0)
      expect(result.earliest).toBeDefined()
      expect(result.latest).toBeDefined()
    })

    it('should handle single message', () => {
      const result = calculateTimeRange([createMessage('1', 'Test', 10)])

      expect(result.durationMonths).toBe(0)
      expect(result.earliest).toBe(result.latest)
    })
  })

  describe('segmentMessagesByTime', () => {
    it('should segment messages into time periods', () => {
      const input: AnalyzerInput = {
        messages: [
          createMessage('1', 'Very recent', 1),
          createMessage('2', 'Last 6 months', 100),
          createMessage('3', '6-12 months', 250),
          createMessage('4', '12-18 months', 400),
          createMessage('5', 'Old', 600),
        ],
        matches: [],
        participants: [],
        userId: 'user-1',
      }

      const segments = segmentMessagesByTime(input)

      expect(segments.length).toBeGreaterThan(0)
      expect(segments.find((s) => s.label === 'Last 6 months')).toBeDefined()
    })

    it('should apply correct weights to segments', () => {
      const input: AnalyzerInput = {
        messages: [
          createMessage('1', 'Recent', 1),
          createMessage('2', '6-12 mo', 250),
          createMessage('3', '12-18 mo', 400),
          createMessage('4', 'Old', 600),
        ],
        matches: [],
        participants: [],
        userId: 'user-1',
      }

      const segments = segmentMessagesByTime(input)

      const last6Months = segments.find((s) => s.label === 'Last 6 months')
      const months6to12 = segments.find((s) => s.label === '6-12 months ago')
      const months12to18 = segments.find((s) => s.label === '12-18 months ago')
      const olderSegment = segments.find((s) => s.label === '18+ months ago')

      expect(last6Months?.weight).toBe(1.0)
      expect(months6to12?.weight).toBe(0.6)
      expect(months12to18?.weight).toBe(0.3)
      expect(olderSegment?.weight).toBe(0.1)
    })

    it('should handle messages only in recent period', () => {
      const input: AnalyzerInput = {
        messages: [
          createMessage('1', 'Recent 1', 1),
          createMessage('2', 'Recent 2', 30),
          createMessage('3', 'Recent 3', 60),
        ],
        matches: [],
        participants: [],
        userId: 'user-1',
      }

      const segments = segmentMessagesByTime(input)

      expect(segments.length).toBe(1)
      expect(segments[0].label).toBe('Last 6 months')
      expect(segments[0].weight).toBe(1.0)
    })

    it('should return empty array for no messages', () => {
      const input: AnalyzerInput = {
        messages: [],
        matches: [],
        participants: [],
        userId: 'user-1',
      }

      const segments = segmentMessagesByTime(input)

      expect(segments).toEqual([])
    })
  })

  describe('shouldEscalateToGrowthEvaluator', () => {
    const baseGrowth = {
      detected: true,
      direction: 'improving' as const,
      areas: ['Better boundaries'],
      evidence: ['Example'],
    }

    it('should escalate when 18+ months with growth detected', () => {
      const result = shouldEscalateToGrowthEvaluator(18, baseGrowth)
      expect(result).toBe(true)
    })

    it('should escalate when 24 months with improving direction', () => {
      const result = shouldEscalateToGrowthEvaluator(24, baseGrowth)
      expect(result).toBe(true)
    })

    it('should escalate when growth detected with specific areas', () => {
      const growthWithAreas = {
        detected: true,
        direction: 'stable' as const,
        areas: ['Communication skills', 'Emotional awareness'],
        evidence: ['Example'],
      }
      const result = shouldEscalateToGrowthEvaluator(20, growthWithAreas)
      expect(result).toBe(true)
    })

    it('should not escalate when less than 18 months', () => {
      const result = shouldEscalateToGrowthEvaluator(12, baseGrowth)
      expect(result).toBe(false)
    })

    it('should not escalate when no growth detected', () => {
      const noGrowth = {
        detected: false,
        direction: 'stable' as const,
        areas: [],
        evidence: [],
      }
      const result = shouldEscalateToGrowthEvaluator(20, noGrowth)
      expect(result).toBe(false)
    })

    it('should not escalate when declining with no areas', () => {
      const decliningNoAreas = {
        detected: true,
        direction: 'declining' as const,
        areas: [],
        evidence: [],
      }
      const result = shouldEscalateToGrowthEvaluator(20, decliningNoAreas)
      expect(result).toBe(false)
    })
  })

  describe('runChronologyMapper (LLM-powered analysis)', () => {
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

    it('should analyze stable patterns with no growth', async () => {
      mockCreate.mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify({
                segmentAnalysis: [
                  {
                    label: 'Last 6 months',
                    patterns: ['Consistent communication', 'Stable emotional expression'],
                  },
                ],
                growth: {
                  detected: false,
                  direction: 'stable',
                  areas: [],
                  evidence: [],
                },
                lifeStageContext: {
                  transitions: [],
                  events: [],
                },
                summary: 'Stable communication patterns over time with no significant evolution',
              }),
            },
            finish_reason: 'stop',
            index: 0,
          },
        ],
      })

      const input: AnalyzerInput = {
        messages: [
          createMessage('1', 'Hey, how are you?', 10),
          createMessage('2', "I'm good, thanks!", 20),
        ],
        matches: [],
        participants: [],
        userId: 'user-1',
      }

      const result = await runChronologyMapper(input)

      expect(result.analyzer).toBe('chronology-mapper')
      expect(result.timeRange).toBeDefined()
      expect(result.segments.length).toBeGreaterThan(0)
      expect(result.growth.detected).toBe(false)
      expect(result.escalateToGrowthEvaluator).toBe(false)
      expect(result.metadata.model).toBe('openai/gpt-5')
    })

    it('should detect growth trajectory and escalate', async () => {
      mockCreate.mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify({
                segmentAnalysis: [
                  {
                    label: 'Last 6 months',
                    patterns: [
                      'Clear boundaries',
                      'Healthy vulnerability',
                      'Authentic expression',
                    ],
                  },
                  {
                    label: '6-12 months ago',
                    patterns: ['Improving boundaries', 'Increasing openness'],
                  },
                  {
                    label: '12-18 months ago',
                    patterns: ['Anxious patterns', 'Boundary struggles'],
                  },
                  {
                    label: '18+ months ago',
                    patterns: ['People-pleasing', 'Difficulty saying no'],
                  },
                ],
                growth: {
                  detected: true,
                  direction: 'improving',
                  areas: [
                    'Boundary setting',
                    'Emotional expression',
                    'Self-confidence',
                  ],
                  evidence: [
                    'Started declining inappropriate requests',
                    'More comfortable expressing needs',
                    'Less apologizing for boundaries',
                  ],
                },
                lifeStageContext: {
                  transitions: ['Started therapy', 'Changed jobs'],
                  events: ['Ended toxic relationship', 'Moved to new city'],
                },
                summary:
                  'Significant growth trajectory over 24 months with clear evolution in boundary setting and self-advocacy',
              }),
            },
            finish_reason: 'stop',
            index: 0,
          },
        ],
      })

      const input: AnalyzerInput = {
        messages: [
          createMessage('1', 'Recent message', 30),
          createMessage('2', '6-12 months', 250),
          createMessage('3', '12-18 months', 400),
          createMessage('4', 'Old message', 650),
        ],
        matches: [],
        participants: [],
        userId: 'user-1',
      }

      const result = await runChronologyMapper(input)

      expect(result.growth.detected).toBe(true)
      expect(result.growth.direction).toBe('improving')
      expect(result.growth.areas.length).toBeGreaterThan(0)
      expect(result.lifeStageContext.transitions.length).toBeGreaterThan(0)
      expect(result.escalateToGrowthEvaluator).toBe(true)
    })

    it('should track time segments with proper weights', async () => {
      mockCreate.mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify({
                segmentAnalysis: [
                  { label: 'Last 6 months', patterns: ['Recent patterns'] },
                  { label: '6-12 months ago', patterns: ['Mid patterns'] },
                ],
                growth: {
                  detected: false,
                  direction: 'stable',
                  areas: [],
                  evidence: [],
                },
                lifeStageContext: {
                  transitions: [],
                  events: [],
                },
                summary: 'Test summary',
              }),
            },
            finish_reason: 'stop',
            index: 0,
          },
        ],
      })

      const input: AnalyzerInput = {
        messages: [
          createMessage('1', 'Recent', 30),
          createMessage('2', 'Mid', 250),
        ],
        matches: [],
        participants: [],
        userId: 'user-1',
      }

      const result = await runChronologyMapper(input)

      const recentSegment = result.segments.find((s) => s.label === 'Last 6 months')
      expect(recentSegment?.weight).toBe(1.0)

      const midSegment = result.segments.find((s) => s.label === '6-12 months ago')
      expect(midSegment?.weight).toBe(0.6)
    })

    it('should track metadata correctly', async () => {
      mockCreate.mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify({
                segmentAnalysis: [],
                growth: { detected: false, direction: 'stable', areas: [], evidence: [] },
                lifeStageContext: { transitions: [], events: [] },
                summary: 'Test',
              }),
            },
            finish_reason: 'stop',
            index: 0,
          },
        ],
      })

      const input: AnalyzerInput = {
        messages: [createMessage('1', 'Test', 10)],
        matches: [],
        participants: [],
        userId: 'user-1',
      }

      const result = await runChronologyMapper(input)

      expect(result.metadata.analyzedAt).toBeDefined()
      expect(result.metadata.durationMs).toBeGreaterThanOrEqual(0)
      expect(result.metadata.model).toBe('openai/gpt-5')
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

      await expect(runChronologyMapper(input)).rejects.toThrow('API Error')
    })
  })
})
