import { Routes, Route } from 'react-router-dom'
import LandingPage from '@pages/LandingPage'
import UploadPage from '@pages/UploadPage'

function App() {
  return (
    <div className="min-h-screen">
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/upload" element={<UploadPage />} />
        {/* Insights pages to be added in future tasks */}
      </Routes>
    </div>
  )
}

export default App
