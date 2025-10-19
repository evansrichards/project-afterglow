/**
 * Tests for AI-Powered Insight Generation
 */

import { describe, it, expect } from 'vitest'
import {
  generateAttachmentInsight,
  generateSafetyInsight,
  generateCommunicationInsight,
  generateGrowthInsights,
  generateAIInsights,
  generateInsightSummary,
  filterInsightsBySeverity,
  filterInsightsByCategory,
  sortInsightsByPriority,
} from './ai-insights'
import type {
  AttachmentAnalysis,
  RedFlagAnalysis,
  CommunicationStrength,
  GrowthOpportunity,
  ConversationAnalysis,
} from './conversation-analysis'
import type { Insight } from '../analytics/insight-generation'

describe('AI-Powered Insights', () => {
  describe('generateAttachmentInsight', () => {
    it('generates positive insight for secure attachment', () => {
      const analysis: AttachmentAnalysis = {
        primaryStyle: 'secure',
        confidence: 0.85,
        evidence: ['Balanced communication', 'Emotional openness'],
        explanation: 'Shows secure attachment patterns',
        patterns: {
          reassuranceSeeking: false,
          emotionalOpenness: true,
          intimacyComfort: true,
          abandonmentFears: false,
          independenceBalance: 'healthy',
        },
      }

      const insight = generateAttachmentInsight(analysis, 'conv1')

      expect(insight.id).toBe('attachment-conv1')
      expect(insight.category).toBe('pattern')
      expect(insight.severity).toBe('positive')
      expect(insight.title).toContain('Secure Attachment')
      expect(insight.summary).toContain('85%')
      expect(insight.summary).toContain('secure attachment')
      expect(insight.reflection).toBeTruthy()
    })

    it('generates neutral insight for anxious attachment', () => {
      const analysis: AttachmentAnalysis = {
        primaryStyle: 'anxious',
        confidence: 0.75,
        evidence: ['Frequent reassurance seeking'],
        explanation: 'Shows anxious patterns',
        patterns: {
          reassuranceSeeking: true,
          emotionalOpenness: true,
          intimacyComfort: false,
          abandonmentFears: true,
          independenceBalance: 'too-dependent',
        },
      }

      const insight = generateAttachmentInsight(analysis, 'conv1')

      expect(insight.severity).toBe('neutral')
      expect(insight.title).toContain('Anxious')
      expect(insight.summary).toContain('anxious attachment')
      expect(insight.summary).toContain('75%')
      expect(insight.metrics?.attachmentStyle).toBe('anxious')
    })

    it('generates concern for disorganized attachment', () => {
      const analysis: AttachmentAnalysis = {
        primaryStyle: 'disorganized',
        confidence: 0.65,
        evidence: ['Mixed signals'],
        explanation: 'Inconsistent patterns',
        patterns: {
          reassuranceSeeking: true,
          emotionalOpenness: false,
          intimacyComfort: false,
          abandonmentFears: true,
          independenceBalance: 'too-dependent',
        },
      }

      const insight = generateAttachmentInsight(analysis, 'conv1')

      expect(insight.severity).toBe('concern')
      expect(insight.title).toContain('Mixed')
      expect(insight.reflection).toContain('therapist')
    })

    it('includes relevant metrics', () => {
      const analysis: AttachmentAnalysis = {
        primaryStyle: 'avoidant',
        confidence: 0.7,
        evidence: [],
        explanation: '',
        patterns: {
          reassuranceSeeking: false,
          emotionalOpenness: false,
          intimacyComfort: false,
          abandonmentFears: false,
          independenceBalance: 'too-independent',
        },
      }

      const insight = generateAttachmentInsight(analysis, 'conv1')

      expect(insight.metrics?.attachmentStyle).toBe('avoidant')
      expect(insight.metrics?.confidence).toBe(70)
      expect(insight.metrics?.reassuranceSeeking).toBe('No')
      expect(insight.metrics?.emotionalOpenness).toBe('Low')
    })
  })

  describe('generateSafetyInsight', () => {
    it('generates positive insight for safe conversations', () => {
      const analysis: RedFlagAnalysis = {
        flagsDetected: false,
        overallSafety: 'safe',
        flags: [],
        positiveIndicators: ['Respectful communication', 'Healthy boundaries'],
        summary: 'No concerns detected',
      }

      const insight = generateSafetyInsight(analysis, 'conv1')

      expect(insight.id).toBe('safety-conv1')
      expect(insight.severity).toBe('positive')
      expect(insight.title).toContain('Healthy')
      expect(insight.summary).toContain('No major red flags')
      expect(insight.summary).toContain('Respectful')
    })

    it('generates concern for critical red flags', () => {
      const analysis: RedFlagAnalysis = {
        flagsDetected: true,
        overallSafety: 'unsafe',
        flags: [
          {
            category: 'emotional-abuse',
            severity: 'critical',
            description: 'Threatening behavior detected',
            examples: ['Example 1'],
            recommendation: 'Consider ending this relationship',
          },
        ],
        positiveIndicators: [],
        summary: 'Critical safety concerns',
      }

      const insight = generateSafetyInsight(analysis, 'conv1')

      expect(insight.severity).toBe('concern')
      expect(insight.title).toContain('Serious')
      expect(insight.summary).toContain('⚠️')
      expect(insight.summary).toContain('critical')
      expect(insight.reflection).toContain('safety')
    })

    it('generates neutral for minor concerns', () => {
      const analysis: RedFlagAnalysis = {
        flagsDetected: true,
        overallSafety: 'cautious',
        flags: [
          {
            category: 'inconsistency',
            severity: 'low',
            description: 'Minor inconsistency in stories',
            examples: [],
            recommendation: 'Monitor this pattern',
          },
        ],
        positiveIndicators: ['Good listening'],
        summary: 'Minor concerns',
      }

      const insight = generateSafetyInsight(analysis, 'conv1')

      expect(insight.severity).toBe('neutral')
      expect(insight.title).toContain('Minor Concerns')
    })

    it('includes safety metrics', () => {
      const analysis: RedFlagAnalysis = {
        flagsDetected: true,
        overallSafety: 'concerning',
        flags: [
          {
            category: 'manipulation',
            severity: 'high',
            description: 'Manipulation detected',
            examples: [],
            recommendation: 'Be cautious',
          },
          {
            category: 'control',
            severity: 'medium',
            description: 'Controlling behavior',
            examples: [],
            recommendation: 'Set boundaries',
          },
        ],
        positiveIndicators: [],
        summary: 'Concerning patterns',
      }

      const insight = generateSafetyInsight(analysis, 'conv1')

      expect(insight.metrics?.overallSafety).toBe('concerning')
      expect(insight.metrics?.flagsDetected).toBe(2)
      expect(insight.metrics?.criticalFlags).toBe(0)
    })
  })

  describe('generateCommunicationInsight', () => {
    it('generates positive insight for high scores', () => {
      const analysis: CommunicationStrength = {
        overallScore: 85,
        dimensions: {
          clarity: 90,
          emotionalIntelligence: 80,
          activeListening: 85,
          authenticity: 88,
          respect: 92,
          vulnerability: 75,
        },
        strengths: ['Clear communication', 'Good listening'],
        areasForGrowth: ['More emotional openness'],
        patterns: {
          usesIStatements: true,
          asksQuestions: true,
          sharesFeelings: true,
          acknowledgesOther: true,
          setsBoundaries: true,
        },
      }

      const insight = generateCommunicationInsight(analysis, 'conv1')

      expect(insight.id).toBe('communication-conv1')
      expect(insight.severity).toBe('positive')
      expect(insight.title).toContain('Excellent')
      expect(insight.summary).toContain('85/100')
      expect(insight.metrics?.overallScore).toBe(85)
    })

    it('generates concern for low scores', () => {
      const analysis: CommunicationStrength = {
        overallScore: 45,
        dimensions: {
          clarity: 50,
          emotionalIntelligence: 40,
          activeListening: 45,
          authenticity: 55,
          respect: 60,
          vulnerability: 20,
        },
        strengths: [],
        areasForGrowth: ['Emotional expression', 'Active listening'],
        patterns: {
          usesIStatements: false,
          asksQuestions: false,
          sharesFeelings: false,
          acknowledgesOther: false,
          setsBoundaries: false,
        },
      }

      const insight = generateCommunicationInsight(analysis, 'conv1')

      expect(insight.severity).toBe('concern')
      expect(insight.title).toContain('Needs Attention')
      expect(insight.summary).toContain('45/100')
    })

    it('identifies strongest and weakest areas', () => {
      const analysis: CommunicationStrength = {
        overallScore: 70,
        dimensions: {
          clarity: 80,
          emotionalIntelligence: 65,
          activeListening: 70,
          authenticity: 75,
          respect: 90,
          vulnerability: 40,
        },
        strengths: ['Respectful'],
        areasForGrowth: ['Vulnerability'],
        patterns: {
          usesIStatements: true,
          asksQuestions: true,
          sharesFeelings: false,
          acknowledgesOther: true,
          setsBoundaries: true,
        },
      }

      const insight = generateCommunicationInsight(analysis, 'conv1')

      expect(insight.summary).toContain('respect')
      expect(insight.metrics?.strongest).toContain('respect')
      expect(insight.metrics?.weakest).toContain('vulnerability')
    })
  })

  describe('generateGrowthInsights', () => {
    it('generates insights from growth opportunities', () => {
      const opportunities: GrowthOpportunity[] = [
        {
          area: 'Emotional Vulnerability',
          priority: 'high',
          currentState: 'Guarded with feelings',
          desiredState: 'Open emotional expression',
          suggestions: ['Share feelings daily', 'Use I feel statements', 'Practice vulnerability'],
          resources: ['Brené Brown', 'Emotion wheel'],
          context: 'Limited emotional sharing observed',
        },
        {
          area: 'Boundary Setting',
          priority: 'medium',
          currentState: 'Unclear boundaries',
          desiredState: 'Clear, confident boundaries',
          suggestions: ['Practice saying no', 'Identify limits'],
          resources: ['Boundary work'],
          context: 'Difficulty with limits',
        },
      ]

      const insights = generateGrowthInsights(opportunities, 'conv1')

      expect(insights).toHaveLength(2)
      expect(insights[0].id).toBe('growth-conv1-0')
      expect(insights[0].title).toContain('Emotional Vulnerability')
      expect(insights[0].severity).toBe('neutral')
      expect(insights[0].summary).toContain('Guarded')
      expect(insights[0].summary).toContain('Share feelings')
    })

    it('limits to top 3 opportunities', () => {
      const opportunities: GrowthOpportunity[] = [
        {
          area: 'Area 1',
          priority: 'high',
          currentState: 'Current',
          desiredState: 'Desired',
          suggestions: ['Do this'],
          resources: [],
          context: 'Context',
        },
        {
          area: 'Area 2',
          priority: 'high',
          currentState: 'Current',
          desiredState: 'Desired',
          suggestions: ['Do this'],
          resources: [],
          context: 'Context',
        },
        {
          area: 'Area 3',
          priority: 'medium',
          currentState: 'Current',
          desiredState: 'Desired',
          suggestions: ['Do this'],
          resources: [],
          context: 'Context',
        },
        {
          area: 'Area 4',
          priority: 'medium',
          currentState: 'Current',
          desiredState: 'Desired',
          suggestions: ['Do this'],
          resources: [],
          context: 'Context',
        },
      ]

      const insights = generateGrowthInsights(opportunities, 'conv1')

      expect(insights.length).toBeLessThanOrEqual(3)
    })

    it('filters out low priority opportunities', () => {
      const opportunities: GrowthOpportunity[] = [
        {
          area: 'High Priority',
          priority: 'high',
          currentState: 'Current',
          desiredState: 'Desired',
          suggestions: ['Do this'],
          resources: [],
          context: 'Context',
        },
        {
          area: 'Low Priority',
          priority: 'low',
          currentState: 'Current',
          desiredState: 'Desired',
          suggestions: ['Do this'],
          resources: [],
          context: 'Context',
        },
      ]

      const insights = generateGrowthInsights(opportunities, 'conv1')

      expect(insights).toHaveLength(1)
      expect(insights[0].title).toContain('High Priority')
    })
  })

  describe('generateAIInsights', () => {
    it('generates comprehensive insights from analysis', () => {
      const analysis: ConversationAnalysis = {
        conversationId: 'conv1',
        analyzedAt: '2024-01-01T12:00:00Z',
        attachment: {
          primaryStyle: 'secure',
          confidence: 0.8,
          evidence: [],
          explanation: 'Secure patterns',
          patterns: {
            reassuranceSeeking: false,
            emotionalOpenness: true,
            intimacyComfort: true,
            abandonmentFears: false,
            independenceBalance: 'healthy',
          },
        },
        redFlags: {
          flagsDetected: false,
          overallSafety: 'safe',
          flags: [],
          positiveIndicators: ['Respectful'],
          summary: 'Safe',
        },
        communication: {
          overallScore: 80,
          dimensions: {
            clarity: 80,
            emotionalIntelligence: 75,
            activeListening: 85,
            authenticity: 80,
            respect: 90,
            vulnerability: 70,
          },
          strengths: ['Clear'],
          areasForGrowth: [],
          patterns: {
            usesIStatements: true,
            asksQuestions: true,
            sharesFeelings: true,
            acknowledgesOther: true,
            setsBoundaries: true,
          },
        },
        growthOpportunities: [
          {
            area: 'Emotional Expression',
            priority: 'high',
            currentState: 'Good',
            desiredState: 'Great',
            suggestions: ['Practice'],
            resources: [],
            context: 'Context',
          },
        ],
        summary: 'Overall positive analysis',
        cost: {
          totalCost: 0.46,
          breakdown: {},
        },
      }

      const insights = generateAIInsights(analysis)

      // Should have: overview + attachment + safety + communication + 1 growth
      expect(insights.length).toBeGreaterThanOrEqual(5)

      // Check overview is first
      expect(insights[0].id).toBe('overview-conv1')
      expect(insights[0].category).toBe('overview')

      // Check other insights exist
      const attachmentInsight = insights.find((i) => i.id === 'attachment-conv1')
      const safetyInsight = insights.find((i) => i.id === 'safety-conv1')
      const commInsight = insights.find((i) => i.id === 'communication-conv1')

      expect(attachmentInsight).toBeDefined()
      expect(safetyInsight).toBeDefined()
      expect(commInsight).toBeDefined()
    })
  })

  describe('generateInsightSummary', () => {
    it('summarizes insights correctly', () => {
      const insights: Insight[] = [
        {
          id: '1',
          category: 'pattern',
          severity: 'positive',
          title: 'Good',
          summary: 'Summary',
        },
        {
          id: '2',
          category: 'pattern',
          severity: 'concern',
          title: 'Concerning',
          summary: 'Summary',
        },
        {
          id: '3',
          category: 'balance',
          severity: 'neutral',
          title: 'Neutral',
          summary: 'Summary',
        },
      ]

      const summary = generateInsightSummary(insights)

      expect(summary.totalInsights).toBe(3)
      expect(summary.concerns).toBe(1)
      expect(summary.positives).toBe(1)
      expect(summary.topPriority?.id).toBe('2')
      expect(summary.categories.pattern).toBe(2)
      expect(summary.categories.balance).toBe(1)
    })
  })

  describe('filterInsightsBySeverity', () => {
    it('filters insights by severity', () => {
      const insights: Insight[] = [
        { id: '1', category: 'pattern', severity: 'positive', title: '', summary: '' },
        { id: '2', category: 'pattern', severity: 'concern', title: '', summary: '' },
        { id: '3', category: 'pattern', severity: 'positive', title: '', summary: '' },
      ]

      const positives = filterInsightsBySeverity(insights, 'positive')
      const concerns = filterInsightsBySeverity(insights, 'concern')

      expect(positives).toHaveLength(2)
      expect(concerns).toHaveLength(1)
    })
  })

  describe('filterInsightsByCategory', () => {
    it('filters insights by category', () => {
      const insights: Insight[] = [
        { id: '1', category: 'pattern', severity: 'positive', title: '', summary: '' },
        { id: '2', category: 'balance', severity: 'neutral', title: '', summary: '' },
        { id: '3', category: 'pattern', severity: 'concern', title: '', summary: '' },
      ]

      const patterns = filterInsightsByCategory(insights, 'pattern')
      const balance = filterInsightsByCategory(insights, 'balance')

      expect(patterns).toHaveLength(2)
      expect(balance).toHaveLength(1)
    })
  })

  describe('sortInsightsByPriority', () => {
    it('sorts concerns first, then neutral, then positive', () => {
      const insights: Insight[] = [
        { id: '1', category: 'pattern', severity: 'positive', title: '', summary: '' },
        { id: '2', category: 'pattern', severity: 'concern', title: '', summary: '' },
        { id: '3', category: 'pattern', severity: 'neutral', title: '', summary: '' },
        { id: '4', category: 'pattern', severity: 'positive', title: '', summary: '' },
      ]

      const sorted = sortInsightsByPriority(insights)

      expect(sorted[0].severity).toBe('concern')
      expect(sorted[1].severity).toBe('neutral')
      expect(sorted[2].severity).toBe('positive')
      expect(sorted[3].severity).toBe('positive')
    })
  })
})
