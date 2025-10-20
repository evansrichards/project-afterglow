/**
 * Evaluator Types
 *
 * Core types for the conditional evaluators that only execute
 * when triggered by analyzer outputs in the Data Processor pipeline.
 */

import type { AnalyzerInput, SafetyScreenerOutput, PatternRecognizerOutput, ChronologyMapperOutput } from '../analyzers/types'

/**
 * Input data for evaluators includes analyzer results
 */
export interface EvaluatorInput extends AnalyzerInput {
  /** Results from Safety Screener Analyzer */
  safetyScreener: SafetyScreenerOutput
  /** Results from Pattern Recognizer Analyzer */
  patternRecognizer: PatternRecognizerOutput
  /** Results from Chronology Mapper Analyzer */
  chronologyMapper: ChronologyMapperOutput
}

/**
 * Base metadata tracked by all evaluators
 */
export interface EvaluatorMetadata {
  /** When the evaluation was performed */
  evaluatedAt: string
  /** How long the evaluation took (ms) */
  durationMs: number
  /** Model used for AI evaluation */
  model: string
  /** Tokens consumed */
  tokensUsed: {
    input: number
    output: number
  }
  /** Cost in USD */
  costUsd: number
  /** Why this evaluator was triggered */
  triggerReason: string
}

/**
 * Base output structure for all evaluators
 */
export interface BaseEvaluatorOutput {
  /** Evaluator name for identification */
  evaluator: string
  /** Processing metadata */
  metadata: EvaluatorMetadata
}

/**
 * Risk Evaluator output
 * Deep analysis of safety concerns and manipulation tactics
 */
export interface RiskEvaluatorOutput extends BaseEvaluatorOutput {
  evaluator: 'risk-evaluator'
  /** Advanced manipulation tactics detected */
  manipulationTactics: Array<{
    /** Type of manipulation */
    type: 'DARVO' | 'gaslighting' | 'love-bombing' | 'triangulation' | 'projection' | 'isolation' | 'financial-control'
    /** Severity level */
    severity: 'medium' | 'high' | 'critical'
    /** Detailed description */
    description: string
    /** Specific examples */
    examples: string[]
    /** Pattern over time */
    pattern: 'isolated' | 'occasional' | 'frequent' | 'consistent'
  }>
  /** Coercive control patterns */
  coerciveControl: {
    /** Is coercive control present? */
    detected: boolean
    /** Specific control tactics */
    tactics: string[]
    /** Severity assessment */
    severity: 'low' | 'medium' | 'high' | 'critical'
    /** Evidence */
    evidence: string[]
  }
  /** Trauma bonding indicators */
  traumaBonding: {
    /** Is trauma bonding present? */
    detected: boolean
    /** Specific indicators */
    indicators: string[]
    /** Cycle patterns (idealization → devaluation → discard) */
    cycleDetected: boolean
    /** Evidence */
    evidence: string[]
  }
  /** Should trigger Crisis Evaluator? */
  escalateToCrisisEvaluator: boolean
  /** Detailed safety analysis summary */
  summary: string
  /** Specific recommendations */
  recommendations: string[]
}

/**
 * Attachment Evaluator output
 * Sophisticated attachment style analysis
 */
export interface AttachmentEvaluatorOutput extends BaseEvaluatorOutput {
  evaluator: 'attachment-evaluator'
  /** Detailed attachment style determination */
  attachmentStyle: {
    /** Primary attachment style */
    primary: 'secure' | 'anxious-preoccupied' | 'dismissive-avoidant' | 'fearful-avoidant' | 'disorganized'
    /** Secondary style (if mixed) */
    secondary?: 'secure' | 'anxious-preoccupied' | 'dismissive-avoidant' | 'fearful-avoidant' | 'disorganized'
    /** Confidence in assessment (0-1) */
    confidence: number
    /** Explanation */
    explanation: string
  }
  /** Specific triggers and coping mechanisms */
  triggersAndCoping: {
    /** Identified triggers */
    triggers: string[]
    /** Coping mechanisms observed */
    copingMechanisms: string[]
    /** Healthy vs unhealthy coping ratio */
    copingQuality: 'mostly-healthy' | 'mixed' | 'mostly-unhealthy'
  }
  /** Relationship dynamic analysis */
  relationshipDynamics: {
    /** Pursue-withdraw patterns */
    pursueWithdraw: boolean
    /** Anxious-avoidant trap */
    anxiousAvoidantTrap: boolean
    /** Secure functioning elements */
    secureFunctioning: string[]
    /** Problematic patterns */
    problematicPatterns: string[]
  }
  /** Detailed attachment insights summary */
  summary: string
  /** Growth opportunities specific to attachment */
  growthOpportunities: string[]
}

/**
 * Growth Evaluator output
 * Detailed personal development analysis
 */
export interface GrowthEvaluatorOutput extends BaseEvaluatorOutput {
  evaluator: 'growth-evaluator'
  /** Detailed skill progression tracking */
  skillProgression: Array<{
    /** Skill area */
    skill: string
    /** Starting level */
    startingLevel: 'low' | 'medium' | 'high'
    /** Current level */
    currentLevel: 'low' | 'medium' | 'high'
    /** Direction of change */
    direction: 'improving' | 'stable' | 'declining'
    /** Evidence of progression */
    evidence: string[]
  }>
  /** Personal development opportunities */
  developmentOpportunities: Array<{
    /** Area for development */
    area: string
    /** Priority level */
    priority: 'high' | 'medium' | 'low'
    /** Current state */
    currentState: string
    /** Desired state */
    desiredState: string
    /** Specific actions */
    actions: string[]
  }>
  /** Customized growth recommendations */
  recommendations: Array<{
    /** Recommendation category */
    category: string
    /** Specific recommendation */
    recommendation: string
    /** Why this is recommended */
    rationale: string
    /** Resources or practices */
    resources: string[]
  }>
  /** Overall growth trajectory summary */
  summary: string
}

/**
 * Crisis Evaluator output
 * Crisis intervention and safety planning
 */
export interface CrisisEvaluatorOutput extends BaseEvaluatorOutput {
  evaluator: 'crisis-evaluator'
  /** Comprehensive threat assessment */
  threatAssessment: {
    /** Overall threat level */
    level: 'moderate' | 'high' | 'severe' | 'imminent'
    /** Specific threats identified */
    threats: string[]
    /** Escalation risk */
    escalationRisk: 'low' | 'medium' | 'high'
    /** Immediate safety concerns */
    immediateConcerns: string[]
  }
  /** Professional resources */
  professionalResources: Array<{
    /** Type of resource */
    type: 'hotline' | 'therapy' | 'legal' | 'shelter' | 'advocacy'
    /** Resource name */
    name: string
    /** Description */
    description: string
    /** Contact info (general, not personalized) */
    contact?: string
  }>
  /** Safety planning components */
  safetyPlanning: {
    /** Immediate safety steps */
    immediateSteps: string[]
    /** Support system considerations */
    supportSystem: string[]
    /** Documentation recommendations */
    documentation: string[]
    /** Exit planning (if relevant) */
    exitPlanning?: string[]
  }
  /** Crisis intervention summary */
  summary: string
  /** Urgent recommendations */
  urgentRecommendations: string[]
}

/**
 * Union type of all evaluator outputs
 */
export type EvaluatorOutput =
  | RiskEvaluatorOutput
  | AttachmentEvaluatorOutput
  | GrowthEvaluatorOutput
  | CrisisEvaluatorOutput

/**
 * Result of running triggered evaluators
 */
export interface EvaluatorResults {
  /** Risk evaluation (if triggered) */
  risk?: RiskEvaluatorOutput
  /** Attachment evaluation (if triggered) */
  attachment?: AttachmentEvaluatorOutput
  /** Growth evaluation (if triggered) */
  growth?: GrowthEvaluatorOutput
  /** Crisis evaluation (if triggered) */
  crisis?: CrisisEvaluatorOutput
  /** Overall processing metadata */
  processingMetadata: {
    /** Total time for all evaluators */
    totalDurationMs: number
    /** Total cost for all evaluators */
    totalCostUsd: number
    /** Which evaluators were triggered */
    triggeredEvaluators: string[]
  }
}
