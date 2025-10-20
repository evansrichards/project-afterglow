/**
 * Analyzers Module
 *
 * Two-stage analysis system:
 * - Stage 1: Quick Triage (Safety Screener) - always runs
 * - Stage 2: Comprehensive Analysis - runs for orange/red cases
 */

// Stage 1: Quick Triage
export { runSafetyScreener } from './safety-screener'

// Stage 2: Comprehensive Deep Analysis
export { runStage2Comprehensive } from './stage2-comprehensive'

// Legacy analyzers (reference implementations)
export { runPatternRecognizer } from './pattern-recognizer'
export { runChronologyMapper } from './chronology-mapper'

// Types
export type {
  AnalyzerInput,
  AnalyzerOutput,
  AnalyzerResults,
  SafetyScreenerOutput,
  PatternRecognizerOutput,
  ChronologyMapperOutput,
  RiskLevel,
} from './types'

export type {
  Stage2Input,
  Stage2ComprehensiveOutput,
  AttachmentStyle,
  SafetyDeepDive,
  AttachmentAnalysis,
  GrowthTrajectory,
} from './stage2-types'
