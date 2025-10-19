import { useState } from 'react'
import LandingPage from '@pages/LandingPage'
import UploadPage from '@pages/UploadPage'

type Page = 'landing' | 'upload' | 'insights'

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('landing')

  // Simple routing - will be replaced with React Router later
  const navigate = (page: Page) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="min-h-screen">
      {currentPage === 'landing' && <LandingPage onNavigate={() => navigate('upload')} />}
      {currentPage === 'upload' && <UploadPage />}
      {/* Insights pages to be added in future tasks */}
    </div>
  )
}

export default App
