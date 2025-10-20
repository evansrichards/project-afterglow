/**
 * Request validation middleware
 *
 * Validates request payloads against schemas
 */

import type { Request, Response, NextFunction } from 'express'
import { createError } from './error-handler'

export type ValidationSchema = {
  body?: Record<string, {
    type: 'string' | 'number' | 'boolean' | 'array' | 'object'
    required?: boolean
    minLength?: number
    maxLength?: number
    min?: number
    max?: number
  }>
  query?: Record<string, {
    type: 'string' | 'number' | 'boolean'
    required?: boolean
  }>
  params?: Record<string, {
    type: 'string' | 'number'
    required?: boolean
  }>
}

export function validateRequest(schema: ValidationSchema) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      // Validate body
      if (schema.body) {
        for (const [key, rules] of Object.entries(schema.body)) {
          const value = req.body?.[key]

          if (rules.required && value === undefined) {
            throw createError(`Missing required field: ${key}`, 400, 'VALIDATION_ERROR')
          }

          if (value !== undefined) {
            // Type validation
            const actualType = Array.isArray(value) ? 'array' : typeof value
            if (actualType !== rules.type) {
              throw createError(
                `Invalid type for ${key}: expected ${rules.type}, got ${actualType}`,
                400,
                'VALIDATION_ERROR'
              )
            }

            // String validations
            if (rules.type === 'string' && typeof value === 'string') {
              if (rules.minLength && value.length < rules.minLength) {
                throw createError(
                  `${key} must be at least ${rules.minLength} characters`,
                  400,
                  'VALIDATION_ERROR'
                )
              }
              if (rules.maxLength && value.length > rules.maxLength) {
                throw createError(
                  `${key} must be at most ${rules.maxLength} characters`,
                  400,
                  'VALIDATION_ERROR'
                )
              }
            }

            // Number validations
            if (rules.type === 'number' && typeof value === 'number') {
              if (rules.min !== undefined && value < rules.min) {
                throw createError(
                  `${key} must be at least ${rules.min}`,
                  400,
                  'VALIDATION_ERROR'
                )
              }
              if (rules.max !== undefined && value > rules.max) {
                throw createError(
                  `${key} must be at most ${rules.max}`,
                  400,
                  'VALIDATION_ERROR'
                )
              }
            }

            // Array validations
            if (rules.type === 'array' && Array.isArray(value)) {
              if (rules.minLength && value.length < rules.minLength) {
                throw createError(
                  `${key} must have at least ${rules.minLength} items`,
                  400,
                  'VALIDATION_ERROR'
                )
              }
              if (rules.maxLength && value.length > rules.maxLength) {
                throw createError(
                  `${key} must have at most ${rules.maxLength} items`,
                  400,
                  'VALIDATION_ERROR'
                )
              }
            }
          }
        }
      }

      next()
    } catch (error) {
      next(error)
    }
  }
}
