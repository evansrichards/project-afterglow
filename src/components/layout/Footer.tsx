export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="w-full bg-warm-100 border-t border-warm-200">
      <div className="container-app py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand column */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-2xl">✨</span>
              <h3 className="text-lg font-display font-semibold text-warm-900">
                Project Afterglow
              </h3>
            </div>
            <p className="text-sm text-warm-600 max-w-xs">
              A compassionate reflection companion that turns your dating data
              into insights that celebrate growth.
            </p>
          </div>

          {/* Privacy column */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-warm-900 uppercase tracking-wide">
              Privacy First
            </h4>
            <ul className="space-y-2 text-sm text-warm-600">
              <li className="flex items-center gap-2">
                <svg className="w-4 h-4 text-insight-positive" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Local processing only
              </li>
              <li className="flex items-center gap-2">
                <svg className="w-4 h-4 text-insight-positive" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                No data stored on servers
              </li>
              <li className="flex items-center gap-2">
                <svg className="w-4 h-4 text-insight-positive" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Delete anytime instantly
              </li>
            </ul>
          </div>

          {/* About column */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-warm-900 uppercase tracking-wide">
              About
            </h4>
            <p className="text-sm text-warm-600">
              Built with compassion for people who want to date with more
              intention, self-awareness, and hope.
            </p>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-8 pt-8 border-t border-warm-200">
          <p className="text-sm text-warm-500 text-center">
            © {currentYear} Project Afterglow. Your data, your insights, your journey.
          </p>
        </div>
      </div>
    </footer>
  )
}
