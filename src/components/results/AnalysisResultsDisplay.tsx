/**
 * Analysis Results Display Component
 *
 * Displays the results of the two-stage analysis with proper formatting
 * Handles both Stage 1 (Safety Assessment) and Stage 2 (Comprehensive Analysis) reports
 */

import type { AnalyzeResponse } from '../../../server/types/api'

interface AnalysisResultsDisplayProps {
  result: AnalyzeResponse
  onNewAnalysis?: () => void
}

export default function AnalysisResultsDisplay({
  result,
  onNewAnalysis,
}: AnalysisResultsDisplayProps) {
  const { result: analysisResult, metadata } = result
  const isStage2 = analysisResult.completedStage === 'stage2'

  return (
    <div className="animate-slide-up space-y-6">
      {/* Header */}
      <div className="rounded-xl bg-twilight-50 p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-twilight-900">
              Analysis Complete!
            </h2>
            <p className="mt-1 text-sm text-twilight-700">
              {isStage2 ? 'Comprehensive Deep Analysis' : 'Quick Safety Assessment'} completed in{' '}
              {Math.round(analysisResult.processing.totalDuration / 1000)} seconds
            </p>
          </div>
          {onNewAnalysis && (
            <button
              onClick={onNewAnalysis}
              className="text-sm text-twilight-600 underline hover:text-twilight-800"
            >
              New Analysis
            </button>
          )}
        </div>

        {/* Processing Summary */}
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-lg bg-white p-3 shadow-soft">
            <div className="text-xs text-twilight-600">Stage</div>
            <div className="mt-1 text-lg font-semibold text-twilight-900">
              {isStage2 ? 'Stage 2' : 'Stage 1'}
            </div>
          </div>
          <div className="rounded-lg bg-white p-3 shadow-soft">
            <div className="text-xs text-twilight-600">Duration</div>
            <div className="mt-1 text-lg font-semibold text-twilight-900">
              {Math.round(analysisResult.processing.totalDuration / 1000)}s
            </div>
          </div>
          <div className="rounded-lg bg-white p-3 shadow-soft">
            <div className="text-xs text-twilight-600">Cost</div>
            <div className="mt-1 text-lg font-semibold text-twilight-900">
              ${analysisResult.processing.totalCost.toFixed(4)}
            </div>
          </div>
          <div className="rounded-lg bg-white p-3 shadow-soft">
            <div className="text-xs text-twilight-600">Platform</div>
            <div className="mt-1 text-lg font-semibold capitalize text-twilight-900">
              {metadata.platform}
            </div>
          </div>
        </div>

        {/* Data Summary - Show what was analyzed */}
        {metadata.dataAnalyzed && (
          <div className="mt-4 rounded-lg bg-white p-4 shadow-soft">
            <h4 className="mb-2 text-sm font-semibold text-twilight-700">Data Analyzed</h4>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <div className="text-2xl font-bold text-twilight-900">
                  {metadata.dataAnalyzed.messageCount.toLocaleString()}
                </div>
                <div className="text-xs text-twilight-600">Messages</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-twilight-900">
                  {metadata.dataAnalyzed.matchCount.toLocaleString()}
                </div>
                <div className="text-xs text-twilight-600">Matches</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-twilight-900">
                  {metadata.dataAnalyzed.participantCount.toLocaleString()}
                </div>
                <div className="text-xs text-twilight-600">People</div>
              </div>
            </div>
            <div className="mt-3 rounded-md bg-blue-50 p-3 text-xs text-blue-700">
              <strong>Smart Sampling:</strong> For cost efficiency, we analyze up to 200 of your most recent conversations (up to 50 messages each). This intelligent sampling captures the most relevant patterns while keeping analysis affordable.
            </div>
          </div>
        )}

        {/* Escalation Notice */}
        {analysisResult.processing.escalated && (
          <div className="mt-4 rounded-lg bg-orange-50 p-4">
            <div className="flex gap-3">
              <svg
                className="h-5 w-5 flex-shrink-0 text-orange-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <div>
                <h4 className="font-semibold text-orange-900">
                  Analysis Escalated to Stage 2
                </h4>
                <p className="mt-1 text-sm text-orange-700">
                  {analysisResult.processing.escalationReason}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Stage 1 Report */}
      {analysisResult.stage1Report && (
        <div className="rounded-xl bg-white p-6 shadow-soft">
          <h3 className="mb-4 text-xl font-bold text-twilight-900">
            Safety Assessment
          </h3>

          {/* Risk Level */}
          <div className="mb-4">
            <span className="text-sm font-medium text-twilight-700">Risk Level:</span>{' '}
            <span
              className={`ml-2 inline-block rounded-full px-4 py-1.5 text-sm font-bold ${
                analysisResult.stage1Report.safetyAssessment.riskLevel === 'green'
                  ? 'bg-green-100 text-green-800'
                  : analysisResult.stage1Report.safetyAssessment.riskLevel === 'yellow'
                    ? 'bg-yellow-100 text-yellow-800'
                    : analysisResult.stage1Report.safetyAssessment.riskLevel === 'orange'
                      ? 'bg-orange-100 text-orange-800'
                      : 'bg-red-100 text-red-800'
              }`}
            >
              {analysisResult.stage1Report.safetyAssessment.riskLevel.toUpperCase()}
            </span>
          </div>

          {/* Headline */}
          <h4 className="mb-2 text-lg font-semibold text-twilight-800">
            {analysisResult.stage1Report.safetyAssessment.headline}
          </h4>

          {/* Summary */}
          <div className="rounded-lg bg-twilight-50 p-4">
            <p className="text-twilight-700">
              {analysisResult.stage1Report.safetyAssessment.summary}
            </p>
          </div>

          {/* Risk Level Description */}
          <div className="mt-4 rounded-lg border border-twilight-200 bg-white p-4">
            <h5 className="mb-2 text-sm font-semibold text-twilight-700">
              What This Means:
            </h5>
            <p className="text-sm text-twilight-600">
              {analysisResult.stage1Report.safetyAssessment.riskLevelDescription}
            </p>
          </div>

          {/* Insights */}
          {analysisResult.stage1Report.insights &&
            analysisResult.stage1Report.insights.length > 0 && (
              <div className="mt-6">
                <h5 className="mb-3 font-semibold text-twilight-800">Key Insights</h5>
                <div className="space-y-3">
                  {analysisResult.stage1Report.insights.map((insight, index) => (
                    <div
                      key={index}
                      className={`rounded-lg border-l-4 p-4 ${
                        insight.category === 'safety'
                          ? 'border-red-400 bg-red-50'
                          : insight.category === 'communication'
                            ? 'border-blue-400 bg-blue-50'
                            : 'border-green-400 bg-green-50'
                      }`}
                    >
                      <h6
                        className={`font-semibold ${
                          insight.category === 'safety'
                            ? 'text-red-900'
                            : insight.category === 'communication'
                              ? 'text-blue-900'
                              : 'text-green-900'
                        }`}
                      >
                        {insight.title}
                      </h6>
                      <p
                        className={`mt-1 text-sm ${
                          insight.category === 'safety'
                            ? 'text-red-700'
                            : insight.category === 'communication'
                              ? 'text-blue-700'
                              : 'text-green-700'
                        }`}
                      >
                        {insight.description}
                      </p>
                      {insight.examples && insight.examples.length > 0 && (
                        <div className="mt-2">
                          <p className="text-xs font-medium text-twilight-600">Examples:</p>
                          <ul className="mt-1 list-inside list-disc space-y-1 text-xs text-twilight-600">
                            {insight.examples.map((example, i) => (
                              <li key={i}>{example}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

          {/* Recommendations */}
          {analysisResult.stage1Report.recommendations &&
            analysisResult.stage1Report.recommendations.length > 0 && (
              <div className="mt-6">
                <h5 className="mb-3 font-semibold text-twilight-800">Recommendations</h5>
                <div className="space-y-3">
                  {analysisResult.stage1Report.recommendations.map((rec, index) => (
                    <div
                      key={index}
                      className={`rounded-lg p-4 ${
                        rec.priority === 'high'
                          ? 'bg-red-50'
                          : rec.priority === 'medium'
                            ? 'bg-yellow-50'
                            : 'bg-blue-50'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <span
                          className={`inline-block rounded px-2 py-0.5 text-xs font-bold uppercase ${
                            rec.priority === 'high'
                              ? 'bg-red-200 text-red-800'
                              : rec.priority === 'medium'
                                ? 'bg-yellow-200 text-yellow-800'
                                : 'bg-blue-200 text-blue-800'
                          }`}
                        >
                          {rec.priority}
                        </span>
                        <div className="flex-1">
                          <p
                            className={`font-medium ${
                              rec.priority === 'high'
                                ? 'text-red-900'
                                : rec.priority === 'medium'
                                  ? 'text-yellow-900'
                                  : 'text-blue-900'
                            }`}
                          >
                            {rec.recommendation}
                          </p>
                          <p
                            className={`mt-1 text-sm ${
                              rec.priority === 'high'
                                ? 'text-red-700'
                                : rec.priority === 'medium'
                                  ? 'text-yellow-700'
                                  : 'text-blue-700'
                            }`}
                          >
                            {rec.rationale}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
        </div>
      )}

      {/* Stage 2 Report */}
      {analysisResult.stage2Report && (
        <div className="rounded-xl bg-white p-6 shadow-soft">
          <h3 className="mb-4 text-xl font-bold text-twilight-900">
            Comprehensive Analysis
          </h3>

          <div className="rounded-lg border-2 border-dashed border-twilight-300 bg-twilight-50 p-6 text-center">
            <p className="text-twilight-700">
              <strong>Stage 2 detailed report display coming soon!</strong>
            </p>
            <p className="mt-2 text-sm text-twilight-600">
              The comprehensive analysis has been completed. Full detailed view with safety deep
              dive, attachment analysis, and growth trajectory will be displayed here.
            </p>
          </div>
        </div>
      )}

      {/* Processing Metadata */}
      <div className="rounded-xl bg-twilight-50 p-6">
        <h3 className="mb-4 text-lg font-semibold text-twilight-900">Processing Details</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <h4 className="text-sm font-medium text-twilight-700">Stage 1 Processing</h4>
            <div className="mt-2 space-y-1 text-sm text-twilight-600">
              <div>
                Duration: {Math.round(analysisResult.processing.stage1Duration / 1000)} seconds
              </div>
              <div>Cost: ${analysisResult.processing.stage1Cost.toFixed(4)}</div>
              <div>Model: {analysisResult.stage1Report.processingInfo.model}</div>
            </div>
          </div>

          {analysisResult.processing.escalated && analysisResult.processing.stage2Duration && (
            <div>
              <h4 className="text-sm font-medium text-twilight-700">Stage 2 Processing</h4>
              <div className="mt-2 space-y-1 text-sm text-twilight-600">
                <div>
                  Duration: {Math.round(analysisResult.processing.stage2Duration / 1000)} seconds
                </div>
                <div>Cost: ${(analysisResult.processing.stage2Cost || 0).toFixed(4)}</div>
                {analysisResult.stage2Report && (
                  <div>Model: {analysisResult.stage2Report.processingInfo.model}</div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="mt-4 border-t border-twilight-200 pt-4">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-twilight-700">Total</span>
            <span className="text-twilight-600">
              {Math.round(analysisResult.processing.totalDuration / 1000)}s ·{' '}
              ${analysisResult.processing.totalCost.toFixed(4)}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
