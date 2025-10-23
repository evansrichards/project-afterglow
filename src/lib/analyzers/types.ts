/**
 * Analyzer Types
 *
 * Core types for the foundation analyzers that always execute
 * in the Data Processor pipeline.
 */

import type { NormalizedMessage, MatchContext, ParticipantProfile } from '@/types/data-model'

/**
 * Risk level for safety assessment
 * Used by Safety Screener to determine if Risk Evaluator should trigger
 */
export type RiskLevel = 'green' | 'yellow' | 'orange' | 'red'

/**
 * Input data for all analyzers
 * Contains the complete normalized dataset
 */
export interface AnalyzerInput {
  /** All messages across all conversations */
  messages: NormalizedMessage[]
  /** All match contexts */
  matches: MatchContext[]
  /** All participant profiles */
  participants: ParticipantProfile[]
  /** User's participant ID */
  userId: string
}

/**
 * Base metadata tracked by all analyzers
 */
export interface AnalyzerMetadata {
  /** When the analysis was performed */
  analyzedAt: string
  /** How long the analysis took (ms) */
  durationMs: number
  /** Model used for AI analysis (if applicable) */
  model?: string
  /** Number of conversations analyzed (if applicable) */
  conversationsAnalyzed?: number
  /** Number of messages analyzed (if applicable) */
  messagesAnalyzed?: number
  /** Tokens consumed (if applicable) */
  tokensUsed?: {
    input: number
    output: number
  }
  /** Cost in USD (if applicable) */
  costUsd?: number
}

/**
 * Base output structure for all analyzers
 */
export interface BaseAnalyzerOutput {
  /** Analyzer name for identification */
  analyzer: string
  /** Processing metadata */
  metadata: AnalyzerMetadata
}

/**
 * Safety Screener Analyzer output
 * Provides basic safety assessment to determine if Risk Evaluator should run
 */
export interface SafetyScreenerOutput extends BaseAnalyzerOutput {
  analyzer: 'safety-screener'
  /** Overall risk level */
  riskLevel: RiskLevel
  /** Basic red flags detected */
  redFlags: Array<{
    /** Type of red flag */
    type: 'threat' | 'financial-request' | 'explicit-manipulation' | 'pressure' | 'inconsistency'
    /** Severity of this flag */
    severity: 'low' | 'medium' | 'high'
    /** Description of the concern */
    description: string
    /** Example messages (sanitized) */
    examples: string[]
  }>
  /** Positive safety indicators */
  greenFlags: string[]
  /** Should trigger Risk Evaluator? */
  escalateToRiskEvaluator: boolean
  /** Brief safety summary */
  summary: string
}

/**
 * Pattern Recognizer Analyzer output
 * Identifies core behavioral and communication patterns
 */
export interface PatternRecognizerOutput extends BaseAnalyzerOutput {
  analyzer: 'pattern-recognizer'
  /** Communication style patterns */
  communicationStyle: {
    /** Overall consistency in communication */
    consistency: 'very-consistent' | 'mostly-consistent' | 'mixed' | 'inconsistent'
    /** Emotional expressiveness level */
    emotionalExpressiveness: 'high' | 'medium' | 'low'
    /** Conversation initiation patterns */
    initiationPattern: 'proactive' | 'responsive' | 'balanced'
  }
  /** Attachment behavioral markers */
  attachmentMarkers: {
    /** Signs of anxiety in attachment */
    anxietyMarkers: string[]
    /** Signs of avoidance in attachment */
    avoidanceMarkers: string[]
    /** Signs of secure attachment */
    secureMarkers: string[]
  }
  /** Authenticity and vulnerability patterns */
  authenticity: {
    /** Overall authenticity score (0-1) */
    score: number
    /** Vulnerability indicators */
    vulnerabilityShown: boolean
    /** Genuine interest indicators */
    genuineInterest: boolean
  }
  /** Boundary setting and respect */
  boundaries: {
    /** User sets clear boundaries */
    userSetsBoundaries: boolean
    /** User respects others' boundaries */
    userRespectsBoundaries: boolean
    /** Examples of boundary setting/respecting */
    examples: string[]
  }
  /** Complexity score for triggering Attachment Evaluator */
  complexityScore: number
  /** Should trigger Attachment Evaluator? */
  escalateToAttachmentEvaluator: boolean
  /** Brief pattern summary */
  summary: string
}

/**
 * Chronology Mapper Analyzer output
 * Analyzes evolution of patterns over time
 */
export interface ChronologyMapperOutput extends BaseAnalyzerOutput {
  analyzer: 'chronology-mapper'
  /** Time range of data analyzed */
  timeRange: {
    /** ISO timestamp of earliest message */
    earliest: string
    /** ISO timestamp of latest message */
    latest: string
    /** Total duration in months */
    durationMonths: number
  }
  /** Time-segmented analysis */
  segments: Array<{
    /** Segment label (e.g., "Last 6 months") */
    label: string
    /** ISO timestamp range */
    startDate: string
    endDate: string
    /** Weight applied to this segment (recent = higher) */
    weight: number
    /** Key patterns in this segment */
    patterns: string[]
  }>
  /** Growth trajectory detection */
  growth: {
    /** Growth detected? */
    detected: boolean
    /** Direction of change */
    direction?: 'improving' | 'declining' | 'stable'
    /** Specific areas of growth */
    areas: string[]
    /** Evidence of growth */
    evidence: string[]
  }
  /** Life stage context */
  lifeStageContext: {
    /** Detected life transitions */
    transitions: string[]
    /** Major life events mentioned */
    events: string[]
  }
  /** Should trigger Growth Evaluator? */
  escalateToGrowthEvaluator: boolean
  /** Brief chronology summary */
  summary: string
}

/**
 * Metadata Analysis Result
 * Basic statistics about the user's dating activity
 * Calculated BEFORE AI analysis begins
 */
export interface MetadataAnalysisResult {
  /** Volume metrics */
  volume: {
    /** Total number of matches */
    totalMatches: number
    /** Total number of messages sent and received */
    totalMessages: number
    /** Number of conversations with 5+ messages */
    activeConversations: number
    /** Average messages per conversation */
    averageMessagesPerConversation: number
    /** Messages sent by user */
    messagesSentByUser: number
    /** Messages received from matches */
    messagesReceived: number
  }
  /** Timeline metrics */
  timeline: {
    /** ISO timestamp of first activity (earliest match or message) */
    firstActivity: string | null
    /** ISO timestamp of last activity (most recent match or message) */
    lastActivity: string | null
    /** Total days the user was active on the platform */
    totalDays: number
    /** Days since last activity */
    daysSinceLastActivity: number
    /** Peak activity period (e.g., "2020-06 to 2020-09") */
    peakActivityPeriod: string | null
  }
  /** Activity distribution over time */
  distribution: {
    /** Matches per month */
    matchesByMonth: Array<{ month: string; count: number }>
    /** Messages per month */
    messagesByMonth: Array<{ month: string; count: number }>
  }
  /** Platform information */
  platform: string
  /** Human-readable summary */
  summary: string
  /** Human-readable assessment */
  assessment: string
}

/**
 * Union type of all analyzer outputs
 */
export type AnalyzerOutput =
  | SafetyScreenerOutput
  | PatternRecognizerOutput
  | ChronologyMapperOutput

/**
 * Result of running all foundation analyzers
 */
export interface AnalyzerResults {
  /** Safety screening results */
  safety: SafetyScreenerOutput
  /** Pattern recognition results */
  patterns: PatternRecognizerOutput
  /** Chronological analysis results */
  chronology: ChronologyMapperOutput
  /** Overall processing metadata */
  processingMetadata: {
    /** Total time for all analyzers */
    totalDurationMs: number
    /** Total cost for all analyzers */
    totalCostUsd: number
  }
}
