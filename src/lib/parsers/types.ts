/**
 * Parser types and utilities for dating app data exports
 */

import type {
  ParticipantProfile,
  MatchContext,
  NormalizedMessage,
  RawRecord,
  Platform,
} from '@/types/data-model'

/**
 * Schema snapshot - captures observed fields in raw data for auditing
 */
export interface SchemaSnapshot {
  platform: Platform
  capturedAt: string
  version: string
  entities: {
    matches?: {
      observedFields: string[]
      sampleCount: number
      requiredFields: string[]
      missingFields?: string[]
    }
    messages?: {
      observedFields: string[]
      sampleCount: number
      requiredFields: string[]
      missingFields?: string[]
    }
    profiles?: {
      observedFields: string[]
      sampleCount: number
      requiredFields: string[]
      missingFields?: string[]
    }
  }
  unknownFields: Record<string, string[]> // entity -> field names
}

/**
 * Result of parsing operation
 */
export interface ParseResult {
  success: boolean
  data?: {
    participants: ParticipantProfile[]
    matches: MatchContext[]
    messages: NormalizedMessage[]
    rawRecords: RawRecord[]
  }
  metadata?: {
    platform: Platform
    parserVersion: string
    messageCount: number
    matchCount: number
    participantCount: number
    dateRange?: {
      earliest: string
      latest: string
    }
  }
  schemaSnapshot?: SchemaSnapshot
  errors?: ParseError[]
  warnings?: ParseWarning[]
}

/**
 * Parse error with context
 */
export interface ParseError {
  code: string
  message: string
  field?: string
  line?: number
  severity: 'error' | 'critical'
  context?: Record<string, unknown>
}

/**
 * Parse warning for non-critical issues
 */
export interface ParseWarning {
  code: string
  message: string
  field?: string
  line?: number
  context?: Record<string, unknown>
}

/**
 * Parser interface for platform-specific implementations
 */
export interface DataParser {
  /** Platform this parser handles */
  platform: Platform

  /** Parser version for tracking schema changes */
  version: string

  /** Parse content and return normalized data */
  parse(content: string, filename: string): Promise<ParseResult>

  /** Validate content structure before parsing */
  validate(content: string): { valid: boolean; errors: ParseError[] }
}

/**
 * Helper to create parse errors
 */
export function createParseError(
  code: string,
  message: string,
  options?: Partial<Omit<ParseError, 'code' | 'message'>>,
): ParseError {
  return {
    code,
    message,
    severity: options?.severity || 'error',
    field: options?.field,
    line: options?.line,
    context: options?.context,
  }
}

/**
 * Helper to create parse warnings
 */
export function createParseWarning(
  code: string,
  message: string,
  options?: Partial<Omit<ParseWarning, 'code' | 'message'>>,
): ParseWarning {
  return {
    code,
    message,
    ...options,
  }
}

/**
 * Calculate date range from messages
 */
export function calculateDateRange(messages: NormalizedMessage[]): {
  earliest: string
  latest: string
} | undefined {
  if (messages.length === 0) return undefined

  const dates = messages.map((m) => new Date(m.sentAt).getTime()).filter((d) => !isNaN(d))

  if (dates.length === 0) return undefined

  const earliest = new Date(Math.min(...dates)).toISOString()
  const latest = new Date(Math.max(...dates)).toISOString()

  return { earliest, latest }
}
