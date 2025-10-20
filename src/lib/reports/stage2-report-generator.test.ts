/**
 * Tests for Stage 2 Report Generator
 */

import { describe, it, expect } from 'vitest'
import {
  generateStage2Report,
  formatStage2ReportAsMarkdown,
  formatStage2ReportAsText,
} from './stage2-report-generator'
import type { Stage2ComprehensiveOutput } from '../analyzers/stage2-types'
import type { Stage1Report } from './stage1-report-generator'

describe('Stage 2 Report Generator', () => {
  const mockStage1Summary: Stage1Report['safetyAssessment'] = {
    riskLevel: 'orange',
    headline: 'Some concerning patterns detected',
    summary: 'Multiple concerning patterns requiring deeper analysis',
    riskLevelDescription: 'We detected multiple concerning patterns...',
  }

  const mockStage2Output: Stage2ComprehensiveOutput = {
    analyzer: 'stage2-comprehensive',
    safetyDeepDive: {
      manipulationTactics: [
        {
          type: 'gaslighting',
          severity: 'high',
          description: 'Pattern of reality distortion detected',
          examples: [
            'Match: "That never happened, you\'re remembering it wrong"',
            'Match: "You\'re too sensitive, I was just joking"',
          ],
          pattern: 'Escalates when User sets boundaries',
        },
        {
          type: 'love-bombing',
          severity: 'medium',
          description: 'Intense affection followed by withdrawal',
          examples: ['Match: "You\'re perfect" followed by days of silence'],
          pattern: 'Occurs in cycles every 2-3 weeks',
        },
      ],
      coerciveControl: {
        detected: true,
        patterns: ['Monitoring User\'s activities', 'Controlling who User talks to'],
        examples: ['Match: "Who were you texting?"', 'Match: "I don\'t like your friends"'],
        escalation: 'gradual',
      },
      traumaBonding: {
        detected: true,
        indicators: ['User defends Match despite red flags', 'Intermittent reinforcement'],
        cyclePhases: [
          {
            phase: 'tension-building',
            description: 'Match becomes distant and critical',
            examples: ['Match stops responding for days'],
          },
          {
            phase: 'reconciliation',
            description: 'Match apologizes profusely and promises change',
            examples: ['Match: "I\'m sorry, I\'ll do better"'],
          },
        ],
      },
      crisisLevel: 'high',
      recommendedResources: [
        {
          type: 'domestic-violence-advocate',
          priority: 'high',
          rationale: 'Coercive control and manipulation patterns detected',
        },
        {
          type: 'therapist',
          priority: 'high',
          rationale: 'Trauma bonding and attachment concerns',
        },
      ],
    },
    attachmentAnalysis: {
      primaryStyle: 'anxious',
      confidence: 0.85,
      evidence: [
        'Seeks frequent reassurance',
        'Worried about relationship stability',
        'Difficulty trusting',
      ],
      triggers: [
        {
          trigger: 'Match not responding quickly',
          response: 'Sends multiple follow-up messages',
          healthiness: 'concerning',
          examples: ['User: "Are you there?" "Hello?" "Did I say something wrong?"'],
        },
      ],
      copingMechanisms: [
        {
          mechanism: 'Seeking validation from Match',
          effectiveness: 'harmful',
          frequency: 'frequent',
          examples: ['User: "Do you still like me?" "Are we okay?"'],
        },
      ],
      relationshipDynamics: {
        patterns: ['Push-pull dynamic', 'Anxious-avoidant pairing'],
        healthyAspects: ['User communicates feelings clearly'],
        concerningAspects: ['Tolerance of concerning behavior', 'Difficulty setting boundaries'],
        recommendations: [
          'Work with therapist on attachment patterns',
          'Practice self-soothing techniques',
        ],
      },
    },
    growthTrajectory: {
      detected: true,
      timeRangeMonths: 20,
      direction: 'fluctuating',
      skillsImproved: [
        {
          skill: 'Expressing needs directly',
          improvement: 'moderate',
          evidence: ['Earlier: passive hints', 'Later: direct statements'],
        },
      ],
      growthOpportunities: [
        {
          area: 'Boundary setting',
          priority: 'high',
          recommendations: [
            'Practice saying no',
            'Work with therapist on assertiveness',
          ],
        },
      ],
      developmentInsights: [
        'Shows capacity for self-reflection',
        'Growth interrupted by challenging relationship dynamics',
      ],
    },
    synthesis: {
      overallSummary:
        'Analysis reveals concerning manipulation patterns alongside anxious attachment style. While some personal growth is evident, current relationship dynamics are hindering development.',
      keyThemes: [
        'Manipulation and coercive control',
        'Anxious attachment with trauma bonding',
        'Personal growth potential',
      ],
      prioritizedInsights: [
        {
          insight: 'Safety concerns require immediate professional support',
          category: 'safety',
          importance: 'critical',
          actionable: true,
        },
        {
          insight: 'Anxious attachment style makes User vulnerable to manipulation',
          category: 'attachment',
          importance: 'high',
          actionable: true,
        },
      ],
      recommendations: [
        {
          recommendation: 'Speak with domestic violence advocate',
          rationale: 'Coercive control patterns identified',
          priority: 'immediate',
          category: 'safety',
        },
        {
          recommendation: 'Work with trauma-informed therapist',
          rationale: 'Address attachment patterns and trauma bonding',
          priority: 'high',
          category: 'professional-support',
        },
      ],
    },
    metadata: {
      analyzedAt: '2025-01-15T12:00:00Z',
      durationMs: 45000,
      model: 'openai/gpt-4-turbo',
      tokensUsed: { input: 15000, output: 3000 },
      costUsd: 2.4,
    },
  }

  describe('generateStage2Report', () => {
    it('should generate comprehensive report', () => {
      const report = generateStage2Report(mockStage2Output, mockStage1Summary)

      expect(report.reportType).toBe('stage2-comprehensive')
      expect(report.stage1Summary.riskLevel).toBe('orange')
      expect(report.safetyDeepDive).toBeDefined()
      expect(report.attachmentAnalysis).toBeDefined()
      expect(report.growthTrajectory).toBeDefined()
      expect(report.synthesis).toBeDefined()
      expect(report.processingInfo).toBeDefined()
    })

    it('should include Stage 1 context', () => {
      const report = generateStage2Report(mockStage2Output, mockStage1Summary)

      expect(report.stage1Summary.headline).toBe('Some concerning patterns detected')
      expect(report.stage1Summary.summary).toContain('deeper analysis')
    })

    it('should format manipulation tactics', () => {
      const report = generateStage2Report(mockStage2Output, mockStage1Summary)

      expect(report.safetyDeepDive.manipulationTactics).toHaveLength(2)
      expect(report.safetyDeepDive.manipulationTactics[0].type).toBe('Gaslighting')
      expect(report.safetyDeepDive.manipulationTactics[1].type).toBe('Love-Bombing')
    })

    it('should include coercive control summary', () => {
      const report = generateStage2Report(mockStage2Output, mockStage1Summary)

      expect(report.safetyDeepDive.coerciveControl.detected).toBe(true)
      expect(report.safetyDeepDive.coerciveControl.summary).toContain('coercive control')
      expect(report.safetyDeepDive.coerciveControl.patterns).toHaveLength(2)
    })

    it('should include trauma bonding summary', () => {
      const report = generateStage2Report(mockStage2Output, mockStage1Summary)

      expect(report.safetyDeepDive.traumaBonding.detected).toBe(true)
      expect(report.safetyDeepDive.traumaBonding.summary).toContain('trauma bonding')
    })

    it('should format professional support with descriptions', () => {
      const report = generateStage2Report(mockStage2Output, mockStage1Summary)

      expect(report.safetyDeepDive.professionalSupport).toHaveLength(2)
      expect(report.safetyDeepDive.professionalSupport[0].description).toContain(
        'advocate'
      )
      expect(report.safetyDeepDive.professionalSupport[0].description).toContain(
        '1-800-799-7233'
      )
    })

    it('should include attachment style description', () => {
      const report = generateStage2Report(mockStage2Output, mockStage1Summary)

      expect(report.attachmentAnalysis.primaryStyle).toBe('anxious')
      expect(report.attachmentAnalysis.confidence).toBe(0.85)
      expect(report.attachmentAnalysis.styleDescription).toContain(
        'anxious attachment style'
      )
    })

    it('should format triggers with guidance', () => {
      const report = generateStage2Report(mockStage2Output, mockStage1Summary)

      expect(report.attachmentAnalysis.triggers).toHaveLength(1)
      expect(report.attachmentAnalysis.triggers[0].guidance).toContain('therapist')
    })

    it('should format coping mechanisms with recommendations', () => {
      const report = generateStage2Report(mockStage2Output, mockStage1Summary)

      expect(report.attachmentAnalysis.copingMechanisms).toHaveLength(1)
      expect(report.attachmentAnalysis.copingMechanisms[0].recommendation).toContain(
        'healthier'
      )
    })

    it('should include growth trajectory when present', () => {
      const report = generateStage2Report(mockStage2Output, mockStage1Summary)

      expect(report.growthTrajectory).not.toBeNull()
      expect(report.growthTrajectory?.detected).toBe(true)
      expect(report.growthTrajectory?.timeRangeMonths).toBe(20)
      expect(report.growthTrajectory?.summary).toContain('20 months')
    })

    it('should handle null growth trajectory', () => {
      const outputWithoutGrowth = {
        ...mockStage2Output,
        growthTrajectory: null,
      }

      const report = generateStage2Report(outputWithoutGrowth, mockStage1Summary)

      expect(report.growthTrajectory).toBeNull()
    })

    it('should include synthesis with prioritized insights', () => {
      const report = generateStage2Report(mockStage2Output, mockStage1Summary)

      expect(report.synthesis.overallSummary).toBeDefined()
      expect(report.synthesis.keyThemes).toHaveLength(3)
      expect(report.synthesis.criticalInsights).toHaveLength(2)
      expect(report.synthesis.prioritizedRecommendations).toHaveLength(2)
    })

    it('should include processing metadata', () => {
      const report = generateStage2Report(mockStage2Output, mockStage1Summary)

      expect(report.processingInfo.stage).toBe('Stage 2: Comprehensive Analysis')
      expect(report.processingInfo.durationSeconds).toBe(45)
      expect(report.processingInfo.costUsd).toBe(2.4)
      expect(report.processingInfo.model).toBe('openai/gpt-4-turbo')
    })
  })

  describe('formatStage2ReportAsMarkdown', () => {
    it('should format complete report as markdown', () => {
      const report = generateStage2Report(mockStage2Output, mockStage1Summary)
      const markdown = formatStage2ReportAsMarkdown(report)

      expect(markdown).toContain('# Comprehensive Relationship Analysis')
      expect(markdown).toContain('## Initial Assessment')
      expect(markdown).toContain('## Safety Analysis')
      expect(markdown).toContain('## Attachment Analysis')
      expect(markdown).toContain('## Personal Growth Trajectory')
      expect(markdown).toContain('## Overall Assessment')
    })

    it('should include crisis level indicator', () => {
      const report = generateStage2Report(mockStage2Output, mockStage1Summary)
      const markdown = formatStage2ReportAsMarkdown(report)

      expect(markdown).toContain('**Crisis Level:**')
      expect(markdown).toContain('HIGH')
    })

    it('should format manipulation tactics with severity', () => {
      const report = generateStage2Report(mockStage2Output, mockStage1Summary)
      const markdown = formatStage2ReportAsMarkdown(report)

      expect(markdown).toContain('Gaslighting')
      expect(markdown).toContain('high severity')
      expect(markdown).toContain('Love-Bombing')
    })

    it('should include professional support with priority emojis', () => {
      const report = generateStage2Report(mockStage2Output, mockStage1Summary)
      const markdown = formatStage2ReportAsMarkdown(report)

      expect(markdown).toContain('Professional Support Recommendations')
      expect(markdown).toContain('🔴')
      expect(markdown).toContain('1-800-799-7233')
    })

    it('should show attachment style with confidence', () => {
      const report = generateStage2Report(mockStage2Output, mockStage1Summary)
      const markdown = formatStage2ReportAsMarkdown(report)

      expect(markdown).toContain('ANXIOUS')
      expect(markdown).toContain('85%')
    })

    it('should include triggers with health indicators', () => {
      const report = generateStage2Report(mockStage2Output, mockStage1Summary)
      const markdown = formatStage2ReportAsMarkdown(report)

      expect(markdown).toContain('Your Triggers')
      expect(markdown).toContain('⚠️')
    })

    it('should show growth trajectory summary', () => {
      const report = generateStage2Report(mockStage2Output, mockStage1Summary)
      const markdown = formatStage2ReportAsMarkdown(report)

      expect(markdown).toContain('Personal Growth Trajectory')
      expect(markdown).toContain('20 months')
    })

    it('should include prioritized recommendations', () => {
      const report = generateStage2Report(mockStage2Output, mockStage1Summary)
      const markdown = formatStage2ReportAsMarkdown(report)

      expect(markdown).toContain('Recommendations')
      expect(markdown).toContain('domestic violence advocate')
      expect(markdown).toContain('🚨')
    })

    it('should include processing info', () => {
      const report = generateStage2Report(mockStage2Output, mockStage1Summary)
      const markdown = formatStage2ReportAsMarkdown(report)

      expect(markdown).toContain('Stage 2: Comprehensive Analysis')
      expect(markdown).toContain('45 seconds')
      expect(markdown).toContain('gpt-4-turbo')
      expect(markdown).toContain('$2.40')
    })

    it('should skip growth section when null', () => {
      const outputWithoutGrowth = {
        ...mockStage2Output,
        growthTrajectory: null,
      }
      const report = generateStage2Report(outputWithoutGrowth, mockStage1Summary)
      const markdown = formatStage2ReportAsMarkdown(report)

      expect(markdown).not.toContain('Personal Growth Trajectory')
    })
  })

  describe('formatStage2ReportAsText', () => {
    it('should format report as plain text', () => {
      const report = generateStage2Report(mockStage2Output, mockStage1Summary)
      const text = formatStage2ReportAsText(report)

      expect(text).toContain('COMPREHENSIVE RELATIONSHIP ANALYSIS')
      expect(text).toContain('====')
      expect(text).toContain('INITIAL ASSESSMENT')
      expect(text).toContain('SAFETY ANALYSIS')
      expect(text).toContain('ATTACHMENT ANALYSIS')
      expect(text).toContain('OVERALL ASSESSMENT')
    })

    it('should include crisis level', () => {
      const report = generateStage2Report(mockStage2Output, mockStage1Summary)
      const text = formatStage2ReportAsText(report)

      expect(text).toContain('Crisis Level: HIGH')
    })

    it('should list manipulation tactics', () => {
      const report = generateStage2Report(mockStage2Output, mockStage1Summary)
      const text = formatStage2ReportAsText(report)

      expect(text).toContain('Manipulation Tactics Detected:')
      expect(text).toContain('Gaslighting')
      expect(text).toContain('Love-Bombing')
    })

    it('should include professional support', () => {
      const report = generateStage2Report(mockStage2Output, mockStage1Summary)
      const text = formatStage2ReportAsText(report)

      expect(text).toContain('Professional Support Recommended:')
      expect(text).toContain('DOMESTIC-VIOLENCE-ADVOCATE')
    })

    it('should show attachment style', () => {
      const report = generateStage2Report(mockStage2Output, mockStage1Summary)
      const text = formatStage2ReportAsText(report)

      expect(text).toContain('Your Attachment Style: ANXIOUS')
      expect(text).toContain('Confidence: 85%')
    })

    it('should include growth trajectory summary', () => {
      const report = generateStage2Report(mockStage2Output, mockStage1Summary)
      const text = formatStage2ReportAsText(report)

      expect(text).toContain('PERSONAL GROWTH TRAJECTORY')
      expect(text).toContain('20 months')
    })

    it('should list recommendations with priority', () => {
      const report = generateStage2Report(mockStage2Output, mockStage1Summary)
      const text = formatStage2ReportAsText(report)

      expect(text).toContain('RECOMMENDATIONS')
      expect(text).toContain('[IMMEDIATE]')
      expect(text).toContain('[HIGH]')
    })
  })
})
