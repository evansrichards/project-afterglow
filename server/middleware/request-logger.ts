/**
 * Request logging middleware
 *
 * Logs all incoming requests for debugging and monitoring
 */

import type { Request, Response, NextFunction } from 'express'

export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now()

  // Log when response finishes
  res.on('finish', () => {
    const duration = Date.now() - start
    const logLine = `${req.method} ${req.path} ${res.statusCode} - ${duration}ms`

    if (res.statusCode >= 400) {
      console.error(`❌ ${logLine}`)
    } else {
      console.log(`✅ ${logLine}`)
    }
  })

  next()
}
