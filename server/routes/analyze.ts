/**
 * Analysis API Route
 *
 * POST /api/analyze - Accepts parsed dating app data and runs two-stage analysis
 */

import { Router } from 'express'
import type { Request, Response } from 'express'
import { validateRequest } from '../middleware/validate-request'
import { createError } from '../middleware/error-handler'
import { runTwoStageAnalysis } from '../../src/lib/orchestrator/two-stage-orchestrator'
import type { AnalyzeRequest, AnalyzeResponse } from '../types/api'

const router = Router()

/**
 * Validation schema for analyze endpoint
 */
const analyzeSchema = {
  body: {
    messages: {
      type: 'array' as const,
      required: true,
    },
    matches: {
      type: 'array' as const,
      required: true,
    },
    participants: {
      type: 'array' as const,
      required: true,
    },
    userId: {
      type: 'string' as const,
      required: true,
      minLength: 1,
    },
    platform: {
      type: 'string' as const,
      required: true,
    },
  },
}

/**
 * POST /api/analyze
 *
 * Runs two-stage analysis on parsed dating app data
 */
router.post(
  '/analyze',
  validateRequest(analyzeSchema),
  async (req: Request, res: Response): Promise<void> => {
    const requestStart = Date.now()
    const requestBody = req.body as AnalyzeRequest

    try {
      // Validate that we have data to analyze
      if (requestBody.messages.length === 0) {
        throw createError('No messages provided for analysis', 400, 'NO_MESSAGES')
      }

      console.log('📊 Analysis request received:')
      console.log(`   Platform: ${requestBody.platform}`)
      console.log(`   Messages: ${requestBody.messages.length}`)
      console.log(`   Matches: ${requestBody.matches.length}`)
      console.log(`   Participants: ${requestBody.participants.length}`)

      // Run two-stage analysis
      const result = await runTwoStageAnalysis(
        {
          messages: requestBody.messages,
          matches: requestBody.matches,
          participants: requestBody.participants,
          userId: requestBody.userId,
        },
        {
          verbose: true, // Log progress to server console
        }
      )

      const processingTime = Date.now() - requestStart

      console.log(`✅ Analysis complete in ${Math.round(processingTime / 1000)}s`)
      console.log(`   Stage: ${result.completedStage}`)
      console.log(`   Total Cost: $${result.processing.totalCost.toFixed(4)}`)

      // Build response
      const response: AnalyzeResponse = {
        result,
        metadata: {
          requestedAt: new Date(requestStart).toISOString(),
          processingTimeMs: processingTime,
          platform: requestBody.platform,
        },
      }

      res.json(response)
    } catch (error) {
      // Handle analysis errors
      console.error('❌ Analysis failed:', error)

      // Re-throw ApiErrors (preserves status code and error code)
      if (error && typeof error === 'object' && 'statusCode' in error) {
        throw error
      }

      // Wrap unknown errors
      if (error instanceof Error) {
        throw createError(
          `Analysis failed: ${error.message}`,
          500,
          'ANALYSIS_FAILED'
        )
      }

      throw createError('Analysis failed with unknown error', 500, 'ANALYSIS_FAILED')
    }
  }
)

export default router
