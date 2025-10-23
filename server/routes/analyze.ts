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
import { analyzeMetadata } from '../../src/lib/analyzers/metadata-analyzer'
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

    console.log('📊 Raw request body keys:', Object.keys(req.body))
    console.log('📊 Request body types:', {
      messages: Array.isArray(req.body.messages) ? `array(${req.body.messages?.length})` : typeof req.body.messages,
      matches: Array.isArray(req.body.matches) ? `array(${req.body.matches?.length})` : typeof req.body.matches,
      participants: Array.isArray(req.body.participants) ? `array(${req.body.participants?.length})` : typeof req.body.participants,
      userId: typeof req.body.userId,
      platform: typeof req.body.platform,
    })

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
      console.log(`   User ID: ${requestBody.userId}`)

      // Step 1: Run metadata analysis FIRST (fast, no AI)
      console.log('\n📈 Step 1: Analyzing metadata...')
      const metadataStart = Date.now()
      const metadataAnalysis = analyzeMetadata(
        {
          messages: requestBody.messages,
          matches: requestBody.matches,
          participants: requestBody.participants,
          userId: requestBody.userId,
        },
        requestBody.platform
      )
      const metadataTimeMs = Date.now() - metadataStart

      console.log(`✅ Metadata analysis complete in ${metadataTimeMs}ms`)
      console.log(`   ${metadataAnalysis.summary}`)
      console.log(`   ${metadataAnalysis.assessment}`)

      // Step 2: Run two-stage AI analysis
      console.log('\n🤖 Step 2: Running AI analysis...')
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

      console.log(`\n✅ Complete analysis finished in ${Math.round(processingTime / 1000)}s`)
      console.log(`   Stage: ${result.completedStage}`)
      console.log(`   Total AI Cost: $${result.processing.totalCost.toFixed(4)}`)
      console.log(`   Metadata Time: ${metadataTimeMs}ms`)

      // Build response
      const response: AnalyzeResponse = {
        metadataAnalysis,
        result,
        metadata: {
          requestedAt: new Date(requestStart).toISOString(),
          processingTimeMs: processingTime,
          metadataTimeMs,
          platform: requestBody.platform,
          dataAnalyzed: {
            messageCount: requestBody.messages.length,
            matchCount: requestBody.matches.length,
            participantCount: requestBody.participants.length,
          },
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
