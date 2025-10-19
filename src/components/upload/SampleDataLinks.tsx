/**
 * Sample Data Links Component
 *
 * Provides links to download sample datasets for testing
 */

export interface SampleDataLinksProps {
  onSampleSelect: (platform: 'tinder' | 'hinge') => void
}

export default function SampleDataLinks({ onSampleSelect }: SampleDataLinksProps) {
  const samples = [
    {
      platform: 'tinder' as const,
      name: 'Tinder Sample',
      description: 'Sample Tinder export with messages and matches',
      icon: '🔥',
    },
    {
      platform: 'hinge' as const,
      name: 'Hinge Sample',
      description: 'Sample Hinge export with conversations',
      icon: '💬',
    },
  ]

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h3 className="font-display text-lg font-semibold text-warm-900">Try with sample data</h3>
        <p className="text-sm text-warm-600">
          Not ready to upload your own data? Explore with our sample exports first.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {samples.map((sample) => (
          <button
            key={sample.platform}
            onClick={() => onSampleSelect(sample.platform)}
            className="card-interactive flex items-start gap-4 text-left"
          >
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-warm-100 text-2xl">
              {sample.icon}
            </div>
            <div className="flex-1 space-y-1">
              <h4 className="font-display font-semibold text-warm-900">{sample.name}</h4>
              <p className="text-sm text-warm-600">{sample.description}</p>
            </div>
            <svg
              className="h-5 w-5 flex-shrink-0 text-warm-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        ))}
      </div>
    </div>
  )
}
