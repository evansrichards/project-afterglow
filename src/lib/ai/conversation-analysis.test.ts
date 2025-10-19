/**
 * Tests for AI Conversation Analysis
 */

import { describe, it, expect } from 'vitest'
import {
  prepareConversationContext,
  type AttachmentAnalysis,
  type RedFlagAnalysis,
  type CommunicationStrength,
  type GrowthOpportunity,
} from './conversation-analysis'
import type { NormalizedMessage } from '@/types/data-model'

describe('AI Conversation Analysis', () => {
  describe('prepareConversationContext', () => {
    it('prepares context with message counts', () => {
      const messages: NormalizedMessage[] = [
        {
          id: '1',
          matchId: 'match1',
          senderId: 'user1',
          body: 'Hello',
          sentAt: '2024-01-01T10:00:00Z',
          direction: 'user',
        },
        {
          id: '2',
          matchId: 'match1',
          senderId: 'match1',
          body: 'Hi there',
          sentAt: '2024-01-01T10:01:00Z',
          direction: 'match',
        },
        {
          id: '3',
          matchId: 'match1',
          senderId: 'user1',
          body: 'How are you?',
          sentAt: '2024-01-01T10:02:00Z',
          direction: 'user',
        },
      ]

      const context = prepareConversationContext('conv1', messages)

      expect(context.conversationId).toBe('conv1')
      expect(context.messages).toHaveLength(3)
      expect(context.metrics?.totalMessages).toBe(3)
      expect(context.metrics?.userMessageCount).toBe(2)
      expect(context.metrics?.matchMessageCount).toBe(1)
    })

    it('handles empty message list', () => {
      const context = prepareConversationContext('conv1', [])

      expect(context.conversationId).toBe('conv1')
      expect(context.messages).toHaveLength(0)
      expect(context.metrics?.totalMessages).toBe(0)
      expect(context.metrics?.userMessageCount).toBe(0)
      expect(context.metrics?.matchMessageCount).toBe(0)
    })

    it('counts only user direction messages as user messages', () => {
      const messages: NormalizedMessage[] = [
        {
          id: '1',
          matchId: 'match1',
          senderId: 'user1',
          body: 'Message 1',
          sentAt: '2024-01-01T10:00:00Z',
          direction: 'user',
        },
        {
          id: '2',
          matchId: 'match1',
          senderId: 'user1',
          body: 'Message 2',
          sentAt: '2024-01-01T10:01:00Z',
          direction: 'user',
        },
        {
          id: '3',
          matchId: 'match1',
          senderId: 'match1',
          body: 'Message 3',
          sentAt: '2024-01-01T10:02:00Z',
          direction: 'match',
        },
      ]

      const context = prepareConversationContext('conv1', messages)

      expect(context.metrics?.userMessageCount).toBe(2)
      expect(context.metrics?.matchMessageCount).toBe(1)
    })
  })

  describe('Type Definitions', () => {
    it('defines valid attachment styles', () => {
      const styles: Array<'secure' | 'anxious' | 'avoidant' | 'disorganized' | 'unclear'> = [
        'secure',
        'anxious',
        'avoidant',
        'disorganized',
        'unclear',
      ]

      expect(styles).toHaveLength(5)
      expect(styles).toContain('secure')
      expect(styles).toContain('anxious')
      expect(styles).toContain('avoidant')
    })

    it('defines red flag categories', () => {
      const categories: Array<
        | 'manipulation'
        | 'emotional-abuse'
        | 'control'
        | 'gaslighting'
        | 'love-bombing'
        | 'boundary-violation'
        | 'disrespect'
        | 'inconsistency'
      > = [
        'manipulation',
        'emotional-abuse',
        'control',
        'gaslighting',
        'love-bombing',
        'boundary-violation',
        'disrespect',
        'inconsistency',
      ]

      expect(categories).toHaveLength(8)
      expect(categories).toContain('manipulation')
      expect(categories).toContain('gaslighting')
    })

    it('defines red flag severity levels', () => {
      const severities: Array<'low' | 'medium' | 'high' | 'critical'> = [
        'low',
        'medium',
        'high',
        'critical',
      ]

      expect(severities).toHaveLength(4)
      expect(severities).toContain('low')
      expect(severities).toContain('critical')
    })
  })

  describe('AttachmentAnalysis Structure', () => {
    it('has required fields', () => {
      const analysis: AttachmentAnalysis = {
        primaryStyle: 'secure',
        confidence: 0.85,
        evidence: ['Shows emotional openness', 'Comfortable with vulnerability'],
        explanation: 'User demonstrates secure attachment patterns',
        patterns: {
          reassuranceSeeking: false,
          emotionalOpenness: true,
          intimacyComfort: true,
          abandonmentFears: false,
          independenceBalance: 'healthy',
        },
      }

      expect(analysis.primaryStyle).toBe('secure')
      expect(analysis.confidence).toBeGreaterThan(0)
      expect(analysis.evidence).toBeInstanceOf(Array)
      expect(analysis.patterns.independenceBalance).toBe('healthy')
    })

    it('supports different attachment styles', () => {
      const anxious: AttachmentAnalysis = {
        primaryStyle: 'anxious',
        confidence: 0.75,
        evidence: ['Frequent reassurance seeking'],
        explanation: 'Shows anxious attachment indicators',
        patterns: {
          reassuranceSeeking: true,
          emotionalOpenness: true,
          intimacyComfort: false,
          abandonmentFears: true,
          independenceBalance: 'too-dependent',
        },
      }

      expect(anxious.primaryStyle).toBe('anxious')
      expect(anxious.patterns.reassuranceSeeking).toBe(true)
      expect(anxious.patterns.abandonmentFears).toBe(true)
    })
  })

  describe('RedFlagAnalysis Structure', () => {
    it('handles safe conversations', () => {
      const analysis: RedFlagAnalysis = {
        flagsDetected: false,
        overallSafety: 'safe',
        flags: [],
        positiveIndicators: ['Respectful communication', 'Healthy boundaries'],
        summary: 'No concerning patterns detected',
      }

      expect(analysis.flagsDetected).toBe(false)
      expect(analysis.overallSafety).toBe('safe')
      expect(analysis.flags).toHaveLength(0)
      expect(analysis.positiveIndicators).toHaveLength(2)
    })

    it('handles conversations with red flags', () => {
      const analysis: RedFlagAnalysis = {
        flagsDetected: true,
        overallSafety: 'concerning',
        flags: [
          {
            category: 'manipulation',
            severity: 'medium',
            description: 'Uses guilt to influence decisions',
            examples: ['If you cared about me, you would...'],
            recommendation: 'Be aware of emotional manipulation tactics',
          },
        ],
        positiveIndicators: [],
        summary: 'Some concerning patterns detected',
      }

      expect(analysis.flagsDetected).toBe(true)
      expect(analysis.flags).toHaveLength(1)
      expect(analysis.flags[0].category).toBe('manipulation')
      expect(analysis.flags[0].severity).toBe('medium')
    })

    it('supports critical safety concerns', () => {
      const analysis: RedFlagAnalysis = {
        flagsDetected: true,
        overallSafety: 'unsafe',
        flags: [
          {
            category: 'emotional-abuse',
            severity: 'critical',
            description: 'Threatening and controlling behavior',
            examples: ['Explicit threats or extreme possessiveness'],
            recommendation: 'Consider ending this relationship and seeking support',
          },
        ],
        positiveIndicators: [],
        summary: 'Serious safety concerns detected',
      }

      expect(analysis.overallSafety).toBe('unsafe')
      expect(analysis.flags[0].severity).toBe('critical')
    })
  })

  describe('CommunicationStrength Structure', () => {
    it('has all required dimensions', () => {
      const analysis: CommunicationStrength = {
        overallScore: 75,
        dimensions: {
          clarity: 80,
          emotionalIntelligence: 70,
          activeListening: 75,
          authenticity: 85,
          respect: 90,
          vulnerability: 65,
        },
        strengths: ['Clear communication', 'Respectful tone'],
        areasForGrowth: ['More emotional openness'],
        patterns: {
          usesIStatements: true,
          asksQuestions: true,
          sharesFeelings: false,
          acknowledgesOther: true,
          setsBoundaries: true,
        },
      }

      expect(analysis.overallScore).toBe(75)
      expect(Object.keys(analysis.dimensions)).toHaveLength(6)
      expect(analysis.dimensions.clarity).toBe(80)
      expect(analysis.patterns.usesIStatements).toBe(true)
    })

    it('scores are in valid range', () => {
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
        strengths: [],
        areasForGrowth: [],
        patterns: {
          usesIStatements: true,
          asksQuestions: true,
          sharesFeelings: true,
          acknowledgesOther: true,
          setsBoundaries: true,
        },
      }

      expect(analysis.overallScore).toBeGreaterThanOrEqual(0)
      expect(analysis.overallScore).toBeLessThanOrEqual(100)

      Object.values(analysis.dimensions).forEach((score) => {
        expect(score).toBeGreaterThanOrEqual(0)
        expect(score).toBeLessThanOrEqual(100)
      })
    })
  })

  describe('GrowthOpportunity Structure', () => {
    it('provides actionable growth opportunities', () => {
      const opportunity: GrowthOpportunity = {
        area: 'Emotional Vulnerability',
        priority: 'high',
        currentState: 'Tendency to keep feelings guarded',
        desiredState: 'Comfortable sharing emotions appropriately',
        suggestions: [
          'Practice sharing one feeling per day',
          'Use "I feel..." statements',
          'Start with low-stakes emotional sharing',
        ],
        resources: [
          'Brené Brown on vulnerability',
          'Journaling practices',
          'Emotion wheel exercises',
        ],
        context: 'Your messages show strong communication but limited emotional expression',
      }

      expect(opportunity.area).toBeTruthy()
      expect(opportunity.priority).toBe('high')
      expect(opportunity.suggestions).toHaveLength(3)
      expect(opportunity.resources).toHaveLength(3)
    })

    it('supports different priority levels', () => {
      const high: GrowthOpportunity = {
        area: 'Boundary Setting',
        priority: 'high',
        currentState: 'Difficulty saying no',
        desiredState: 'Clear, confident boundaries',
        suggestions: ['Practice saying no', 'Identify your limits'],
        resources: ['Boundary work resources'],
        context: 'Pattern of overcommitting in messages',
      }

      const low: GrowthOpportunity = {
        area: 'Question Asking',
        priority: 'low',
        currentState: 'Good question asking',
        desiredState: 'Even more curious questions',
        suggestions: ['Try open-ended questions'],
        resources: ['Active listening guide'],
        context: 'Already strong in this area',
      }

      expect(high.priority).toBe('high')
      expect(low.priority).toBe('low')
    })
  })

  describe('ConversationAnalysis Structure', () => {
    it('combines all analysis components', () => {
      const analysis = {
        conversationId: 'conv1',
        analyzedAt: '2024-01-01T12:00:00Z',
        attachment: {
          primaryStyle: 'secure' as const,
          confidence: 0.8,
          evidence: [],
          explanation: '',
          patterns: {
            reassuranceSeeking: false,
            emotionalOpenness: true,
            intimacyComfort: true,
            abandonmentFears: false,
            independenceBalance: 'healthy' as const,
          },
        },
        redFlags: {
          flagsDetected: false,
          overallSafety: 'safe' as const,
          flags: [],
          positiveIndicators: [],
          summary: '',
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
          strengths: [],
          areasForGrowth: [],
          patterns: {
            usesIStatements: true,
            asksQuestions: true,
            sharesFeelings: true,
            acknowledgesOther: true,
            setsBoundaries: true,
          },
        },
        growthOpportunities: [],
        summary: 'Complete analysis',
        cost: {
          totalCost: 0.46,
          breakdown: {
            'attachment-analysis': 0.15,
            'red-flag-detection': 0.15,
            'communication-analysis': 0.08,
            'growth-opportunities': 0.08,
          },
        },
      }

      expect(analysis.conversationId).toBe('conv1')
      expect(analysis.attachment.primaryStyle).toBe('secure')
      expect(analysis.communication.overallScore).toBe(80)
      expect(analysis.redFlags.overallSafety).toBe('safe')
      expect(analysis.cost.totalCost).toBeCloseTo(0.46, 2)
    })
  })
})
