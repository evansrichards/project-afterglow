interface HeaderProps {
  variant?: 'transparent' | 'solid'
}

export default function Header({ variant = 'transparent' }: HeaderProps) {
  return (
    <header
      className={`w-full transition-colors duration-300 ${
        variant === 'solid' ? 'bg-white shadow-soft' : 'bg-transparent'
      }`}
    >
      <div className="container-app">
        <div className="flex h-16 items-center justify-between md:h-20">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <span className="text-2xl">✨</span>
            <h1 className="font-display text-xl font-semibold text-warm-900 md:text-2xl">
              Project Afterglow
            </h1>
          </div>

          {/* Privacy badge */}
          <div className="privacy-badge">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
            <span className="hidden sm:inline">100% Private</span>
          </div>
        </div>
      </div>
    </header>
  )
}
