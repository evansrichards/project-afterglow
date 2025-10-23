import { Routes, Route } from 'react-router-dom'
import LandingPage from '@pages/LandingPage'
import UploadPage from '@pages/UploadPage'
import ProcessingPage from '@pages/ProcessingPage'
import ResultsPage from '@pages/ResultsPage'

function App() {
  return (
    <div className="min-h-screen">
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/upload" element={<UploadPage />} />
        <Route path="/processing" element={<ProcessingPage />} />
        <Route path="/results" element={<ResultsPage />} />
      </Routes>
    </div>
  )
}

export default App
