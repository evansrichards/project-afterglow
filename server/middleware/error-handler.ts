/**
 * Error handling middleware
 *
 * Catches and formats errors for API responses
 */

import type { Request, Response, NextFunction } from 'express'

export interface ApiError extends Error {
  statusCode?: number
  code?: string
}

export function errorHandler(
  err: ApiError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  const statusCode = err.statusCode || 500
  const message = err.message || 'Internal server error'

  console.error('API Error:', {
    statusCode,
    message,
    code: err.code,
    stack: err.stack,
  })

  res.status(statusCode).json({
    error: {
      message,
      code: err.code || 'INTERNAL_ERROR',
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    },
  })
}

export function createError(message: string, statusCode: number = 500, code?: string): ApiError {
  const error = new Error(message) as ApiError
  error.statusCode = statusCode
  error.code = code
  return error
}
