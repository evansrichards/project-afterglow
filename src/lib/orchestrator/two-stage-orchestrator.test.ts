/**
 * Tests for Two-Stage Orchestrator
 */

import { describe, it, expect, vi } from 'vitest'
import { runTwoStageAnalysis, printResultSummary } from './two-stage-orchestrator'
import type { AnalyzerInput } from '../analyzers/types'

// Mock the analyzers
vi.mock('../analyzers/safety-screener', () => ({
  runSafetyScreener: vi.fn(),
}))

vi.mock('../analyzers/stage2-comprehensive', () => ({
  runStage2Comprehensive: vi.fn(),
}))

// Mock the report generators
vi.mock('../reports/stage1-report-generator', () => ({
  generateStage1Report: vi.fn(),
}))

vi.mock('../reports/stage2-report-generator', () => ({
  generateStage2Report: vi.fn(),
}))

import { runSafetyScreener } from '../analyzers/safety-screener'
import { runStage2Comprehensive } from '../analyzers/stage2-comprehensive'
import { generateStage1Report } from '../reports/stage1-report-generator'
import { generateStage2Report } from '../reports/stage2-report-generator'

describe('Two-Stage Orchestrator', () => {
  const mockInput: AnalyzerInput = {
    messages: [
      {
        id: 'msg1',
        matchId: 'match1',
        senderId: 'user1',
        sentAt: '2024-01-15T10:00:00Z',
        body: 'Hi there',
        direction: 'user',
      },
    ],
    matches: [],
    participants: [],
    userId: 'user1',
  }

  describe('runTwoStageAnalysis - Green/Yellow (Stage 1 only)', () => {
    it('should complete at Stage 1 for green risk level', async () => {
      const mockSafetyOutput = {
        analyzer: 'safety-screener' as const,
        riskLevel: 'green' as const,
        redFlags: [],
        greenFlags: ['Healthy communication'],
        escalateToRiskEvaluator: false,
        summary: 'Healthy patterns',
        metadata: {
          analyzedAt: '2025-01-15T10:00:00Z',
          durationMs: 12000,
          model: 'openai/gpt-3.5-turbo',
          costUsd: 0.5,
        },
      }

      const mockStage1Report = {
        reportType: 'stage1-complete' as const,
        safetyAssessment: {
          riskLevel: 'green' as const,
          headline: 'Healthy patterns',
          summary: 'Good communication',
          riskLevelDescription: 'No concerns',
        },
        insights: [],
        recommendations: [],
        processingInfo: {
          stage: 'Stage 1: Quick Triage' as const,
          completedAt: '2025-01-15T10:00:00Z',
          durationSeconds: 12,
          costUsd: 0.5,
          model: 'openai/gpt-3.5-turbo',
        },
        escalation: undefined,
      }

      vi.mocked(runSafetyScreener).mockResolvedValue(mockSafetyOutput)
      vi.mocked(generateStage1Report).mockReturnValue(mockStage1Report)

      const result = await runTwoStageAnalysis(mockInput)

      expect(result.completedStage).toBe('stage1')
      expect(result.stage1Report).toBeDefined()
      expect(result.stage2Report).toBeNull()
      expect(result.processing.escalated).toBe(false)
      expect(result.processing.escalationReason).toBeNull()
      expect(result.processing.stage2Duration).toBeNull()
      expect(result.processing.stage2Cost).toBeNull()
      expect(result.processing.totalCost).toBe(0.5)

      expect(runSafetyScreener).toHaveBeenCalledWith(mockInput)
      expect(runStage2Comprehensive).not.toHaveBeenCalled()
    })

    it('should complete at Stage 1 for yellow risk level', async () => {
      const mockSafetyOutput = {
        analyzer: 'safety-screener' as const,
        riskLevel: 'yellow' as const,
        redFlags: [],
        greenFlags: [],
        escalateToRiskEvaluator: false,
        summary: 'Minor concerns',
        metadata: {
          analyzedAt: '2025-01-15T10:00:00Z',
          durationMs: 13000,
          model: 'openai/gpt-3.5-turbo',
          costUsd: 0.52,
        },
      }

      const mockStage1Report = {
        reportType: 'stage1-complete' as const,
        safetyAssessment: {
          riskLevel: 'yellow' as const,
          headline: 'Minor concerns',
          summary: 'Stay aware',
          riskLevelDescription: 'Minor issues',
        },
        insights: [],
        recommendations: [],
        processingInfo: {
          stage: 'Stage 1: Quick Triage' as const,
          completedAt: '2025-01-15T10:00:00Z',
          durationSeconds: 13,
          costUsd: 0.52,
          model: 'openai/gpt-3.5-turbo',
        },
        escalation: undefined,
      }

      vi.mocked(runSafetyScreener).mockResolvedValue(mockSafetyOutput)
      vi.mocked(generateStage1Report).mockReturnValue(mockStage1Report)

      const result = await runTwoStageAnalysis(mockInput)

      expect(result.completedStage).toBe('stage1')
      expect(result.processing.escalated).toBe(false)
    })
  })

  describe('runTwoStageAnalysis - Orange/Red (Stage 2)', () => {
    it('should escalate to Stage 2 for orange risk level', async () => {
      const mockSafetyOutput = {
        analyzer: 'safety-screener' as const,
        riskLevel: 'orange' as const,
        redFlags: [
          {
            type: 'pressure' as const,
            severity: 'medium' as const,
            description: 'Pressure detected',
            examples: ['Example'],
          },
        ],
        greenFlags: [],
        escalateToRiskEvaluator: true,
        summary: 'Concerning patterns',
        metadata: {
          analyzedAt: '2025-01-15T10:00:00Z',
          durationMs: 15000,
          model: 'openai/gpt-3.5-turbo',
          costUsd: 0.55,
        },
      }

      const mockStage1Report = {
        reportType: 'stage1-escalating' as const,
        safetyAssessment: {
          riskLevel: 'orange' as const,
          headline: 'Concerning patterns',
          summary: 'Needs deeper analysis',
          riskLevelDescription: 'Multiple concerns',
        },
        insights: [],
        recommendations: [],
        processingInfo: {
          stage: 'Stage 1: Quick Triage' as const,
          completedAt: '2025-01-15T10:00:00Z',
          durationSeconds: 15,
          costUsd: 0.55,
          model: 'openai/gpt-3.5-turbo',
        },
        escalation: {
          willEscalate: true,
          reason: 'Concerning patterns',
          nextSteps: 'Running comprehensive analysis',
        },
      }

      const mockStage2Output = {
        analyzer: 'stage2-comprehensive' as const,
        safetyDeepDive: {
          manipulationTactics: [],
          coerciveControl: {
            detected: false,
            patterns: [],
            examples: [],
            escalation: 'none' as const,
          },
          traumaBonding: { detected: false, indicators: [], cyclePhases: [] },
          crisisLevel: 'moderate' as const,
          recommendedResources: [],
        },
        attachmentAnalysis: {
          primaryStyle: 'anxious' as const,
          confidence: 0.8,
          evidence: [],
          triggers: [],
          copingMechanisms: [],
          relationshipDynamics: {
            patterns: [],
            healthyAspects: [],
            concerningAspects: [],
            recommendations: [],
          },
        },
        growthTrajectory: null,
        synthesis: {
          overallSummary: 'Comprehensive analysis complete',
          keyThemes: [],
          prioritizedInsights: [],
          recommendations: [],
        },
        metadata: {
          analyzedAt: '2025-01-15T10:01:00Z',
          durationMs: 45000,
          model: 'openai/gpt-4-turbo',
          costUsd: 1.8,
        },
      }

      const mockStage2Report = {
        reportType: 'stage2-comprehensive' as const,
        stage1Summary: mockStage1Report.safetyAssessment,
        safetyDeepDive: {
          crisisLevel: 'moderate' as const,
          manipulationTactics: [],
          coerciveControl: { detected: false, summary: 'No concerns', patterns: [] },
          traumaBonding: { detected: false, summary: 'No concerns', cyclePhases: [] },
          professionalSupport: [],
        },
        attachmentAnalysis: {
          primaryStyle: 'anxious' as const,
          confidence: 0.8,
          styleDescription: 'Anxious attachment',
          evidence: [],
          triggers: [],
          copingMechanisms: [],
          relationshipDynamics: {
            healthyAspects: [],
            concerningAspects: [],
            recommendations: [],
          },
        },
        growthTrajectory: null,
        synthesis: {
          overallSummary: 'Complete',
          keyThemes: [],
          criticalInsights: [],
          prioritizedRecommendations: [],
        },
        processingInfo: {
          stage: 'Stage 2: Comprehensive Analysis' as const,
          completedAt: '2025-01-15T10:01:00Z',
          durationSeconds: 45,
          costUsd: 1.8,
          model: 'openai/gpt-4-turbo',
        },
      }

      vi.mocked(runSafetyScreener).mockResolvedValue(mockSafetyOutput)
      vi.mocked(generateStage1Report).mockReturnValue(mockStage1Report)
      vi.mocked(runStage2Comprehensive).mockResolvedValue(mockStage2Output)
      vi.mocked(generateStage2Report).mockReturnValue(mockStage2Report)

      const result = await runTwoStageAnalysis(mockInput)

      expect(result.completedStage).toBe('stage2')
      expect(result.stage1Report).toBeDefined()
      expect(result.stage2Report).toBeDefined()
      expect(result.processing.escalated).toBe(true)
      expect(result.processing.escalationReason).toContain('ORANGE')
      expect(result.processing.stage2Duration).toBeGreaterThanOrEqual(0)
      expect(result.processing.stage2Cost).toBe(1.8)
      expect(result.processing.totalCost).toBe(0.55 + 1.8)

      expect(runSafetyScreener).toHaveBeenCalledWith(mockInput)
      expect(runStage2Comprehensive).toHaveBeenCalledWith({
        ...mockInput,
        stage1Results: mockSafetyOutput,
      })
    })

    it('should escalate to Stage 2 for red risk level', async () => {
      const mockSafetyOutput = {
        analyzer: 'safety-screener' as const,
        riskLevel: 'red' as const,
        redFlags: [
          {
            type: 'threat' as const,
            severity: 'high' as const,
            description: 'Threats detected',
            examples: ['Threat example'],
          },
        ],
        greenFlags: [],
        escalateToRiskEvaluator: true,
        summary: 'Serious concerns',
        metadata: {
          analyzedAt: '2025-01-15T10:00:00Z',
          durationMs: 18000,
          model: 'openai/gpt-3.5-turbo',
          costUsd: 0.6,
        },
      }

      const mockStage1Report = {
        reportType: 'stage1-escalating' as const,
        safetyAssessment: {
          riskLevel: 'red' as const,
          headline: 'Serious concerns',
          summary: 'Immediate analysis needed',
          riskLevelDescription: 'Critical safety concerns',
        },
        insights: [],
        recommendations: [],
        processingInfo: {
          stage: 'Stage 1: Quick Triage' as const,
          completedAt: '2025-01-15T10:00:00Z',
          durationSeconds: 18,
          costUsd: 0.6,
          model: 'openai/gpt-3.5-turbo',
        },
        escalation: {
          willEscalate: true,
          reason: 'Serious safety concerns',
          nextSteps: 'Running comprehensive safety analysis',
        },
      }

      const mockStage2Output = {
        analyzer: 'stage2-comprehensive' as const,
        safetyDeepDive: {
          manipulationTactics: [],
          coerciveControl: {
            detected: true,
            patterns: ['Control pattern'],
            examples: [],
            escalation: 'rapid' as const,
          },
          traumaBonding: { detected: true, indicators: [], cyclePhases: [] },
          crisisLevel: 'critical' as const,
          recommendedResources: [
            {
              type: 'crisis-hotline' as const,
              priority: 'immediate' as const,
              rationale: 'Critical safety concerns',
            },
          ],
        },
        attachmentAnalysis: {
          primaryStyle: 'anxious' as const,
          confidence: 0.9,
          evidence: [],
          triggers: [],
          copingMechanisms: [],
          relationshipDynamics: {
            patterns: [],
            healthyAspects: [],
            concerningAspects: [],
            recommendations: [],
          },
        },
        growthTrajectory: null,
        synthesis: {
          overallSummary: 'Critical safety concerns identified',
          keyThemes: [],
          prioritizedInsights: [],
          recommendations: [],
        },
        metadata: {
          analyzedAt: '2025-01-15T10:01:00Z',
          durationMs: 50000,
          model: 'openai/gpt-4-turbo',
          costUsd: 2.1,
        },
      }

      const mockStage2Report = {
        reportType: 'stage2-comprehensive' as const,
        stage1Summary: mockStage1Report.safetyAssessment,
        safetyDeepDive: {
          crisisLevel: 'critical' as const,
          manipulationTactics: [],
          coerciveControl: { detected: true, summary: 'Control detected', patterns: [] },
          traumaBonding: { detected: true, summary: 'Bonding detected', cyclePhases: [] },
          professionalSupport: [
            {
              type: 'crisis-hotline',
              priority: 'immediate' as const,
              description: 'Call 1-800-799-7233',
            },
          ],
        },
        attachmentAnalysis: {
          primaryStyle: 'anxious' as const,
          confidence: 0.9,
          styleDescription: 'Anxious attachment',
          evidence: [],
          triggers: [],
          copingMechanisms: [],
          relationshipDynamics: {
            healthyAspects: [],
            concerningAspects: [],
            recommendations: [],
          },
        },
        growthTrajectory: null,
        synthesis: {
          overallSummary: 'Critical concerns',
          keyThemes: [],
          criticalInsights: [],
          prioritizedRecommendations: [],
        },
        processingInfo: {
          stage: 'Stage 2: Comprehensive Analysis' as const,
          completedAt: '2025-01-15T10:01:00Z',
          durationSeconds: 50,
          costUsd: 2.1,
          model: 'openai/gpt-4-turbo',
        },
      }

      vi.mocked(runSafetyScreener).mockResolvedValue(mockSafetyOutput)
      vi.mocked(generateStage1Report).mockReturnValue(mockStage1Report)
      vi.mocked(runStage2Comprehensive).mockResolvedValue(mockStage2Output)
      vi.mocked(generateStage2Report).mockReturnValue(mockStage2Report)

      const result = await runTwoStageAnalysis(mockInput)

      expect(result.completedStage).toBe('stage2')
      expect(result.processing.escalationReason).toContain('RED')
      expect(result.stage2Report?.safetyDeepDive.crisisLevel).toBe('critical')
    })
  })

  describe('runTwoStageAnalysis - verbose mode', () => {
    it('should log progress when verbose is true', async () => {
      const consoleSpy = vi.spyOn(console, 'log')

      const mockSafetyOutput = {
        analyzer: 'safety-screener' as const,
        riskLevel: 'green' as const,
        redFlags: [],
        greenFlags: [],
        escalateToRiskEvaluator: false,
        summary: 'Healthy',
        metadata: {
          analyzedAt: '2025-01-15T10:00:00Z',
          durationMs: 12000,
          model: 'openai/gpt-3.5-turbo',
          costUsd: 0.5,
        },
      }

      const mockStage1Report = {
        reportType: 'stage1-complete' as const,
        safetyAssessment: {
          riskLevel: 'green' as const,
          headline: 'Healthy',
          summary: 'Good',
          riskLevelDescription: 'No concerns',
        },
        insights: [],
        recommendations: [],
        processingInfo: {
          stage: 'Stage 1: Quick Triage' as const,
          completedAt: '2025-01-15T10:00:00Z',
          durationSeconds: 12,
          costUsd: 0.5,
          model: 'openai/gpt-3.5-turbo',
        },
        escalation: undefined,
      }

      vi.mocked(runSafetyScreener).mockResolvedValue(mockSafetyOutput)
      vi.mocked(generateStage1Report).mockReturnValue(mockStage1Report)

      await runTwoStageAnalysis(mockInput, { verbose: true })

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Starting Stage 1')
      )
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Stage 1 complete')
      )

      consoleSpy.mockRestore()
    })
  })

  describe('printResultSummary', () => {
    it('should print summary for Stage 1 only result', () => {
      const consoleSpy = vi.spyOn(console, 'log')

      const mockResult = {
        completedStage: 'stage1' as const,
        stage1Report: {
          reportType: 'stage1-complete' as const,
          safetyAssessment: {
            riskLevel: 'green' as const,
            headline: 'Healthy',
            summary: 'Good',
            riskLevelDescription: 'No concerns',
          },
          insights: [],
          recommendations: [],
          processingInfo: {
            stage: 'Stage 1: Quick Triage' as const,
            completedAt: '2025-01-15T10:00:00Z',
            durationSeconds: 12,
            costUsd: 0.5,
            model: 'openai/gpt-3.5-turbo',
          },
          escalation: undefined,
        },
        stage2Report: null,
        processing: {
          stage1Duration: 12000,
          stage2Duration: null,
          totalDuration: 12000,
          stage1Cost: 0.5,
          stage2Cost: null,
          totalCost: 0.5,
          escalated: false,
          escalationReason: null,
        },
      }

      printResultSummary(mockResult)

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('ANALYSIS COMPLETE')
      )
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('STAGE1'))
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('GREEN'))

      consoleSpy.mockRestore()
    })

    it('should print summary for Stage 2 result with crisis info', () => {
      const consoleSpy = vi.spyOn(console, 'log')

      const mockResult = {
        completedStage: 'stage2' as const,
        stage1Report: {
          reportType: 'stage1-escalating' as const,
          safetyAssessment: {
            riskLevel: 'red' as const,
            headline: 'Serious concerns',
            summary: 'Critical',
            riskLevelDescription: 'Safety concerns',
          },
          insights: [],
          recommendations: [],
          processingInfo: {
            stage: 'Stage 1: Quick Triage' as const,
            completedAt: '2025-01-15T10:00:00Z',
            durationSeconds: 15,
            costUsd: 0.6,
            model: 'openai/gpt-3.5-turbo',
          },
          escalation: {
            willEscalate: true,
            reason: 'Critical',
            nextSteps: 'Running analysis',
          },
        },
        stage2Report: {
          reportType: 'stage2-comprehensive' as const,
          stage1Summary: {
            riskLevel: 'red' as const,
            headline: 'Serious',
            summary: 'Critical',
          },
          safetyDeepDive: {
            crisisLevel: 'critical' as const,
            manipulationTactics: [],
            coerciveControl: { detected: true, summary: 'Yes', patterns: [] },
            traumaBonding: { detected: true, summary: 'Yes', cyclePhases: [] },
            professionalSupport: [
              {
                type: 'crisis-hotline',
                priority: 'immediate' as const,
                description: 'Call now',
              },
            ],
          },
          attachmentAnalysis: {
            primaryStyle: 'anxious' as const,
            confidence: 0.9,
            styleDescription: 'Anxious',
            evidence: [],
            triggers: [],
            copingMechanisms: [],
            relationshipDynamics: {
              healthyAspects: [],
              concerningAspects: [],
              recommendations: [],
            },
          },
          growthTrajectory: null,
          synthesis: {
            overallSummary: 'Critical',
            keyThemes: [],
            criticalInsights: [],
            prioritizedRecommendations: [],
          },
          processingInfo: {
            stage: 'Stage 2: Comprehensive Analysis' as const,
            completedAt: '2025-01-15T10:01:00Z',
            durationSeconds: 50,
            costUsd: 2.1,
            model: 'openai/gpt-4-turbo',
          },
        },
        processing: {
          stage1Duration: 15000,
          stage2Duration: 50000,
          totalDuration: 65000,
          stage1Cost: 0.6,
          stage2Cost: 2.1,
          totalCost: 2.7,
          escalated: true,
          escalationReason: 'RED risk',
        },
      }

      printResultSummary(mockResult)

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('STAGE2'))
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('CRITICAL'))
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('PROFESSIONAL SUPPORT')
      )

      consoleSpy.mockRestore()
    })
  })
})
