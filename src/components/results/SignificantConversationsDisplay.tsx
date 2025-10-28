/**
 * Significant Conversations Display Component
 *
 * Displays significant conversations detected in the user's dating app data,
 * including overview statistics, breakdown by type, and individual conversation details.
 */

import { useState } from 'react'
import type { SignificanceAnalysisResult } from '../../lib/analyzers/significance-detector'

interface SignificantConversationsDisplayProps {
  significanceAnalysis: SignificanceAnalysisResult
}

export function SignificantConversationsDisplay({
  significanceAnalysis,
}: SignificantConversationsDisplayProps) {
  const { significantConversations, statistics } = significanceAnalysis
  const [showHighlights, setShowHighlights] = useState(true)

  if (statistics.totalSignificant === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">
          💫 Significant Conversations
        </h2>
        <p className="text-gray-600">
          No significant conversations were detected in your data. This could mean your
          conversations were brief or didn't include clear indicators like date planning or contact
          exchange.
        </p>
      </div>
    )
  }

  // Get badge colors for each significance type
  const getBadgeColor = (type: keyof typeof statistics.breakdown) => {
    const colors = {
      ledToDate: 'bg-green-100 text-green-800',
      contactExchange: 'bg-blue-100 text-blue-800',
      unusualLength: 'bg-purple-100 text-purple-800',
      emotionalDepth: 'bg-pink-100 text-pink-800',
    }
    return colors[type]
  }

  const getBadgeIcon = (type: keyof typeof statistics.breakdown) => {
    const icons = {
      ledToDate: '📅',
      contactExchange: '📱',
      unusualLength: '💬',
      emotionalDepth: '❤️',
    }
    return icons[type]
  }

  const getBadgeLabel = (type: keyof typeof statistics.breakdown) => {
    const labels = {
      ledToDate: 'Led to Date',
      contactExchange: 'Contact Exchange',
      unusualLength: 'Long Conversation',
      emotionalDepth: 'Emotionally Deep',
    }
    return labels[type]
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-gray-800">💫 Significant Conversations</h2>
        <button
          onClick={() => setShowHighlights(!showHighlights)}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          title={showHighlights ? 'Hide conversation highlights' : 'Show conversation highlights'}
        >
          {showHighlights ? (
            <>
              <span>🔒</span>
              <span>Hide Highlights</span>
            </>
          ) : (
            <>
              <span>👁️</span>
              <span>Show Highlights</span>
            </>
          )}
        </button>
      </div>

      {/* Privacy Notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-2">
          <span className="text-blue-600 text-xl">🔒</span>
          <div>
            <h3 className="font-semibold text-blue-900 mb-1">Privacy Protection</h3>
            <p className="text-sm text-blue-800">
              All conversation highlights have been automatically anonymized. Phone numbers, email
              addresses, social media handles, and personal information are masked to protect
              privacy. You can toggle highlights visibility using the button above.
            </p>
          </div>
        </div>
      </div>

      {/* Overview Statistics */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <div className="text-3xl font-bold text-purple-600">
              {statistics.totalSignificant}
            </div>
            <div className="text-sm text-gray-600">Significant Conversations</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-blue-600">
              {statistics.percentageSignificant.toFixed(0)}%
            </div>
            <div className="text-sm text-gray-600">Of All Conversations</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-green-600">
              {statistics.avgMessageCount.toFixed(0)}
            </div>
            <div className="text-sm text-gray-600">Avg Messages per Significant Convo</div>
          </div>
        </div>
      </div>

      {/* Breakdown by Type */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">Breakdown by Type</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {(Object.keys(statistics.breakdown) as Array<keyof typeof statistics.breakdown>).map(
            (type) => {
              const count = statistics.breakdown[type]
              if (count === 0) return null
              return (
                <div
                  key={type}
                  className={`${getBadgeColor(type)} rounded-lg p-3 text-center transition-transform hover:scale-105`}
                >
                  <div className="text-2xl mb-1">{getBadgeIcon(type)}</div>
                  <div className="text-xl font-bold">{count}</div>
                  <div className="text-xs">{getBadgeLabel(type)}</div>
                </div>
              )
            }
          )}
        </div>
      </div>

      {/* Individual Conversations */}
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-3">
          Conversation Details ({significantConversations.length})
        </h3>
        <div className="space-y-4">
          {significantConversations
            .sort((a, b) => b.significanceScore - a.significanceScore)
            .map((conversation, index) => (
              <div
                key={conversation.matchId}
                className="border border-gray-200 rounded-lg p-4 hover:border-purple-300 transition-colors"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-gray-500">
                        Conversation #{index + 1}
                      </span>
                      <span className="text-xs text-gray-400">•</span>
                      <span className="text-sm text-gray-600">
                        {conversation.messageCount} messages
                      </span>
                      <span className="text-xs text-gray-400">•</span>
                      <span className="text-sm text-gray-600">
                        {conversation.duration.days} day{conversation.duration.days !== 1 ? 's' : ''}
                      </span>
                    </div>
                    {/* Significance Badges */}
                    <div className="flex flex-wrap gap-2 mb-2">
                      {(
                        Object.entries(conversation.significanceFlags) as Array<
                          [keyof typeof conversation.significanceFlags, boolean]
                        >
                      ).map(([flag, isSet]) => {
                        if (!isSet) return null
                        return (
                          <span
                            key={flag}
                            className={`${getBadgeColor(flag)} text-xs px-2 py-1 rounded-full font-medium`}
                          >
                            {getBadgeIcon(flag)} {getBadgeLabel(flag)}
                          </span>
                        )
                      })}
                    </div>
                  </div>
                  {/* Significance Score */}
                  <div className="flex flex-col items-end ml-4">
                    <div className="text-2xl font-bold text-purple-600">
                      {conversation.significanceScore}
                    </div>
                    <div className="text-xs text-gray-500">/ 100</div>
                  </div>
                </div>

                {/* Reasoning */}
                <div className="mb-3">
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {conversation.reasoning}
                  </p>
                </div>

                {/* Highlights */}
                {showHighlights && conversation.highlights.length > 0 && (
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="text-xs font-semibold text-gray-600 uppercase mb-2">
                      Key Moments (Anonymized)
                    </div>
                    <ul className="space-y-2">
                      {conversation.highlights.map((highlight, idx) => (
                        <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                          <span className="text-purple-500 mt-0.5">•</span>
                          <span className="flex-1">{highlight}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {!showHighlights && conversation.highlights.length > 0 && (
                  <div className="bg-gray-50 rounded-lg p-3 text-center">
                    <p className="text-sm text-gray-500 italic">
                      Highlights hidden for privacy. Click "Show Highlights" above to view.
                    </p>
                  </div>
                )}
              </div>
            ))}
        </div>
      </div>

      {/* Footer Note */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <p className="text-xs text-gray-500 text-center">
          Significant conversations are detected using AI analysis. These represent interactions
          that showed meaningful progression, such as planning to meet, exchanging contact info, or
          developing emotional connection.
        </p>
      </div>
    </div>
  )
}
