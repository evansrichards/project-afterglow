/**
 * Processing Page
 *
 * Shows real-time analysis progress with metadata preview
 * Displays step-by-step progress as the data is analyzed
 */

import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import Header from '@components/layout/Header'
import Footer from '@components/layout/Footer'
import Container from '@components/layout/Container'
import { analyzeData } from '@api/client'
import type { ParseResult } from '@lib/parsers'
import type { AnalyzeResponse } from '../../server/types/api'

type ProcessingStep = 'uploading' | 'metadata' | 'stage1' | 'stage2' | 'complete' | 'error'

interface ProcessingState {
  currentStep: ProcessingStep
  metadata: AnalyzeResponse['metadataAnalysis'] | null
  error: string | null
  result: AnalyzeResponse | null
}

export default function ProcessingPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [processing, setProcessing] = useState<ProcessingState>({
    currentStep: 'uploading',
    metadata: null,
    error: null,
    result: null,
  })

  // Get data passed from UploadPage via router state
  const parseResult = location.state?.parseResult as ParseResult | undefined
  const platform = location.state?.platform as string | undefined

  useEffect(() => {
    // Redirect back to upload if no data was provided
    if (!parseResult || !platform) {
      navigate('/upload')
      return
    }

    // Start analysis immediately
    runAnalysis()
  }, [parseResult, platform, navigate])

  const runAnalysis = async () => {
    if (!parseResult?.data || !platform) return

    try {
      // Find current user
      const currentUser = parseResult.data.participants.find((p) => p.isUser)
      if (!currentUser?.id) {
        throw new Error('Could not identify current user')
      }

      // Step 1: Uploading (immediate)
      setProcessing((prev) => ({ ...prev, currentStep: 'uploading' }))
      await new Promise((resolve) => setTimeout(resolve, 500)) // Brief pause for UX

      // Step 2: Start analysis (metadata will be computed server-side)
      setProcessing((prev) => ({ ...prev, currentStep: 'metadata' }))

      console.log('🚀 Starting analysis...')
      const result = await analyzeData({
        messages: parseResult.data.messages,
        matches: parseResult.data.matches,
        participants: parseResult.data.participants,
        userId: currentUser.id,
        platform: platform as 'tinder' | 'hinge',
      })

      console.log('✅ Analysis complete:', result)

      // Update with metadata
      setProcessing((prev) => ({
        ...prev,
        metadata: result.metadataAnalysis,
        currentStep: 'stage1',
      }))

      // Simulate stage progression for UX (the analysis is already done)
      await new Promise((resolve) => setTimeout(resolve, 1000))
      setProcessing((prev) => ({ ...prev, currentStep: 'stage2' }))

      await new Promise((resolve) => setTimeout(resolve, 1000))
      setProcessing((prev) => ({
        ...prev,
        currentStep: 'complete',
        result,
      }))

      // Auto-redirect to results after brief delay
      setTimeout(() => {
        navigate('/results', {
          state: {
            result,
            platform,
          },
        })
      }, 1500)
    } catch (error) {
      console.error('❌ Analysis failed:', error)
      setProcessing({
        currentStep: 'error',
        metadata: null,
        error: error instanceof Error ? error.message : 'Analysis failed',
        result: null,
      })
    }
  }

  const getStepStatus = (step: ProcessingStep): 'complete' | 'current' | 'pending' => {
    const stepOrder: ProcessingStep[] = ['uploading', 'metadata', 'stage1', 'stage2', 'complete']
    const currentIndex = stepOrder.indexOf(processing.currentStep)
    const stepIndex = stepOrder.indexOf(step)

    if (processing.currentStep === 'error') {
      return stepIndex < currentIndex ? 'complete' : 'pending'
    }

    if (stepIndex < currentIndex) return 'complete'
    if (stepIndex === currentIndex) return 'current'
    return 'pending'
  }

  const getStepIcon = (status: 'complete' | 'current' | 'pending') => {
    if (status === 'complete') return '✓'
    if (status === 'current') return '⟳'
    return '○'
  }

  const getStepColor = (status: 'complete' | 'current' | 'pending') => {
    if (status === 'complete') return 'text-green-600'
    if (status === 'current') return 'text-blue-600 animate-pulse'
    return 'text-gray-400'
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white">
      <Header />

      <Container className="py-12">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Analyzing Your Data</h1>
            <p className="text-gray-600">
              Please wait while we process your {platform} data...
            </p>
          </div>

          {/* Error State */}
          {processing.currentStep === 'error' && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
              <div className="flex items-start">
                <div className="text-2xl mr-3">❌</div>
                <div>
                  <h3 className="font-semibold text-red-900 mb-1">Analysis Failed</h3>
                  <p className="text-red-700 mb-4">{processing.error}</p>
                  <button
                    onClick={() => navigate('/upload')}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                  >
                    Back to Upload
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Progress Steps */}
          {processing.currentStep !== 'error' && (
            <div className="bg-white rounded-lg shadow-md p-8 mb-6">
              <div className="space-y-6">
                {/* Step 1: Uploading */}
                <div className="flex items-start">
                  <div
                    className={`text-2xl mr-4 ${getStepColor(getStepStatus('uploading'))}`}
                  >
                    {getStepIcon(getStepStatus('uploading'))}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Uploading data</h3>
                    <p className="text-sm text-gray-600">Preparing your data for analysis</p>
                  </div>
                </div>

                {/* Step 2: Metadata */}
                <div className="flex items-start">
                  <div
                    className={`text-2xl mr-4 ${getStepColor(getStepStatus('metadata'))}`}
                  >
                    {getStepIcon(getStepStatus('metadata'))}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">Analyzing metadata</h3>
                    <p className="text-sm text-gray-600">
                      Extracting basic statistics and timeline
                    </p>

                    {/* Show metadata when available */}
                    {processing.metadata && (
                      <div className="mt-3 p-4 bg-purple-50 rounded-md border border-purple-200">
                        <p className="text-sm text-purple-900 font-medium mb-2">
                          {processing.metadata.summary}
                        </p>
                        <p className="text-sm text-purple-800">
                          {processing.metadata.assessment}
                        </p>
                        <div className="grid grid-cols-2 gap-4 mt-3 text-sm">
                          <div>
                            <span className="text-purple-700 font-medium">Matches:</span>{' '}
                            <span className="text-purple-900">
                              {processing.metadata.volume.totalMatches}
                            </span>
                          </div>
                          <div>
                            <span className="text-purple-700 font-medium">Messages:</span>{' '}
                            <span className="text-purple-900">
                              {processing.metadata.volume.totalMessages}
                            </span>
                          </div>
                          <div>
                            <span className="text-purple-700 font-medium">
                              Active Conversations:
                            </span>{' '}
                            <span className="text-purple-900">
                              {processing.metadata.volume.activeConversations}
                            </span>
                          </div>
                          <div>
                            <span className="text-purple-700 font-medium">Days Active:</span>{' '}
                            <span className="text-purple-900">
                              {processing.metadata.timeline.totalDays}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Step 3: Safety Screening */}
                <div className="flex items-start">
                  <div className={`text-2xl mr-4 ${getStepColor(getStepStatus('stage1'))}`}>
                    {getStepIcon(getStepStatus('stage1'))}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Running safety screening</h3>
                    <p className="text-sm text-gray-600">
                      AI analysis for immediate safety concerns
                    </p>
                  </div>
                </div>

                {/* Step 4: Comprehensive Analysis */}
                <div className="flex items-start">
                  <div className={`text-2xl mr-4 ${getStepColor(getStepStatus('stage2'))}`}>
                    {getStepIcon(getStepStatus('stage2'))}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      Performing comprehensive analysis
                    </h3>
                    <p className="text-sm text-gray-600">
                      Deep dive into patterns, attachment, and growth
                    </p>
                  </div>
                </div>

                {/* Step 5: Complete */}
                <div className="flex items-start">
                  <div className={`text-2xl mr-4 ${getStepColor(getStepStatus('complete'))}`}>
                    {getStepIcon(getStepStatus('complete'))}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Generating your report</h3>
                    <p className="text-sm text-gray-600">Preparing insights and recommendations</p>
                  </div>
                </div>
              </div>

              {/* Complete State */}
              {processing.currentStep === 'complete' && (
                <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-md">
                  <p className="text-green-900 font-medium">
                    ✓ Analysis complete! Redirecting to results...
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Cancel Button */}
          {processing.currentStep !== 'complete' && processing.currentStep !== 'error' && (
            <div className="text-center">
              <button
                onClick={() => navigate('/upload')}
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </Container>

      <Footer />
    </div>
  )
}
