/**
 * Export Instructions Component
 *
 * Shows users how to export their data from different platforms
 */

import { useState } from 'react'

type Platform = 'tinder' | 'hinge'

export default function ExportInstructions() {
  const [selectedPlatform, setSelectedPlatform] = useState<Platform | null>(null)

  const instructions = {
    tinder: {
      name: 'Tinder',
      icon: '🔥',
      steps: [
        'Open the Tinder app on your mobile device',
        'Tap your profile icon',
        'Go to Settings → Account Settings',
        'Scroll down and select "Download My Data"',
        'Confirm your request via email',
        'Wait for the download link (usually arrives within 24 hours)',
        'Download the ZIP file and upload it here',
      ],
      note: 'Tinder exports include your messages, matches, and profile information in JSON format.',
    },
    hinge: {
      name: 'Hinge',
      icon: '💬',
      steps: [
        'Open the Hinge app on your mobile device',
        'Tap your profile icon',
        'Go to Settings → Request Your Data',
        'Enter your email address to confirm',
        'Wait for the download link (usually arrives within 24-48 hours)',
        'Download the ZIP file and upload it here',
      ],
      note: 'Hinge exports include your conversations, matches, and likes in CSV/JSON format.',
    },
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="font-display text-lg font-semibold text-warm-900">
          How to get your data export
        </h3>
        <p className="text-sm text-warm-600">
          Select your dating app to see step-by-step instructions
        </p>
      </div>

      {/* Platform selection */}
      <div className="flex justify-center gap-4">
        {(Object.keys(instructions) as Platform[]).map((platform) => (
          <button
            key={platform}
            onClick={() => setSelectedPlatform(platform)}
            className={`flex items-center gap-2 rounded-xl px-6 py-3 font-medium transition-all ${
              selectedPlatform === platform
                ? 'bg-afterglow-500 text-white shadow-soft-lg'
                : 'bg-warm-100 text-warm-700 hover:bg-warm-200'
            } `}
          >
            <span className="text-xl">{instructions[platform].icon}</span>
            <span>{instructions[platform].name}</span>
          </button>
        ))}
      </div>

      {/* Instructions */}
      {selectedPlatform && (
        <div className="card animate-slide-up space-y-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{instructions[selectedPlatform].icon}</span>
            <h4 className="font-display text-xl font-semibold text-warm-900">
              {instructions[selectedPlatform].name} Export
            </h4>
          </div>

          <ol className="space-y-3">
            {instructions[selectedPlatform].steps.map((step, index) => (
              <li key={index} className="flex gap-3">
                <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-afterglow-100 text-sm font-semibold text-afterglow-700">
                  {index + 1}
                </span>
                <span className="text-warm-700">{step}</span>
              </li>
            ))}
          </ol>

          <div className="rounded-xl bg-twilight-50 p-4">
            <div className="flex gap-3">
              <svg
                className="h-5 w-5 flex-shrink-0 text-twilight-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="text-sm text-twilight-700">{instructions[selectedPlatform].note}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
