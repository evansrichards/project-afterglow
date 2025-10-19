import { useState } from 'react'
import LandingPage from '@pages/LandingPage'

function App() {
  const [currentPage] = useState<'landing' | 'upload' | 'insights'>('landing')

  return (
    <div className="min-h-screen">
      {currentPage === 'landing' && <LandingPage />}
      {/* Upload and Insights pages to be added in future tasks */}
    </div>
  )
}

export default App
