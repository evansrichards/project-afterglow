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
import { detectSignificantConversations } from '../../src/lib/analyzers/significance-detector'
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

      // Step 1: Run metadata analysis FIRST (includes AI-powered assessment)
      console.log('\n📈 Step 1: Analyzing metadata...')
      const metadataStart = Date.now()
      const metadataAnalysis = await analyzeMetadata(
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

      // Step 2: Detect significant conversations
      console.log('\n🔍 Step 2: Detecting significant conversations...')
      const significanceStart = Date.now()
      const significanceAnalysis = await detectSignificantConversations(
        requestBody.messages,
        requestBody.userId
      )
      const significanceTimeMs = Date.now() - significanceStart

      console.log(`✅ Significance detection complete in ${significanceTimeMs}ms`)
      console.log(`   Found ${significanceAnalysis.statistics.totalSignificant} significant conversations`)
      console.log(`   Breakdown: ${significanceAnalysis.statistics.breakdown.ledToDate} dates, ${significanceAnalysis.statistics.breakdown.contactExchange} contacts, ${significanceAnalysis.statistics.breakdown.unusualLength} long, ${significanceAnalysis.statistics.breakdown.emotionalDepth} emotional`)

      // ============================================================================
      // TEMPORARILY DISABLED: Full AI Analysis for faster testing
      // ============================================================================
      // TODO: Re-enable when ready for full analysis
      /*
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
      */

      // ============================================================================
      // MOCK DATA: Return minimal mock result for testing
      // ============================================================================
      const processingTime = Date.now() - requestStart

      // Create a minimal mock result for Stage 1 and Stage 2
      const mockResult = {
        completedStage: 'stage2' as const,
        stage1Report: {
          reportType: 'stage1-complete' as const,
          safetyAssessment: {
            riskLevel: 'green' as const,
            headline: 'Your conversations show healthy patterns',
            summary: 'No immediate safety concerns detected. This is a mock analysis for testing - AI analysis is temporarily disabled.',
            riskLevelDescription: 'We found no significant safety concerns in your dating conversations. (Mock data)',
          },
          insights: [
            {
              category: 'safety' as const,
              title: 'Mock Analysis Active',
              description: 'AI analysis is temporarily disabled. This is placeholder data for testing the UI flow.',
            },
          ],
          recommendations: [
            {
              priority: 'medium' as const,
              recommendation: 'Re-enable AI analysis for full insights',
              rationale: 'Uncomment the AI analysis code in server/routes/analyze.ts to get real analysis.',
            },
          ],
          processingInfo: {
            stage: 'Stage 1: Quick Triage' as const,
            completedAt: new Date().toISOString(),
            durationSeconds: 0,
            costUsd: 0,
            model: 'mock-model',
          },
        },
        stage2Report: {
          reportType: 'stage2-comprehensive' as const,
          stage1Summary: {
            riskLevel: 'green' as const,
            headline: 'Your conversations show healthy patterns',
            summary: 'Mock Stage 1 summary',
          },
          safetyDeepDive: {
            crisisLevel: 'none' as const,
            manipulationTactics: [],
            coerciveControl: {
              detected: false,
              summary: 'No coercive control patterns detected (mock data)',
              patterns: [],
            },
            traumaBonding: {
              detected: false,
              summary: 'No trauma bonding detected (mock data)',
              cyclePhases: [],
            },
            professionalSupport: [],
          },
          attachmentAnalysis: {
            primaryStyle: 'secure' as const,
            confidence: 0.5,
            styleDescription: 'Mock attachment style description',
            evidence: ['Limited data available for analysis'],
            triggers: [],
            copingMechanisms: [],
            relationshipDynamics: {
              healthyAspects: ['Mock analysis - full analysis temporarily disabled'],
              concerningAspects: [],
              recommendations: [],
            },
          },
          growthTrajectory: null,
          synthesis: {
            overallSummary: 'This is a mock analysis. AI analysis is temporarily disabled for faster testing. Re-enable in server/routes/analyze.ts to get full insights.',
            keyThemes: ['Mock data'],
            criticalInsights: [],
            prioritizedRecommendations: [],
          },
          processingInfo: {
            stage: 'Stage 2: Comprehensive Analysis' as const,
            completedAt: new Date().toISOString(),
            durationSeconds: 0,
            costUsd: 0,
            model: 'mock-model',
          },
        },
        processing: {
          stage1Duration: 0,
          stage2Duration: 0,
          totalDuration: processingTime,
          stage1Cost: 0,
          stage2Cost: 0,
          totalCost: 0,
          escalated: false,
          escalationReason: null,
        },
      }

      console.log(`\n✅ Analysis finished in ${Math.round(processingTime / 1000)}s`)
      console.log(`   Metadata Time: ${metadataTimeMs}ms`)
      console.log(`   Significance Time: ${significanceTimeMs}ms`)
      console.log(`   ⚠️  Full AI analysis is DISABLED (mock data returned)`)

      // Build response
      const response: AnalyzeResponse = {
        metadataAnalysis,
        significanceAnalysis,
        result: mockResult,
        metadata: {
          requestedAt: new Date(requestStart).toISOString(),
          processingTimeMs: processingTime,
          metadataTimeMs,
          significanceTimeMs,
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
