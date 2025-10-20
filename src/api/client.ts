/**
 * API Client
 *
 * Frontend client for communicating with backend API
 */

import type { AnalyzeRequest, AnalyzeResponse, ErrorResponse } from '../../server/types/api'

/**
 * API client configuration
 */
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'

/**
 * Custom error class for API errors
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public code?: string
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

/**
 * Analyze dating app data
 *
 * @param data - Parsed dating app data
 * @returns Analysis results from two-stage orchestrator
 */
export async function analyzeData(data: AnalyzeRequest): Promise<AnalyzeResponse> {
  const url = `${API_BASE_URL}/api/analyze`

  // Debug logging
  console.log('📤 API Client - Sending request to:', url)
  console.log('📤 API Client - Data keys:', Object.keys(data))
  console.log('📤 API Client - Data:', {
    messages: data.messages?.length,
    matches: data.matches?.length,
    participants: data.participants?.length,
    userId: data.userId,
    platform: data.platform,
  })

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })

    const responseData = await response.json()

    if (!response.ok) {
      const error = responseData as ErrorResponse
      throw new ApiError(
        error.error.message || 'Analysis failed',
        response.status,
        error.error.code
      )
    }

    return responseData as AnalyzeResponse
  } catch (error) {
    // Re-throw ApiErrors as-is
    if (error instanceof ApiError) {
      throw error
    }

    // Network errors or other failures
    if (error instanceof Error) {
      throw new ApiError(
        `Network error: ${error.message}`,
        0,
        'NETWORK_ERROR'
      )
    }

    // Unknown errors
    throw new ApiError('Unknown error occurred', 0, 'UNKNOWN_ERROR')
  }
}

/**
 * Health check endpoint
 *
 * @returns Health status
 */
export async function checkHealth(): Promise<{ status: string; timestamp: string }> {
  const url = `${API_BASE_URL}/health`

  try {
    const response = await fetch(url)

    if (!response.ok) {
      throw new ApiError('Health check failed', response.status)
    }

    return await response.json()
  } catch (error) {
    if (error instanceof ApiError) {
      throw error
    }

    if (error instanceof Error) {
      throw new ApiError(
        `Network error: ${error.message}`,
        0,
        'NETWORK_ERROR'
      )
    }

    throw new ApiError('Unknown error occurred', 0, 'UNKNOWN_ERROR')
  }
}
