/**
 * Risk Evaluator Tests
 *
 * Tests the GPT-4 powered risk evaluator that detects advanced
 * manipulation tactics, coercive control, and trauma bonding.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { runRiskEvaluator, _testing } from './risk-evaluator'
import type { EvaluatorInput } from './types'
import type { NormalizedMessage } from '@/types/data-model'

const { getTriggerReason, shouldEscalateToCrisisEvaluator } = _testing

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

describe('Risk Evaluator', () => {
  const createMessage = (id: string, body: string, daysAgo: number): NormalizedMessage => ({
    id,
    matchId: 'match-1',
    senderId: 'match-1',
    sentAt: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString(),
    body,
    direction: 'match',
  })

  const createMockInput = (
    riskLevel: 'green' | 'yellow' | 'orange' | 'red',
    redFlags: Array<{ type: string; severity: string }>
  ): EvaluatorInput => ({
    messages: [
      createMessage('1', 'Test message 1', 1),
      createMessage('2', 'Test message 2', 2),
    ],
    matches: [],
    participants: [],
    userId: 'user-1',
    safetyScreener: {
      analyzer: 'safety-screener',
      riskLevel,
      redFlags: redFlags.map(flag => ({
        type: flag.type as 'threat' | 'financial-request' | 'explicit-manipulation' | 'pressure' | 'inconsistency',
        severity: flag.severity as 'low' | 'medium' | 'high',
        description: 'Test description',
        examples: ['Test example'],
      })),
      greenFlags: [],
      escalateToRiskEvaluator: true,
      summary: 'Test summary',
      metadata: {
        analyzedAt: new Date().toISOString(),
        durationMs: 100,
        model: 'gpt-3.5-turbo',
        costUsd: 0.01,
      },
    },
    patternRecognizer: {
      analyzer: 'pattern-recognizer',
      communicationStyle: {
        consistency: 'mostly-consistent',
        emotionalExpressiveness: 'medium',
        initiationPattern: 'balanced',
      },
      attachmentMarkers: {
        anxietyMarkers: [],
        avoidanceMarkers: [],
        secureMarkers: [],
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
      escalateToAttachmentEvaluator: false,
      summary: 'Test summary',
      metadata: {
        analyzedAt: new Date().toISOString(),
        durationMs: 100,
        model: 'gpt-4-turbo',
        costUsd: 0.05,
      },
    },
    chronologyMapper: {
      analyzer: 'chronology-mapper',
      timeRange: {
        earliest: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(),
        latest: new Date().toISOString(),
        durationMonths: 6,
      },
      segments: [],
      growth: {
        detected: false,
        areas: [],
        evidence: [],
      },
      lifeStageContext: {
        transitions: [],
        events: [],
      },
      escalateToGrowthEvaluator: false,
      summary: 'Test summary',
      metadata: {
        analyzedAt: new Date().toISOString(),
        durationMs: 100,
        model: 'gpt-4-turbo',
        costUsd: 0.05,
      },
    },
  })

  describe('getTriggerReason', () => {
    it('should identify red risk level', () => {
      const input = createMockInput('red', [])
      const reason = getTriggerReason(input)
      expect(reason).toContain('Critical safety risk detected')
    })

    it('should identify orange risk level', () => {
      const input = createMockInput('orange', [])
      const reason = getTriggerReason(input)
      expect(reason).toContain('Moderate safety concerns detected')
    })

    it('should identify yellow risk level', () => {
      const input = createMockInput('yellow', [])
      const reason = getTriggerReason(input)
      expect(reason).toContain('Minor safety concerns detected')
    })

    it('should list red flag types', () => {
      const input = createMockInput('yellow', [
        { type: 'threat', severity: 'high' },
        { type: 'explicit-manipulation', severity: 'medium' },
      ])
      const reason = getTriggerReason(input)
      expect(reason).toContain('threat')
      expect(reason).toContain('explicit-manipulation')
    })
  })

  describe('shouldEscalateToCrisisEvaluator', () => {
    const baseSafetyScreener = {
      analyzer: 'safety-screener' as const,
      riskLevel: 'yellow' as const,
      redFlags: [],
      greenFlags: [],
      escalateToRiskEvaluator: true,
      summary: 'Test',
      metadata: {
        analyzedAt: new Date().toISOString(),
        durationMs: 100,
        model: 'gpt-3.5-turbo',
        costUsd: 0.01,
      },
    }

    it('should escalate on orange risk level', () => {
      const safety = { ...baseSafetyScreener, riskLevel: 'orange' as const }
      const result = shouldEscalateToCrisisEvaluator(safety, [], {
        detected: false,
        tactics: [],
        severity: 'low',
        evidence: [],
      })
      expect(result).toBe(true)
    })

    it('should escalate on red risk level', () => {
      const safety = { ...baseSafetyScreener, riskLevel: 'red' as const }
      const result = shouldEscalateToCrisisEvaluator(safety, [], {
        detected: false,
        tactics: [],
        severity: 'low',
        evidence: [],
      })
      expect(result).toBe(true)
    })

    it('should escalate on critical manipulation tactics', () => {
      const tactics = [
        {
          type: 'gaslighting' as const,
          severity: 'critical' as const,
          description: 'Test',
          examples: [],
          pattern: 'consistent' as const,
        },
      ]
      const result = shouldEscalateToCrisisEvaluator(baseSafetyScreener, tactics, {
        detected: false,
        tactics: [],
        severity: 'low',
        evidence: [],
      })
      expect(result).toBe(true)
    })

    it('should escalate on high coercive control', () => {
      const result = shouldEscalateToCrisisEvaluator(baseSafetyScreener, [], {
        detected: true,
        tactics: ['Control tactic'],
        severity: 'high',
        evidence: ['Evidence'],
      })
      expect(result).toBe(true)
    })

    it('should escalate on critical coercive control', () => {
      const result = shouldEscalateToCrisisEvaluator(baseSafetyScreener, [], {
        detected: true,
        tactics: ['Control tactic'],
        severity: 'critical',
        evidence: ['Evidence'],
      })
      expect(result).toBe(true)
    })

    it('should escalate on multiple consistent manipulation patterns', () => {
      const tactics = [
        {
          type: 'gaslighting' as const,
          severity: 'medium' as const,
          description: 'Test 1',
          examples: [],
          pattern: 'consistent' as const,
        },
        {
          type: 'DARVO' as const,
          severity: 'medium' as const,
          description: 'Test 2',
          examples: [],
          pattern: 'frequent' as const,
        },
      ]
      const result = shouldEscalateToCrisisEvaluator(baseSafetyScreener, tactics, {
        detected: false,
        tactics: [],
        severity: 'low',
        evidence: [],
      })
      expect(result).toBe(true)
    })

    it('should not escalate on isolated tactics with low severity', () => {
      const tactics = [
        {
          type: 'projection' as const,
          severity: 'medium' as const,
          description: 'Test',
          examples: [],
          pattern: 'isolated' as const,
        },
      ]
      const result = shouldEscalateToCrisisEvaluator(baseSafetyScreener, tactics, {
        detected: false,
        tactics: [],
        severity: 'low',
        evidence: [],
      })
      expect(result).toBe(false)
    })
  })

  describe('runRiskEvaluator (GPT-4 powered analysis)', () => {
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

    it('should detect manipulation tactics and not escalate', async () => {
      mockCreate.mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify({
                manipulationTactics: [
                  {
                    type: 'gaslighting',
                    severity: 'medium',
                    description: 'Occasional gaslighting behavior making user doubt their perception',
                    examples: ["That didn't happen", "You're too sensitive"],
                    pattern: 'occasional',
                  },
                ],
                coerciveControl: {
                  detected: false,
                  tactics: [],
                  severity: 'low',
                  evidence: [],
                },
                traumaBonding: {
                  detected: false,
                  indicators: [],
                  cycleDetected: false,
                  evidence: [],
                },
                summary: 'Some gaslighting detected but not consistent pattern',
                recommendations: ['Trust your perceptions', 'Set clear boundaries'],
              }),
            },
            finish_reason: 'stop',
            index: 0,
          },
        ],
      })

      const input = createMockInput('yellow', [
        { type: 'explicit-manipulation', severity: 'medium' },
      ])

      const result = await runRiskEvaluator(input)

      expect(result.evaluator).toBe('risk-evaluator')
      expect(result.manipulationTactics.length).toBeGreaterThan(0)
      expect(result.escalateToCrisisEvaluator).toBe(false)
      expect(result.metadata.model).toBe('openai/gpt-4')
      expect(result.metadata.triggerReason).toContain('Minor safety concerns')
    })

    it('should detect high-risk patterns and escalate to crisis', async () => {
      mockCreate.mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify({
                manipulationTactics: [
                  {
                    type: 'DARVO',
                    severity: 'critical',
                    description: 'Consistent DARVO pattern - denies wrongdoing, attacks user, reverses victim/offender roles',
                    examples: ["You're the one hurting me", "I'm the victim here"],
                    pattern: 'consistent',
                  },
                  {
                    type: 'isolation',
                    severity: 'high',
                    description: 'Attempting to isolate user from support system',
                    examples: ["Your friends don't understand us", "Your family is toxic"],
                    pattern: 'frequent',
                  },
                ],
                coerciveControl: {
                  detected: true,
                  tactics: ['Monitoring communication', 'Restricting activities', 'Financial control attempts'],
                  severity: 'high',
                  evidence: ['Must report whereabouts', 'Questions all spending'],
                },
                traumaBonding: {
                  detected: true,
                  indicators: ['Intermittent reinforcement', 'Isolation from support'],
                  cycleDetected: true,
                  evidence: ['Love bombing then withdrawal', 'Creates dependence'],
                },
                summary: 'High-risk situation with multiple concerning patterns including coercive control',
                recommendations: ['Reach out to domestic violence hotline', 'Create safety plan', 'Document incidents'],
              }),
            },
            finish_reason: 'stop',
            index: 0,
          },
        ],
      })

      const input = createMockInput('orange', [
        { type: 'explicit-manipulation', severity: 'high' },
        { type: 'threat', severity: 'medium' },
      ])

      const result = await runRiskEvaluator(input)

      expect(result.manipulationTactics.length).toBeGreaterThan(1)
      expect(result.coerciveControl.detected).toBe(true)
      expect(result.traumaBonding.detected).toBe(true)
      expect(result.escalateToCrisisEvaluator).toBe(true)
      expect(result.recommendations.length).toBeGreaterThan(0)
    })

    it('should track metadata correctly', async () => {
      mockCreate.mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify({
                manipulationTactics: [],
                coerciveControl: { detected: false, tactics: [], severity: 'low', evidence: [] },
                traumaBonding: { detected: false, indicators: [], cycleDetected: false, evidence: [] },
                summary: 'Test',
                recommendations: [],
              }),
            },
            finish_reason: 'stop',
            index: 0,
          },
        ],
      })

      const input = createMockInput('yellow', [])
      const result = await runRiskEvaluator(input)

      expect(result.metadata.evaluatedAt).toBeDefined()
      expect(result.metadata.durationMs).toBeGreaterThanOrEqual(0)
      expect(result.metadata.model).toBe('openai/gpt-4')
      expect(result.metadata.tokensUsed).toBeDefined()
      expect(result.metadata.costUsd).toBeGreaterThan(0)
      expect(result.metadata.triggerReason).toBeDefined()
    })

    it('should handle API errors gracefully', async () => {
      mockCreate.mockRejectedValue(new Error('API Error'))

      const input = createMockInput('yellow', [])

      await expect(runRiskEvaluator(input)).rejects.toThrow('API Error')
    })
  })
})
