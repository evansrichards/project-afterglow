import Header from '@components/layout/Header'
import Footer from '@components/layout/Footer'
import Container from '@components/layout/Container'

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header variant="transparent" />

      {/* Hero Section */}
      <section className="gradient-warm flex-1 flex items-center py-20 md:py-32">
        <Container maxWidth="lg">
          <div className="text-center space-y-8 animate-fade-in">
            <h1 className="text-5xl md:text-6xl font-display font-bold text-warm-900 text-balance">
              Turn your dating data into{' '}
              <span className="text-afterglow-600">compassionate insights</span>
            </h1>

            <p className="text-xl md:text-2xl text-warm-700 max-w-3xl mx-auto text-balance">
              Upload your dating app exports and discover what's working, where you shine,
              and gentle experiments to keep dating hopeful instead of draining.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <button className="btn-primary text-lg px-8 py-4">
                Get Started — It's Free
              </button>
              <button className="btn-ghost text-lg px-8 py-4">
                Try Sample Data First
              </button>
            </div>

            {/* Privacy reassurance */}
            <div className="pt-8 flex items-center justify-center gap-2 text-sm text-warm-600">
              <svg className="w-5 h-5 text-twilight-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span>100% private — all processing happens on your device</span>
            </div>
          </div>
        </Container>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-white">
        <Container maxWidth="lg">
          <div className="section-header text-center">
            <h2 className="section-title">Three steps to clarity</h2>
            <p className="section-description mx-auto">
              A gentle journey from data export to actionable insights
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
            {/* Step 1 */}
            <div className="text-center space-y-4 animate-slide-up">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-afterglow-100 text-afterglow-600 flex items-center justify-center text-2xl font-bold">
                1
              </div>
              <h3 className="text-xl font-display font-semibold text-warm-900">
                Upload your data
              </h3>
              <p className="text-warm-700">
                Drag and drop your Tinder or Hinge export. We'll guide you on how to download it
                from each app.
              </p>
            </div>

            {/* Step 2 */}
            <div className="text-center space-y-4 animate-slide-up" style={{ animationDelay: '0.1s' }}>
              <div className="w-16 h-16 mx-auto rounded-2xl bg-twilight-100 text-twilight-600 flex items-center justify-center text-2xl font-bold">
                2
              </div>
              <h3 className="text-xl font-display font-semibold text-warm-900">
                We analyze locally
              </h3>
              <p className="text-warm-700">
                Your messages never leave your browser. We surface patterns in communication,
                energy, and connection.
              </p>
            </div>

            {/* Step 3 */}
            <div className="text-center space-y-4 animate-slide-up" style={{ animationDelay: '0.2s' }}>
              <div className="w-16 h-16 mx-auto rounded-2xl bg-insight-reflection-light text-purple-600 flex items-center justify-center text-2xl font-bold">
                3
              </div>
              <h3 className="text-xl font-display font-semibold text-warm-900">
                Reflect & experiment
              </h3>
              <p className="text-warm-700">
                Celebrate your strengths, note growth opportunities, and jot down micro-goals
                that feel aligned.
              </p>
            </div>
          </div>
        </Container>
      </section>

      {/* What You'll Discover */}
      <section className="py-20 bg-warm-50">
        <Container maxWidth="lg">
          <div className="section-header text-center">
            <h2 className="section-title">What you'll discover</h2>
            <p className="section-description mx-auto">
              Insights that celebrate what works and gently surface opportunities for growth
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Insight card 1 */}
            <div className="card">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-insight-positive-light flex items-center justify-center">
                  <svg className="w-6 h-6 text-insight-positive" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div className="space-y-2">
                  <h3 className="font-display font-semibold text-warm-900">
                    Your conversation strengths
                  </h3>
                  <p className="text-warm-700">
                    See which messaging styles spark the best responses and keep conversations flowing
                  </p>
                </div>
              </div>
            </div>

            {/* Insight card 2 */}
            <div className="card">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-insight-growth-light flex items-center justify-center">
                  <svg className="w-6 h-6 text-insight-growth" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div className="space-y-2">
                  <h3 className="font-display font-semibold text-warm-900">
                    Response patterns & timing
                  </h3>
                  <p className="text-warm-700">
                    Understand when conversations gain momentum and when they stall
                  </p>
                </div>
              </div>
            </div>

            {/* Insight card 3 */}
            <div className="card">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-twilight-100 flex items-center justify-center">
                  <svg className="w-6 h-6 text-twilight-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                  </svg>
                </div>
                <div className="space-y-2">
                  <h3 className="font-display font-semibold text-warm-900">
                    Energy & reciprocity balance
                  </h3>
                  <p className="text-warm-700">
                    Notice where you're carrying conversations solo and where it feels mutual
                  </p>
                </div>
              </div>
            </div>

            {/* Insight card 4 */}
            <div className="card">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-insight-reflection-light flex items-center justify-center">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <div className="space-y-2">
                  <h3 className="font-display font-semibold text-warm-900">
                    Gentle growth experiments
                  </h3>
                  <p className="text-warm-700">
                    Get supportive nudges for small adjustments that keep dating hopeful
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* Privacy Promise */}
      <section className="py-20 bg-twilight-50">
        <Container maxWidth="md">
          <div className="text-center space-y-6">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-twilight-600 text-white flex items-center justify-center">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>

            <h2 className="text-3xl md:text-4xl font-display font-bold text-warm-900">
              Your privacy is sacred
            </h2>

            <p className="text-lg text-warm-700 max-w-2xl mx-auto">
              We know you're trusting us with vulnerable data. That's why everything happens
              locally in your browser. Your messages never touch our servers, and you can
              delete everything instantly at any time.
            </p>

            <div className="pt-4">
              <button className="btn-secondary">
                Learn more about our privacy practices
              </button>
            </div>
          </div>
        </Container>
      </section>

      {/* CTA Section */}
      <section className="py-20 gradient-sunset text-white">
        <Container maxWidth="md">
          <div className="text-center space-y-8">
            <h2 className="text-4xl md:text-5xl font-display font-bold text-balance">
              Ready to see what your data reveals?
            </h2>

            <p className="text-xl opacity-95 text-balance">
              Let's turn your dating history into insights that celebrate your growth
              and guide your next steps.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <button className="bg-white text-afterglow-600 hover:bg-warm-50 btn text-lg px-8 py-4 shadow-soft-lg">
                Start Your Reflection
              </button>
            </div>
          </div>
        </Container>
      </section>

      <Footer />
    </div>
  )
}
