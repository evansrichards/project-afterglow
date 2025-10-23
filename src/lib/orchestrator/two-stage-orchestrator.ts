/**
 * Two-Stage Orchestrator
 *
 * Coordinates the execution of Stage 1 (Safety Screening) and Stage 2 (Comprehensive Analysis).
 * Generates comprehensive reports for all users.
 *
 * Flow:
 * 1. Run Stage 1: Safety Screening (quick check for serious safety issues)
 * 2. Run Stage 2: Comprehensive Analysis (ALWAYS runs for full insights and patterns)
 * 3. Return complete report with both safety assessment and comprehensive analysis
 */

import type { AnalyzerInput } from '../analyzers/types'
import { runSafetyScreener } from '../analyzers/safety-screener'
import { runStage2Comprehensive } from '../analyzers/stage2-comprehensive'
import { generateStage1Report } from '../reports/stage1-report-generator'
import { generateStage2Report } from '../reports/stage2-report-generator'
import type { Stage1Report } from '../reports/stage1-report-generator'
import type { Stage2Report } from '../reports/stage2-report-generator'

/**
 * Orchestrator result
 * Contains the final report and processing information
 */
export interface OrchestratorResult {
  /** Which stage completed */
  completedStage: 'stage1' | 'stage2'
  /** Stage 1 report (always present) */
  stage1Report: Stage1Report
  /** Stage 2 report (only if escalated) */
  stage2Report: Stage2Report | null
  /** Processing summary */
  processing: {
    stage1Duration: number
    stage2Duration: number | null
    totalDuration: number
    stage1Cost: number
    stage2Cost: number | null
    totalCost: number
    escalated: boolean
    escalationReason: string | null
  }
}

/**
 * Run two-stage analysis pipeline
 *
 * @param input - Normalized dataset to analyze
 * @param options - Optional configuration
 * @returns Complete analysis result with appropriate report(s)
 */
export async function runTwoStageAnalysis(
  input: AnalyzerInput,
  options?: {
    /** Log progress to console */
    verbose?: boolean
  }
): Promise<OrchestratorResult> {
  const verbose = options?.verbose ?? false
  const startTime = Date.now()

  // ============================================================================
  // STAGE 1: QUICK TRIAGE (Always runs)
  // ============================================================================
  if (verbose) {
    console.log('🔍 Starting Stage 1: Quick Triage...')
    console.log(`   Analyzing ${input.messages.length} messages`)
  }

  const stage1Start = Date.now()
  const safetyScreenerOutput = await runSafetyScreener(input)
  const stage1Duration = Date.now() - stage1Start

  if (verbose) {
    console.log(`✅ Stage 1 complete in ${Math.round(stage1Duration / 1000)}s`)
    console.log(`   Risk Level: ${safetyScreenerOutput.riskLevel.toUpperCase()}`)
    console.log(`   Cost: $${safetyScreenerOutput.metadata.costUsd?.toFixed(2) || '0.00'}`)
  }

  // Generate Stage 1 report
  const stage1Report = generateStage1Report(safetyScreenerOutput)

  // ============================================================================
  // STAGE 2: COMPREHENSIVE ANALYSIS (Always runs for full insights)
  // ============================================================================
  const shouldEscalate = safetyScreenerOutput.escalateToRiskEvaluator
  const riskLevel = safetyScreenerOutput.riskLevel

  if (verbose) {
    if (shouldEscalate) {
      console.log(`\n⚠️  Escalating to Stage 2: Comprehensive Analysis`)
      console.log(`   Reason: ${riskLevel.toUpperCase()} risk level detected`)
    } else {
      console.log(`\n✅ Moving to Stage 2: Comprehensive Analysis`)
      console.log(`   Safety check passed (${riskLevel.toUpperCase()})`)
    }
    console.log(`   Running deep analysis...`)
  }

  const stage2Start = Date.now()
  const stage2Output = await runStage2Comprehensive({
    ...input,
    stage1Results: safetyScreenerOutput,
  })
  const stage2Duration = Date.now() - stage2Start

  if (verbose) {
    console.log(`✅ Stage 2 complete in ${Math.round(stage2Duration / 1000)}s`)
    console.log(`   Cost: $${stage2Output.metadata.costUsd?.toFixed(2) || '0.00'}`)
  }

  // Generate Stage 2 report
  const stage2Report = generateStage2Report(stage2Output, stage1Report.safetyAssessment)

  // ============================================================================
  // FINAL RESULT
  // ============================================================================
  const totalCost =
    (safetyScreenerOutput.metadata.costUsd || 0) + (stage2Output.metadata.costUsd || 0)

  if (verbose) {
    console.log(`\n✨ Comprehensive analysis complete`)
    console.log(`   Total duration: ${Math.round((Date.now() - startTime) / 1000)}s`)
    console.log(`   Total cost: $${totalCost.toFixed(2)}`)
    if (stage2Output.safetyDeepDive.crisisLevel !== 'none') {
      console.log(
        `   ⚠️  Crisis Level: ${stage2Output.safetyDeepDive.crisisLevel.toUpperCase()}`
      )
    }
  }

  return {
    completedStage: 'stage2',
    stage1Report,
    stage2Report,
    processing: {
      stage1Duration,
      stage2Duration,
      totalDuration: Date.now() - startTime,
      stage1Cost: safetyScreenerOutput.metadata.costUsd || 0,
      stage2Cost: stage2Output.metadata.costUsd || 0,
      totalCost,
      escalated: shouldEscalate,
      escalationReason: shouldEscalate ? `${riskLevel.toUpperCase()} risk level detected in Stage 1` : null,
    },
  }
}

/**
 * Helper function to print a simple summary to console
 */
export function printResultSummary(result: OrchestratorResult): void {
  console.log('\n' + '='.repeat(80))
  console.log('ANALYSIS COMPLETE')
  console.log('='.repeat(80))
  console.log(`Completed Stage: ${result.completedStage.toUpperCase()}`)
  console.log(`Risk Level: ${result.stage1Report.safetyAssessment.riskLevel.toUpperCase()}`)
  console.log(
    `Total Cost: $${result.processing.totalCost.toFixed(2)} (Stage 1: $${result.processing.stage1Cost.toFixed(2)}${result.processing.stage2Cost ? `, Stage 2: $${result.processing.stage2Cost.toFixed(2)}` : ''})`
  )
  console.log(
    `Total Duration: ${Math.round(result.processing.totalDuration / 1000)} seconds`
  )

  if (result.completedStage === 'stage2' && result.stage2Report) {
    console.log(
      `Crisis Level: ${result.stage2Report.safetyDeepDive.crisisLevel.toUpperCase()}`
    )
    if (result.stage2Report.safetyDeepDive.professionalSupport.length > 0) {
      console.log(
        `\n⚠️  PROFESSIONAL SUPPORT RECOMMENDED (${result.stage2Report.safetyDeepDive.professionalSupport.length} resources)`
      )
    }
  }

  console.log('='.repeat(80) + '\n')
}
