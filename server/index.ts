/**
 * Backend API Server
 *
 * Express server that provides API endpoints for analysis
 * Runs alongside Vite dev server during development
 */

import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { errorHandler } from './middleware/error-handler'
import { requestLogger } from './middleware/request-logger'
import analyzeRouter from './routes/analyze'

// Load environment variables
dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
}))
app.use(express.json({ limit: '50mb' })) // Allow large payloads for parsed data
app.use(requestLogger)

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// API routes
app.use('/api', analyzeRouter)

// Error handling (must be last)
app.use(errorHandler)

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Backend API server running on http://localhost:${PORT}`)
  console.log(`📊 Health check: http://localhost:${PORT}/health`)
  console.log(`🔬 Analysis endpoint: http://localhost:${PORT}/api/analyze`)
})

export default app
