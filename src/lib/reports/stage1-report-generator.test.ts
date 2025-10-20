/**
 * Tests for Stage 1 Report Generator
 */

import { describe, it, expect } from 'vitest'
import {
  generateStage1Report,
  formatStage1ReportAsMarkdown,
  formatStage1ReportAsText,
} from './stage1-report-generator'
import type { SafetyScreenerOutput } from '../analyzers/types'

describe('Stage 1 Report Generator', () => {
  describe('generateStage1Report', () => {
    it('should generate complete report for green risk level', () => {
      const safetyOutput: SafetyScreenerOutput = {
        analyzer: 'safety-screener',
        riskLevel: 'green',
        redFlags: [],
        greenFlags: [
          'Shows consistent respectful communication',
          'Demonstrates healthy boundary setting',
          'Exhibits genuine interest without pressure',
        ],
        escalateToRiskEvaluator: false,
        summary: 'Your conversations show healthy, respectful communication patterns.',
        metadata: {
          analyzedAt: '2025-01-15T10:00:00Z',
          durationMs: 12500,
          model: 'openai/gpt-3.5-turbo',
          tokensUsed: { input: 5000, output: 500 },
          costUsd: 0.006,
        },
      }

      const report = generateStage1Report(safetyOutput)

      expect(report.reportType).toBe('stage1-complete')
      expect(report.safetyAssessment.riskLevel).toBe('green')
      expect(report.safetyAssessment.headline).toBe(
        'Your conversations show healthy patterns'
      )
      expect(report.safetyAssessment.summary).toBe(
        'Your conversations show healthy, respectful communication patterns.'
      )
      expect(report.insights.length).toBe(3) // 3 green flags
      expect(report.recommendations.length).toBeGreaterThan(0)
      expect(report.processingInfo.stage).toBe('Stage 1: Quick Triage')
      expect(report.processingInfo.durationSeconds).toBe(13) // Rounded from 12.5
      expect(report.processingInfo.costUsd).toBe(0.006)
      expect(report.escalation).toBeUndefined()
    })

    it('should generate escalating report for orange risk level', () => {
      const safetyOutput: SafetyScreenerOutput = {
        analyzer: 'safety-screener',
        riskLevel: 'orange',
        redFlags: [
          {
            type: 'pressure',
            severity: 'medium',
            description: 'Recurring pressure to meet despite expressed hesitation',
            examples: [
              'Match repeatedly asks "why won\'t you meet me?" after User said not ready',
              'Match: "If you really liked me you would make time"',
            ],
          },
          {
            type: 'explicit-manipulation',
            severity: 'medium',
            description: 'Guilt-tripping when boundaries are set',
            examples: ['Match: "I guess you don\'t care about me as much as I care about you"'],
          },
        ],
        greenFlags: ['User consistently sets clear boundaries'],
        escalateToRiskEvaluator: true,
        summary: 'Multiple concerning patterns detected requiring deeper analysis.',
        metadata: {
          analyzedAt: '2025-01-15T10:00:00Z',
          durationMs: 15000,
          model: 'openai/gpt-3.5-turbo',
          tokensUsed: { input: 6000, output: 600 },
          costUsd: 0.007,
        },
      }

      const report = generateStage1Report(safetyOutput)

      expect(report.reportType).toBe('stage1-escalating')
      expect(report.safetyAssessment.riskLevel).toBe('orange')
      expect(report.safetyAssessment.headline).toBe('Some concerning patterns detected')
      expect(report.insights.length).toBe(3) // 2 red flags + 1 green flag
      expect(report.insights[0].category).toBe('safety')
      expect(report.insights[0].title).toContain('Pressure or Coercion')
      expect(report.insights[1].category).toBe('safety')
      expect(report.insights[1].title).toContain('Manipulation Detected')
      expect(report.escalation).toBeDefined()
      expect(report.escalation?.willEscalate).toBe(true)
      expect(report.escalation?.reason).toContain('deeper dynamics')
      expect(report.escalation?.nextSteps).toContain('comprehensive analysis')
    })

    it('should generate escalating report for red risk level', () => {
      const safetyOutput: SafetyScreenerOutput = {
        analyzer: 'safety-screener',
        riskLevel: 'red',
        redFlags: [
          {
            type: 'threat',
            severity: 'high',
            description: 'Explicit threats when User tries to end conversation',
            examples: [
              'Match: "You\'ll regret blocking me"',
              'Match: "I know where you work"',
            ],
          },
        ],
        greenFlags: [],
        escalateToRiskEvaluator: true,
        summary: 'Serious safety concerns detected requiring immediate attention.',
        metadata: {
          analyzedAt: '2025-01-15T10:00:00Z',
          durationMs: 18000,
          model: 'openai/gpt-3.5-turbo',
          tokensUsed: { input: 7000, output: 700 },
          costUsd: 0.008,
        },
      }

      const report = generateStage1Report(safetyOutput)

      expect(report.reportType).toBe('stage1-escalating')
      expect(report.safetyAssessment.riskLevel).toBe('red')
      expect(report.safetyAssessment.headline).toBe('Serious safety concerns detected')
      expect(report.insights.length).toBe(1) // 1 red flag, 0 green flags
      expect(report.insights[0].title).toContain('Threatening Behavior')
      expect(report.escalation).toBeDefined()
      expect(report.escalation?.willEscalate).toBe(true)
      expect(report.escalation?.reason).toContain('safety concerns')
      expect(report.escalation?.nextSteps).toContain('crisis resources')
      expect(report.recommendations[0].priority).toBe('high')
      expect(report.recommendations[0].recommendation).toContain('comprehensive safety')
    })

    it('should generate complete report for yellow risk level', () => {
      const safetyOutput: SafetyScreenerOutput = {
        analyzer: 'safety-screener',
        riskLevel: 'yellow',
        redFlags: [
          {
            type: 'inconsistency',
            severity: 'low',
            description: 'Minor inconsistencies in background details',
            examples: ['Said they work in tech, later mentioned working in finance'],
          },
        ],
        greenFlags: [
          'Generally respectful communication',
          'Shows genuine interest in getting to know User',
        ],
        escalateToRiskEvaluator: false,
        summary:
          'Mostly healthy conversations with minor inconsistencies worth monitoring.',
        metadata: {
          analyzedAt: '2025-01-15T10:00:00Z',
          durationMs: 13500,
          model: 'openai/gpt-3.5-turbo',
          tokensUsed: { input: 5500, output: 550 },
          costUsd: 0.0065,
        },
      }

      const report = generateStage1Report(safetyOutput)

      expect(report.reportType).toBe('stage1-complete')
      expect(report.safetyAssessment.riskLevel).toBe('yellow')
      expect(report.safetyAssessment.headline).toContain('mostly healthy')
      expect(report.insights.length).toBe(3) // 1 red flag + 2 green flags
      expect(report.escalation).toBeUndefined()
      expect(report.recommendations.some((r) => r.recommendation.includes('Stay aware'))).toBe(
        true
      )
    })

    it('should include all red flag types in insights', () => {
      const safetyOutput: SafetyScreenerOutput = {
        analyzer: 'safety-screener',
        riskLevel: 'orange',
        redFlags: [
          {
            type: 'threat',
            severity: 'high',
            description: 'Threatening behavior',
            examples: ['Example threat'],
          },
          {
            type: 'financial-request',
            severity: 'medium',
            description: 'Financial request',
            examples: ['Example request'],
          },
          {
            type: 'explicit-manipulation',
            severity: 'medium',
            description: 'Manipulation',
            examples: ['Example manipulation'],
          },
          {
            type: 'pressure',
            severity: 'low',
            description: 'Pressure',
            examples: ['Example pressure'],
          },
          {
            type: 'inconsistency',
            severity: 'low',
            description: 'Inconsistency',
            examples: ['Example inconsistency'],
          },
        ],
        greenFlags: [],
        escalateToRiskEvaluator: true,
        summary: 'Multiple red flags detected',
        metadata: {
          analyzedAt: '2025-01-15T10:00:00Z',
          durationMs: 15000,
          model: 'openai/gpt-3.5-turbo',
          costUsd: 0.007,
        },
      }

      const report = generateStage1Report(safetyOutput)

      expect(report.insights.length).toBe(5)
      expect(report.insights[0].title).toContain('Threatening Behavior')
      expect(report.insights[1].title).toContain('Financial Requests')
      expect(report.insights[2].title).toContain('Manipulation Detected')
      expect(report.insights[3].title).toContain('Pressure or Coercion')
      expect(report.insights[4].title).toContain('Inconsistencies Detected')
    })

    it('should limit green flag insights to top 3', () => {
      const safetyOutput: SafetyScreenerOutput = {
        analyzer: 'safety-screener',
        riskLevel: 'green',
        redFlags: [],
        greenFlags: [
          'Green flag 1',
          'Green flag 2',
          'Green flag 3',
          'Green flag 4',
          'Green flag 5',
        ],
        escalateToRiskEvaluator: false,
        summary: 'Healthy conversations',
        metadata: {
          analyzedAt: '2025-01-15T10:00:00Z',
          durationMs: 12000,
          model: 'openai/gpt-3.5-turbo',
          costUsd: 0.006,
        },
      }

      const report = generateStage1Report(safetyOutput)

      expect(report.insights.length).toBe(3) // Only top 3 green flags
      expect(report.insights.every((i) => i.category === 'positive-patterns')).toBe(true)
    })

    it('should include examples in insights when available', () => {
      const safetyOutput: SafetyScreenerOutput = {
        analyzer: 'safety-screener',
        riskLevel: 'orange',
        redFlags: [
          {
            type: 'pressure',
            severity: 'medium',
            description: 'Pressure detected',
            examples: ['Example 1', 'Example 2', 'Example 3'],
          },
        ],
        greenFlags: [],
        escalateToRiskEvaluator: true,
        summary: 'Pressure patterns detected',
        metadata: {
          analyzedAt: '2025-01-15T10:00:00Z',
          durationMs: 14000,
          model: 'openai/gpt-3.5-turbo',
          costUsd: 0.007,
        },
      }

      const report = generateStage1Report(safetyOutput)

      expect(report.insights[0].examples).toEqual(['Example 1', 'Example 2', 'Example 3'])
    })
  })

  describe('formatStage1ReportAsMarkdown', () => {
    it('should format complete report as markdown', () => {
      const safetyOutput: SafetyScreenerOutput = {
        analyzer: 'safety-screener',
        riskLevel: 'green',
        redFlags: [],
        greenFlags: ['Healthy communication'],
        escalateToRiskEvaluator: false,
        summary: 'Healthy patterns detected',
        metadata: {
          analyzedAt: '2025-01-15T10:00:00Z',
          durationMs: 12000,
          model: 'openai/gpt-3.5-turbo',
          costUsd: 0.006,
        },
      }

      const report = generateStage1Report(safetyOutput)
      const markdown = formatStage1ReportAsMarkdown(report)

      expect(markdown).toContain('# Your conversations show healthy patterns')
      expect(markdown).toContain('**Summary:**')
      expect(markdown).toContain('## Key Insights')
      expect(markdown).toContain('## Recommendations')
      expect(markdown).toContain('## Your Analysis is Complete')
      expect(markdown).toContain('Stage 1: Quick Triage')
    })

    it('should include escalation section for orange/red reports', () => {
      const safetyOutput: SafetyScreenerOutput = {
        analyzer: 'safety-screener',
        riskLevel: 'orange',
        redFlags: [
          {
            type: 'pressure',
            severity: 'medium',
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
          costUsd: 0.007,
        },
      }

      const report = generateStage1Report(safetyOutput)
      const markdown = formatStage1ReportAsMarkdown(report)

      expect(markdown).toContain('## Next Steps')
      expect(markdown).toContain('**Additional Analysis Running**')
      expect(markdown).not.toContain('Your Analysis is Complete')
    })

    it('should include examples with bullet points', () => {
      const safetyOutput: SafetyScreenerOutput = {
        analyzer: 'safety-screener',
        riskLevel: 'orange',
        redFlags: [
          {
            type: 'explicit-manipulation',
            severity: 'medium',
            description: 'Manipulation detected',
            examples: ['Example 1', 'Example 2'],
          },
        ],
        greenFlags: [],
        escalateToRiskEvaluator: true,
        summary: 'Manipulation patterns',
        metadata: {
          analyzedAt: '2025-01-15T10:00:00Z',
          durationMs: 15000,
          model: 'openai/gpt-3.5-turbo',
          costUsd: 0.007,
        },
      }

      const report = generateStage1Report(safetyOutput)
      const markdown = formatStage1ReportAsMarkdown(report)

      expect(markdown).toContain('**Examples:**')
      expect(markdown).toContain('- Example 1')
      expect(markdown).toContain('- Example 2')
    })

    it('should include priority emojis for recommendations', () => {
      const safetyOutput: SafetyScreenerOutput = {
        analyzer: 'safety-screener',
        riskLevel: 'red',
        redFlags: [
          {
            type: 'threat',
            severity: 'high',
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
          costUsd: 0.008,
        },
      }

      const report = generateStage1Report(safetyOutput)
      const markdown = formatStage1ReportAsMarkdown(report)

      expect(markdown).toContain('🔴') // High priority
    })
  })

  describe('formatStage1ReportAsText', () => {
    it('should format report as plain text', () => {
      const safetyOutput: SafetyScreenerOutput = {
        analyzer: 'safety-screener',
        riskLevel: 'green',
        redFlags: [],
        greenFlags: ['Healthy communication'],
        escalateToRiskEvaluator: false,
        summary: 'Healthy patterns',
        metadata: {
          analyzedAt: '2025-01-15T10:00:00Z',
          durationMs: 12000,
          model: 'openai/gpt-3.5-turbo',
          costUsd: 0.006,
        },
      }

      const report = generateStage1Report(safetyOutput)
      const text = formatStage1ReportAsText(report)

      expect(text).toContain('YOUR CONVERSATIONS SHOW HEALTHY PATTERNS')
      expect(text).toContain('====') // Header underline
      expect(text).toContain('Summary:')
      expect(text).toContain('KEY INSIGHTS')
      expect(text).toContain('RECOMMENDATIONS')
      expect(text).toContain('YOUR ANALYSIS IS COMPLETE')
      expect(text).toContain('Stage 1: Quick Triage')
    })

    it('should include priority labels for recommendations', () => {
      const safetyOutput: SafetyScreenerOutput = {
        analyzer: 'safety-screener',
        riskLevel: 'red',
        redFlags: [
          {
            type: 'threat',
            severity: 'high',
            description: 'Threats',
            examples: ['Example'],
          },
        ],
        greenFlags: [],
        escalateToRiskEvaluator: true,
        summary: 'Serious concerns',
        metadata: {
          analyzedAt: '2025-01-15T10:00:00Z',
          durationMs: 18000,
          model: 'openai/gpt-3.5-turbo',
          costUsd: 0.008,
        },
      }

      const report = generateStage1Report(safetyOutput)
      const text = formatStage1ReportAsText(report)

      expect(text).toContain('[HIGH]')
    })

    it('should show escalation section for orange/red reports', () => {
      const safetyOutput: SafetyScreenerOutput = {
        analyzer: 'safety-screener',
        riskLevel: 'orange',
        redFlags: [
          {
            type: 'pressure',
            severity: 'medium',
            description: 'Pressure',
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
          costUsd: 0.007,
        },
      }

      const report = generateStage1Report(safetyOutput)
      const text = formatStage1ReportAsText(report)

      expect(text).toContain('NEXT STEPS')
      expect(text).toContain('Additional Analysis Running')
      expect(text).not.toContain('YOUR ANALYSIS IS COMPLETE')
    })
  })
})
