/**
 * Results Page
 *
 * Displays complete analysis results with metadata summary
 * Final page in the Upload → Processing → Results flow
 */

import { useNavigate, useLocation } from 'react-router-dom'
import Header from '@components/layout/Header'
import Footer from '@components/layout/Footer'
import Container from '@components/layout/Container'
import AnalysisResultsDisplay from '@components/results/AnalysisResultsDisplay'
import type { AnalyzeResponse } from '../../server/types/api'

export default function ResultsPage() {
  const navigate = useNavigate()
  const location = useLocation()

  // Get data passed from ProcessingPage via router state
  const result = location.state?.result as AnalyzeResponse | undefined
  const platform = location.state?.platform as string | undefined

  // Handle missing results - redirect back to upload
  if (!result) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white">
        <Header />

        <Container className="py-12">
          <div className="max-w-2xl mx-auto">
            {/* No Results State */}
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <div className="text-6xl mb-4">📊</div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">No Analysis Found</h1>
              <p className="text-gray-600 mb-6">
                We couldn't find any analysis results. Please upload your data first.
              </p>
              <button
                onClick={() => navigate('/upload')}
                className="px-6 py-3 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors font-medium"
              >
                Upload Your Data
              </button>
            </div>
          </div>
        </Container>

        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white">
      <Header />

      <Container className="py-12">
        <div className="max-w-4xl mx-auto">
          {/* Metadata Summary Section */}
          {result.metadataAnalysis && (
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Your Dating Activity Summary</h2>

              {/* Summary and Assessment */}
              <div className="mb-4 p-4 bg-purple-50 rounded-md border border-purple-200">
                <p className="text-purple-900 font-medium mb-2">
                  {result.metadataAnalysis.summary}
                </p>
                <p className="text-purple-800 text-sm">
                  {result.metadataAnalysis.assessment}
                </p>
              </div>

              {/* Volume Metrics Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="p-4 bg-gray-50 rounded-md">
                  <div className="text-2xl font-bold text-gray-900">
                    {result.metadataAnalysis.volume.totalMatches}
                  </div>
                  <div className="text-sm text-gray-600">Total Matches</div>
                </div>
                <div className="p-4 bg-gray-50 rounded-md">
                  <div className="text-2xl font-bold text-gray-900">
                    {result.metadataAnalysis.volume.totalMessages}
                  </div>
                  <div className="text-sm text-gray-600">Total Messages</div>
                </div>
                <div className="p-4 bg-gray-50 rounded-md">
                  <div className="text-2xl font-bold text-gray-900">
                    {result.metadataAnalysis.volume.activeConversations}
                  </div>
                  <div className="text-sm text-gray-600">Active Conversations</div>
                </div>
                <div className="p-4 bg-gray-50 rounded-md">
                  <div className="text-2xl font-bold text-gray-900">
                    {result.metadataAnalysis.timeline.totalDays}
                  </div>
                  <div className="text-sm text-gray-600">Days Active</div>
                </div>
              </div>

              {/* Timeline Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">First Activity:</span>{' '}
                  <span className="text-gray-900 font-medium">
                    {result.metadataAnalysis.timeline.firstActivity
                      ? new Date(result.metadataAnalysis.timeline.firstActivity).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })
                      : 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Last Activity:</span>{' '}
                  <span className="text-gray-900 font-medium">
                    {result.metadataAnalysis.timeline.lastActivity
                      ? new Date(result.metadataAnalysis.timeline.lastActivity).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })
                      : 'N/A'}
                  </span>
                </div>
                {result.metadataAnalysis.timeline.peakActivityPeriod && (
                  <div className="md:col-span-2">
                    <span className="text-gray-600">Peak Activity:</span>{' '}
                    <span className="text-gray-900 font-medium">
                      {result.metadataAnalysis.timeline.peakActivityPeriod}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Main Analysis Results */}
          <AnalysisResultsDisplay
            result={result}
            onNewAnalysis={() => navigate('/upload')}
          />

          {/* Action Buttons */}
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate('/upload')}
              className="px-6 py-3 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors font-medium"
            >
              Start New Analysis
            </button>

            {/* Future: Download Report */}
            <button
              onClick={() => alert('Download feature coming soon!')}
              className="px-6 py-3 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors font-medium"
            >
              Download Report
            </button>

            {/* Future: Share Feedback */}
            <button
              onClick={() => alert('Feedback feature coming soon!')}
              className="px-6 py-3 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors font-medium"
            >
              Share Feedback
            </button>
          </div>

          {/* Processing Metadata Footer */}
          <div className="mt-6 text-center text-sm text-gray-500">
            <p>
              Analysis completed in {Math.round(result.metadata.processingTimeMs / 1000)}s
              {result.metadata.metadataTimeMs && ` (Metadata: ${result.metadata.metadataTimeMs}ms)`}
            </p>
            {result.result.processing.totalCost > 0 && (
              <p className="mt-1">
                Processing cost: ${result.result.processing.totalCost.toFixed(4)}
              </p>
            )}
          </div>
        </div>
      </Container>

      <Footer />
    </div>
  )
}
