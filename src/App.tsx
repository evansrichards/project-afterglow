import { Routes, Route } from 'react-router-dom'
import LandingPage from '@pages/LandingPage'
import UploadPage from '@pages/UploadPage'
import ProcessingPage from '@pages/ProcessingPage'

function App() {
  return (
    <div className="min-h-screen">
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/upload" element={<UploadPage />} />
        <Route path="/processing" element={<ProcessingPage />} />
        {/* Results page to be added in Task 7.3 */}
      </Routes>
    </div>
  )
}

export default App
