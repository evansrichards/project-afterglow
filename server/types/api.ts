/**
 * API Request and Response Types
 *
 * Type definitions for backend API endpoints
 */

import type { AnalyzerInput, MetadataAnalysisResult } from '../../src/lib/analyzers/types'
import type { OrchestratorResult } from '../../src/lib/orchestrator/two-stage-orchestrator'

/**
 * Request body for POST /api/analyze
 */
export interface AnalyzeRequest {
  /** Normalized messages from dating app export */
  messages: AnalyzerInput['messages']
  /** Match contexts */
  matches: AnalyzerInput['matches']
  /** Participant profiles */
  participants: AnalyzerInput['participants']
  /** User's participant ID */
  userId: string
  /** Platform source (for tracking) */
  platform: 'tinder' | 'hinge' | 'other'
}

/**
 * Response from POST /api/analyze
 */
export interface AnalyzeResponse {
  /** Metadata analysis (quick statistics computed first) */
  metadataAnalysis: MetadataAnalysisResult
  /** Full AI analysis results */
  result: OrchestratorResult
  /** Request metadata */
  metadata: {
    /** When analysis was requested */
    requestedAt: string
    /** Total processing time (ms) */
    processingTimeMs: number
    /** Metadata analysis time (ms) */
    metadataTimeMs: number
    /** Platform that data came from */
    platform: string
    /** Data counts that were analyzed */
    dataAnalyzed: {
      messageCount: number
      matchCount: number
      participantCount: number
    }
  }
}

/**
 * Error response structure
 */
export interface ErrorResponse {
  error: {
    /** Error message */
    message: string
    /** Error code for client handling */
    code: string
    /** Stack trace (development only) */
    stack?: string
  }
}
