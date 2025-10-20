/**
 * Stage 2 Comprehensive Analyzer Types
 *
 * Types for the deep analysis that runs for orange/red risk cases.
 * Combines safety, attachment, and growth analysis in ONE API call.
 */

import type { AnalyzerInput, AnalyzerMetadata, SafetyScreenerOutput } from './types'

/**
 * Input for Stage 2 Comprehensive Analyzer
 * Includes Stage 1 results for context
 */
export interface Stage2Input extends AnalyzerInput {
  /** Stage 1 results for context */
  stage1Results: SafetyScreenerOutput
}

/**
 * Attachment style classification
 */
export type AttachmentStyle = 'secure' | 'anxious' | 'avoidant' | 'fearful-avoidant' | 'mixed'

/**
 * Safety deep dive analysis
 */
export interface SafetyDeepDive {
  /** Advanced manipulation tactics detected */
  manipulationTactics: Array<{
    type:
      | 'DARVO'
      | 'gaslighting'
      | 'love-bombing'
      | 'triangulation'
      | 'projection'
      | 'isolation'
      | 'financial-control'
      | 'emotional-blackmail'
    severity: 'low' | 'medium' | 'high'
    description: string
    examples: string[]
    pattern: string // How it manifests over time
  }>
  /** Coercive control patterns */
  coerciveControl: {
    detected: boolean
    patterns: string[]
    examples: string[]
    escalation: 'none' | 'gradual' | 'rapid'
  }
  /** Trauma bonding indicators */
  traumaBonding: {
    detected: boolean
    indicators: string[]
    cyclePhases: Array<{
      phase: 'tension-building' | 'incident' | 'reconciliation' | 'calm'
      description: string
      examples: string[]
    }>
  }
  /** Crisis intervention needed */
  crisisLevel: 'none' | 'low' | 'moderate' | 'high' | 'critical'
  /** Professional resources recommended */
  recommendedResources: Array<{
    type: 'therapist' | 'domestic-violence-advocate' | 'crisis-hotline' | 'legal-aid'
    priority: 'immediate' | 'high' | 'medium'
    rationale: string
  }>
}

/**
 * Attachment analysis
 */
export interface AttachmentAnalysis {
  /** Primary attachment style */
  primaryStyle: AttachmentStyle
  /** Confidence in assessment (0-1) */
  confidence: number
  /** Evidence for this style */
  evidence: string[]
  /** Triggers identified */
  triggers: Array<{
    trigger: string
    response: string
    healthiness: 'healthy' | 'neutral' | 'concerning'
    examples: string[]
  }>
  /** Coping mechanisms */
  copingMechanisms: Array<{
    mechanism: string
    effectiveness: 'helpful' | 'neutral' | 'harmful'
    frequency: 'rare' | 'occasional' | 'frequent' | 'constant'
    examples: string[]
  }>
  /** Relationship dynamics */
  relationshipDynamics: {
    patterns: string[]
    healthyAspects: string[]
    concerningAspects: string[]
    recommendations: string[]
  }
}

/**
 * Growth trajectory analysis
 */
export interface GrowthTrajectory {
  /** Growth detected over time */
  detected: boolean
  /** Time range analyzed */
  timeRangeMonths: number
  /** Overall direction */
  direction: 'improving' | 'declining' | 'stable' | 'fluctuating'
  /** Specific skills that improved */
  skillsImproved: Array<{
    skill: string
    improvement: 'significant' | 'moderate' | 'slight'
    evidence: string[]
  }>
  /** Areas for continued growth */
  growthOpportunities: Array<{
    area: string
    priority: 'high' | 'medium' | 'low'
    recommendations: string[]
  }>
  /** Key insights about personal development */
  developmentInsights: string[]
}

/**
 * Stage 2 Comprehensive Analyzer Output
 * All analysis combined in one coherent report
 */
export interface Stage2ComprehensiveOutput {
  analyzer: 'stage2-comprehensive'
  /** Safety deep dive */
  safetyDeepDive: SafetyDeepDive
  /** Attachment analysis */
  attachmentAnalysis: AttachmentAnalysis
  /** Growth trajectory (if applicable) */
  growthTrajectory: GrowthTrajectory | null
  /** Coherent narrative synthesis */
  synthesis: {
    /** Overall assessment summary */
    overallSummary: string
    /** Key themes across all analysis */
    keyThemes: string[]
    /** Most important insights (prioritized) */
    prioritizedInsights: Array<{
      insight: string
      category: 'safety' | 'attachment' | 'growth' | 'general'
      importance: 'critical' | 'high' | 'medium'
      actionable: boolean
    }>
    /** Evidence-based recommendations */
    recommendations: Array<{
      recommendation: string
      rationale: string
      priority: 'immediate' | 'high' | 'medium' | 'low'
      category: 'safety' | 'personal-growth' | 'relationship-patterns' | 'professional-support'
    }>
  }
  /** Processing metadata */
  metadata: AnalyzerMetadata
}
