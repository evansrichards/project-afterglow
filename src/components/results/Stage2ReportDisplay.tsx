/**
 * Stage 2 Report Display Component
 *
 * Displays the comprehensive Stage 2 analysis including:
 * - Safety Deep Dive
 * - Attachment Analysis
 * - Growth Trajectory
 * - Synthesis
 */

import type { Stage2Report } from '../../lib/reports/stage2-report-generator'

interface Stage2ReportDisplayProps {
  report: Stage2Report
}

export default function Stage2ReportDisplay({ report }: Stage2ReportDisplayProps) {
  return (
    <div className="space-y-6">
      {/* Safety Deep Dive */}
      <div className="rounded-xl bg-white p-6 shadow-soft">
        <h3 className="mb-4 text-xl font-bold text-twilight-900">Safety Deep Dive</h3>

        {/* Crisis Level */}
        <div className="mb-6">
          <span className="text-sm font-medium text-twilight-700">Crisis Level:</span>{' '}
          <span
            className={`ml-2 inline-block rounded-full px-4 py-1.5 text-sm font-bold ${
              report.safetyDeepDive.crisisLevel === 'none'
                ? 'bg-green-100 text-green-800'
                : report.safetyDeepDive.crisisLevel === 'moderate'
                  ? 'bg-yellow-100 text-yellow-800'
                  : report.safetyDeepDive.crisisLevel === 'serious'
                    ? 'bg-orange-100 text-orange-800'
                    : 'bg-red-100 text-red-800'
            }`}
          >
            {report.safetyDeepDive.crisisLevel.toUpperCase()}
          </span>
        </div>

        {/* Professional Support */}
        {report.safetyDeepDive.professionalSupport.length > 0 && (
          <div className="mb-6 rounded-lg bg-red-50 p-4">
            <h4 className="mb-2 font-semibold text-red-900">Professional Support Recommended</h4>
            <div className="space-y-2">
              {report.safetyDeepDive.professionalSupport.map((support, index) => (
                <div key={index} className="flex items-start gap-2 rounded-md bg-white p-3">
                  <span
                    className={`inline-block rounded px-2 py-0.5 text-xs font-bold uppercase ${
                      support.priority === 'immediate'
                        ? 'bg-red-200 text-red-800'
                        : support.priority === 'high'
                          ? 'bg-orange-200 text-orange-800'
                          : 'bg-yellow-200 text-yellow-800'
                    }`}
                  >
                    {support.priority}
                  </span>
                  <div className="flex-1">
                    <p className="font-medium text-twilight-900">{support.type}</p>
                    <p className="mt-1 text-sm text-twilight-700">{support.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Manipulation Tactics */}
        {report.safetyDeepDive.manipulationTactics.length > 0 && (
          <div className="mb-6">
            <h4 className="mb-3 font-semibold text-twilight-800">Manipulation Tactics Detected</h4>
            <div className="space-y-3">
              {report.safetyDeepDive.manipulationTactics.map((tactic, index) => (
                <div
                  key={index}
                  className={`rounded-lg border-l-4 p-4 ${
                    tactic.severity === 'high'
                      ? 'border-red-400 bg-red-50'
                      : tactic.severity === 'medium'
                        ? 'border-orange-400 bg-orange-50'
                        : 'border-yellow-400 bg-yellow-50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <h5 className="font-semibold text-twilight-900">{tactic.type}</h5>
                    <span
                      className={`rounded px-2 py-0.5 text-xs font-bold uppercase ${
                        tactic.severity === 'high'
                          ? 'bg-red-200 text-red-800'
                          : tactic.severity === 'medium'
                            ? 'bg-orange-200 text-orange-800'
                            : 'bg-yellow-200 text-yellow-800'
                      }`}
                    >
                      {tactic.severity}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-twilight-700">{tactic.description}</p>
                  <p className="mt-2 text-xs font-medium text-twilight-600">
                    Pattern: {tactic.pattern}
                  </p>
                  {tactic.examples.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs font-medium text-twilight-600">Examples:</p>
                      <ul className="mt-1 list-inside list-disc space-y-1 text-xs text-twilight-600">
                        {tactic.examples.map((example, i) => (
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

        {/* Coercive Control */}
        {report.safetyDeepDive.coerciveControl.detected && (
          <div className="mb-6 rounded-lg bg-red-50 p-4">
            <h4 className="mb-2 font-semibold text-red-900">Coercive Control Detected</h4>
            <p className="mb-3 text-sm text-red-700">{report.safetyDeepDive.coerciveControl.summary}</p>
            <div className="rounded-md bg-white p-3">
              <p className="mb-2 text-xs font-medium text-twilight-600">Patterns:</p>
              <ul className="list-inside list-disc space-y-1 text-sm text-twilight-700">
                {report.safetyDeepDive.coerciveControl.patterns.map((pattern, i) => (
                  <li key={i}>{pattern}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Trauma Bonding */}
        {report.safetyDeepDive.traumaBonding.detected && (
          <div className="rounded-lg bg-orange-50 p-4">
            <h4 className="mb-2 font-semibold text-orange-900">Trauma Bonding Indicators</h4>
            <p className="mb-3 text-sm text-orange-700">{report.safetyDeepDive.traumaBonding.summary}</p>
            <div className="rounded-md bg-white p-3">
              <p className="mb-2 text-xs font-medium text-twilight-600">Cycle Phases:</p>
              <ul className="list-inside list-disc space-y-1 text-sm text-twilight-700">
                {report.safetyDeepDive.traumaBonding.cyclePhases.map((phase, i) => (
                  <li key={i}>{phase}</li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* Synthesis (show this before detailed sections) */}
      <div className="rounded-xl bg-white p-6 shadow-soft">
        <h3 className="mb-4 text-xl font-bold text-twilight-900">Key Insights</h3>

        <p className="mb-6 text-twilight-700">{report.synthesis.overallSummary}</p>

        {/* Key Themes */}
        {report.synthesis.keyThemes.length > 0 && (
          <div className="mb-6">
            <h4 className="mb-3 font-semibold text-twilight-800">Key Themes</h4>
            <div className="flex flex-wrap gap-2">
              {report.synthesis.keyThemes.map((theme, i) => (
                <span
                  key={i}
                  className="rounded-full bg-twilight-100 px-3 py-1 text-sm text-twilight-700"
                >
                  {theme}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Critical Insights */}
        {report.synthesis.criticalInsights.length > 0 && (
          <div className="mb-6">
            <h4 className="mb-3 font-semibold text-twilight-800">Critical Insights</h4>
            <div className="space-y-3">
              {report.synthesis.criticalInsights.map((insight, index) => (
                <div
                  key={index}
                  className={`rounded-lg border-l-4 p-4 ${
                    insight.category === 'safety'
                      ? 'border-red-400 bg-red-50'
                      : insight.category === 'attachment'
                        ? 'border-purple-400 bg-purple-50'
                        : 'border-green-400 bg-green-50'
                  }`}
                >
                  <h5 className="font-semibold text-twilight-900">{insight.insight}</h5>
                  <p className="mt-1 text-sm text-twilight-700">{insight.context}</p>
                  <p className="mt-2 text-xs font-medium text-twilight-600">
                    Significance: {insight.significance}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Items */}
        {report.synthesis.actionableNextSteps.length > 0 && (
          <div>
            <h4 className="mb-3 font-semibold text-twilight-800">Action Items</h4>
            <div className="space-y-2">
              {report.synthesis.actionableNextSteps.map((step, i) => (
                <div key={i} className="flex gap-2">
                  <span className="font-bold text-twilight-600">{i + 1}.</span>
                  <p className="flex-1 text-twilight-700">{step}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Attachment Analysis */}
      <div className="rounded-xl bg-white p-6 shadow-soft">
        <h3 className="mb-4 text-xl font-bold text-twilight-900">Attachment Analysis</h3>

        {/* Primary Style */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm font-medium text-twilight-700">Primary Style:</span>{' '}
              <span className="ml-2 text-lg font-bold text-twilight-900">
                {report.attachmentAnalysis.primaryStyle
                  .split('-')
                  .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                  .join(' ')}
              </span>
            </div>
            <span className="text-sm text-twilight-600">
              {Math.round(report.attachmentAnalysis.confidence * 100)}% confidence
            </span>
          </div>
          <p className="mt-2 text-sm text-twilight-700">
            {report.attachmentAnalysis.styleDescription}
          </p>
        </div>

        {/* Evidence */}
        {report.attachmentAnalysis.evidence.length > 0 && (
          <div className="mb-6">
            <h4 className="mb-2 text-sm font-semibold text-twilight-700">Evidence:</h4>
            <ul className="list-inside list-disc space-y-1 text-sm text-twilight-600">
              {report.attachmentAnalysis.evidence.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Relationship Dynamics */}
        <div>
          <h4 className="mb-3 font-semibold text-twilight-800">Relationship Dynamics</h4>
          <div className="grid gap-4 md:grid-cols-2">
            {report.attachmentAnalysis.relationshipDynamics.healthyAspects.length > 0 && (
              <div className="rounded-lg bg-green-50 p-4">
                <h5 className="mb-2 font-medium text-green-900">Healthy Aspects</h5>
                <ul className="list-inside list-disc space-y-1 text-sm text-green-700">
                  {report.attachmentAnalysis.relationshipDynamics.healthyAspects.map((aspect, i) => (
                    <li key={i}>{aspect}</li>
                  ))}
                </ul>
              </div>
            )}
            {report.attachmentAnalysis.relationshipDynamics.concerningAspects.length > 0 && (
              <div className="rounded-lg bg-red-50 p-4">
                <h5 className="mb-2 font-medium text-red-900">Concerning Aspects</h5>
                <ul className="list-inside list-disc space-y-1 text-sm text-red-700">
                  {report.attachmentAnalysis.relationshipDynamics.concerningAspects.map((aspect, i) => (
                    <li key={i}>{aspect}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          {report.attachmentAnalysis.relationshipDynamics.recommendations.length > 0 && (
            <div className="mt-4 rounded-lg bg-blue-50 p-4">
              <h5 className="mb-2 font-medium text-blue-900">Recommendations</h5>
              <ul className="list-inside list-disc space-y-1 text-sm text-blue-700">
                {report.attachmentAnalysis.relationshipDynamics.recommendations.map((rec, i) => (
                  <li key={i}>{rec}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Growth Trajectory */}
      {report.growthTrajectory && report.growthTrajectory.detected && (
        <div className="rounded-xl bg-white p-6 shadow-soft">
          <h3 className="mb-4 text-xl font-bold text-twilight-900">Growth Trajectory</h3>

          <div className="mb-4 flex items-center justify-between">
            <span className="text-sm font-medium text-twilight-700">Direction:</span>{' '}
            <span
              className={`inline-block rounded-full px-4 py-1.5 text-sm font-bold ${
                report.growthTrajectory.direction === 'improving'
                  ? 'bg-green-100 text-green-800'
                  : report.growthTrajectory.direction === 'declining'
                    ? 'bg-red-100 text-red-800'
                    : report.growthTrajectory.direction === 'stable'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-yellow-100 text-yellow-800'
              }`}
            >
              {report.growthTrajectory.direction.toUpperCase()}
            </span>
          </div>

          <p className="mb-6 rounded-lg bg-twilight-50 p-4 text-sm text-twilight-700">
            {report.growthTrajectory.summary}
          </p>

          {/* Skills Improved */}
          {report.growthTrajectory.skillsImproved.length > 0 && (
            <div className="mb-6">
              <h4 className="mb-3 font-semibold text-twilight-800">Skills Improved</h4>
              <div className="space-y-3">
                {report.growthTrajectory.skillsImproved.map((skill, index) => (
                  <div key={index} className="rounded-lg bg-green-50 p-4">
                    <div className="flex items-start justify-between">
                      <p className="font-medium text-green-900">{skill.skill}</p>
                      <span
                        className={`rounded px-2 py-0.5 text-xs font-bold ${
                          skill.improvement === 'significant'
                            ? 'bg-green-200 text-green-800'
                            : skill.improvement === 'moderate'
                              ? 'bg-blue-200 text-blue-800'
                              : 'bg-gray-200 text-gray-800'
                        }`}
                      >
                        {skill.improvement}
                      </span>
                    </div>
                    <ul className="mt-2 list-inside list-disc space-y-1 text-xs text-green-700">
                      {skill.evidence.map((ev, i) => (
                        <li key={i}>{ev}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Growth Opportunities */}
          {report.growthTrajectory.growthOpportunities.length > 0 && (
            <div>
              <h4 className="mb-3 font-semibold text-twilight-800">Growth Opportunities</h4>
              <div className="space-y-3">
                {report.growthTrajectory.growthOpportunities.map((opp, index) => (
                  <div key={index} className="rounded-lg bg-blue-50 p-4">
                    <div className="flex items-start justify-between">
                      <p className="font-medium text-blue-900">{opp.area}</p>
                      <span
                        className={`rounded px-2 py-0.5 text-xs font-bold ${
                          opp.priority === 'high'
                            ? 'bg-red-200 text-red-800'
                            : opp.priority === 'medium'
                              ? 'bg-orange-200 text-orange-800'
                              : 'bg-blue-200 text-blue-800'
                        }`}
                      >
                        {opp.priority}
                      </span>
                    </div>
                    <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-blue-700">
                      {opp.recommendations.map((rec, i) => (
                        <li key={i}>{rec}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
