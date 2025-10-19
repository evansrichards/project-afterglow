/**
 * Schema validation and snapshot utilities
 *
 * Validates parsed data and captures raw schema snapshots for audit trail
 */

import type { ParseResult, ParseError, ParseWarning, SchemaSnapshot } from './types'
import { createParseError, createParseWarning } from './types'
import type { Platform } from '@/types/data-model'

/**
 * Validation rules for each platform
 */
interface ValidationRules {
  platform: Platform
  minMessageCount?: number
  minMatchCount?: number
  requiredMessageFields: string[]
  requiredMatchFields: string[]
  requiredProfileFields: string[]
}

/**
 * Platform-specific validation rules
 */
const VALIDATION_RULES: Record<Platform, ValidationRules> = {
  tinder: {
    platform: 'tinder',
    minMessageCount: 0, // Can have 0 messages if only matches
    minMatchCount: 0, // Can have 0 matches
    requiredMessageFields: ['_id', 'match_id', 'sent_date', 'message', 'from', 'to'],
    requiredMatchFields: ['_id', 'person', 'created_date'],
    requiredProfileFields: ['_id'],
  },
  hinge: {
    platform: 'hinge',
    minMessageCount: 0,
    minMatchCount: 0,
    requiredMessageFields: ['timestamp', 'body'],
    requiredMatchFields: ['match', 'type'],
    requiredProfileFields: [],
  },
}

/**
 * Friendly error messages for common validation failures
 */
const FRIENDLY_MESSAGES: Record<string, (context?: Record<string, unknown>) => string> = {
  MISSING_REQUIRED_FIELD: (ctx) =>
    `Missing required field "${ctx?.field}" in ${ctx?.entity}. This field is essential for processing your data. Please ensure your export file is complete and not corrupted.`,

  LOW_MESSAGE_COUNT: (ctx) =>
    `Found only ${ctx?.actual} message(s), which seems unusually low. Expected at least ${ctx?.expected}. This might indicate an incomplete export or file corruption. Try re-downloading your data from ${ctx?.platform === 'tinder' ? 'Tinder' : 'Hinge'}.`,

  LOW_MATCH_COUNT: (ctx) =>
    `Found only ${ctx?.actual} match(es), which seems unusually low. Expected at least ${ctx?.expected}. This might indicate an incomplete export. Please verify your export includes all your conversation data.`,

  NO_MESSAGES: () =>
    `No messages found in your export. If you've had conversations, this might indicate an incomplete export file. Please try downloading your data again.`,

  NO_MATCHES: () =>
    `No matches found in your export. If you've had matches before, this might indicate an incomplete export file. Please try downloading your data again.`,

  INVALID_TIMESTAMP: (ctx) =>
    `Invalid timestamp found in ${ctx?.entity} at line ${ctx?.line}. The date "${ctx?.value}" couldn't be parsed. This might indicate file corruption.`,

  MISSING_PARTICIPANT: (ctx) =>
    `Message references unknown participant "${ctx?.participantId}". This might indicate data corruption or an incomplete export.`,

  EMPTY_MESSAGE_BODY: (ctx) =>
    `Empty message body found at line ${ctx?.line}. While this might be valid (deleted messages), it's unusual. This message will be included but may affect analysis.`,

  DUPLICATE_ID: (ctx) =>
    `Duplicate ${ctx?.entity} ID "${ctx?.id}" found. This might indicate data corruption. The duplicate entry will be skipped.`,
}

/**
 * Get friendly error message
 */
function getFriendlyMessage(code: string, context?: Record<string, unknown>): string {
  const generator = FRIENDLY_MESSAGES[code]
  if (generator) {
    return generator(context)
  }
  return `Validation error: ${code}`
}

/**
 * Capture schema snapshot from raw data
 */
export function captureSchemaSnapshot(
  rawData: unknown,
  platform: Platform,
  version: string,
): SchemaSnapshot {
  const snapshot: SchemaSnapshot = {
    platform,
    capturedAt: new Date().toISOString(),
    version,
    entities: {},
    unknownFields: {},
  }

  if (!rawData || typeof rawData !== 'object') {
    return snapshot
  }

  const data = rawData as Record<string, unknown>
  const rules = VALIDATION_RULES[platform]

  // Capture message fields
  if (Array.isArray(data.messages) && data.messages.length > 0) {
    const messageFields = new Set<string>()
    const sampleSize = Math.min(10, data.messages.length)

    for (let i = 0; i < sampleSize; i++) {
      const msg = data.messages[i]
      if (msg && typeof msg === 'object') {
        Object.keys(msg).forEach((key) => messageFields.add(key))
      }
    }

    const observedFields = Array.from(messageFields)
    const missingFields = rules.requiredMessageFields.filter((f) => !messageFields.has(f))
    const unknownFields = observedFields.filter((f) => !rules.requiredMessageFields.includes(f))

    snapshot.entities.messages = {
      observedFields,
      sampleCount: sampleSize,
      requiredFields: rules.requiredMessageFields,
      missingFields: missingFields.length > 0 ? missingFields : undefined,
    }

    if (unknownFields.length > 0) {
      snapshot.unknownFields.messages = unknownFields
    }
  }

  // Capture match fields
  if (Array.isArray(data.matches) && data.matches.length > 0) {
    const matchFields = new Set<string>()
    const sampleSize = Math.min(10, data.matches.length)

    for (let i = 0; i < sampleSize; i++) {
      const match = data.matches[i]
      if (match && typeof match === 'object') {
        Object.keys(match).forEach((key) => matchFields.add(key))
      }
    }

    const observedFields = Array.from(matchFields)
    const missingFields = rules.requiredMatchFields.filter((f) => !matchFields.has(f))
    const unknownFields = observedFields.filter((f) => !rules.requiredMatchFields.includes(f))

    snapshot.entities.matches = {
      observedFields,
      sampleCount: sampleSize,
      requiredFields: rules.requiredMatchFields,
      missingFields: missingFields.length > 0 ? missingFields : undefined,
    }

    if (unknownFields.length > 0) {
      snapshot.unknownFields.matches = unknownFields
    }
  }

  return snapshot
}

/**
 * Validate parse result against platform rules
 */
export function validateParseResult(result: ParseResult): {
  errors: ParseError[]
  warnings: ParseWarning[]
} {
  const errors: ParseError[] = []
  const warnings: ParseWarning[] = []

  if (!result.success || !result.data || !result.metadata) {
    return { errors, warnings }
  }

  const { data, metadata } = result
  const rules = VALIDATION_RULES[metadata.platform]

  // Validate message count
  if (
    rules.minMessageCount !== undefined &&
    data.messages.length < rules.minMessageCount &&
    data.messages.length > 0
  ) {
    warnings.push(
      createParseWarning('LOW_MESSAGE_COUNT', getFriendlyMessage('LOW_MESSAGE_COUNT', {
        actual: data.messages.length,
        expected: rules.minMessageCount,
        platform: metadata.platform,
      }), {
        context: {
          actual: data.messages.length,
          expected: rules.minMessageCount,
        },
      }),
    )
  }

  // Warn if no messages at all
  if (data.messages.length === 0) {
    warnings.push(
      createParseWarning('NO_MESSAGES', getFriendlyMessage('NO_MESSAGES'), {
        context: { platform: metadata.platform },
      }),
    )
  }

  // Validate match count
  if (
    rules.minMatchCount !== undefined &&
    data.matches.length < rules.minMatchCount &&
    data.matches.length > 0
  ) {
    warnings.push(
      createParseWarning('LOW_MATCH_COUNT', getFriendlyMessage('LOW_MATCH_COUNT', {
        actual: data.matches.length,
        expected: rules.minMatchCount,
        platform: metadata.platform,
      }), {
        context: {
          actual: data.matches.length,
          expected: rules.minMatchCount,
        },
      }),
    )
  }

  // Warn if no matches at all
  if (data.matches.length === 0) {
    warnings.push(
      createParseWarning('NO_MATCHES', getFriendlyMessage('NO_MATCHES'), {
        context: { platform: metadata.platform },
      }),
    )
  }

  // Validate timestamps in messages
  const seenMessageIds = new Set<string>()
  data.messages.forEach((msg, idx) => {
    // Check for duplicate IDs
    if (seenMessageIds.has(msg.id)) {
      errors.push(
        createParseError('DUPLICATE_ID', getFriendlyMessage('DUPLICATE_ID', {
          entity: 'message',
          id: msg.id,
        }), {
          severity: 'error',
          line: idx + 1,
          context: { id: msg.id },
        }),
      )
    }
    seenMessageIds.add(msg.id)

    // Check timestamp validity
    const timestamp = new Date(msg.sentAt)
    if (isNaN(timestamp.getTime())) {
      errors.push(
        createParseError('INVALID_TIMESTAMP', getFriendlyMessage('INVALID_TIMESTAMP', {
          entity: 'message',
          line: idx + 1,
          value: msg.sentAt,
        }), {
          severity: 'error',
          field: 'sentAt',
          line: idx + 1,
          context: { value: msg.sentAt },
        }),
      )
    }

    // Warn about empty message bodies
    if (!msg.body || msg.body.trim() === '') {
      warnings.push(
        createParseWarning('EMPTY_MESSAGE_BODY', getFriendlyMessage('EMPTY_MESSAGE_BODY', {
          line: idx + 1,
        }), {
          line: idx + 1,
        }),
      )
    }

    // Check if sender exists in participants
    const senderExists = data.participants.some((p) => p.id === msg.senderId)
    if (!senderExists) {
      errors.push(
        createParseError('MISSING_PARTICIPANT', getFriendlyMessage('MISSING_PARTICIPANT', {
          participantId: msg.senderId,
        }), {
          severity: 'error',
          field: 'senderId',
          line: idx + 1,
          context: { participantId: msg.senderId },
        }),
      )
    }
  })

  // Validate timestamps in matches
  const seenMatchIds = new Set<string>()
  data.matches.forEach((match, idx) => {
    // Check for duplicate IDs
    if (seenMatchIds.has(match.id)) {
      errors.push(
        createParseError('DUPLICATE_ID', getFriendlyMessage('DUPLICATE_ID', {
          entity: 'match',
          id: match.id,
        }), {
          severity: 'error',
          line: idx + 1,
          context: { id: match.id },
        }),
      )
    }
    seenMatchIds.add(match.id)

    // Check createdAt timestamp
    const createdAt = new Date(match.createdAt)
    if (isNaN(createdAt.getTime())) {
      errors.push(
        createParseError('INVALID_TIMESTAMP', getFriendlyMessage('INVALID_TIMESTAMP', {
          entity: 'match',
          line: idx + 1,
          value: match.createdAt,
        }), {
          severity: 'error',
          field: 'createdAt',
          line: idx + 1,
          context: { value: match.createdAt },
        }),
      )
    }

    // Check closedAt timestamp if present
    if (match.closedAt) {
      const closedAt = new Date(match.closedAt)
      if (isNaN(closedAt.getTime())) {
        errors.push(
          createParseError('INVALID_TIMESTAMP', getFriendlyMessage('INVALID_TIMESTAMP', {
            entity: 'match',
            line: idx + 1,
            value: match.closedAt,
          }), {
            severity: 'error',
            field: 'closedAt',
            line: idx + 1,
            context: { value: match.closedAt },
          }),
        )
      }
    }

    // Validate participants exist
    match.participants.forEach((participantId) => {
      const participantExists = data.participants.some((p) => p.id === participantId)
      if (!participantExists) {
        errors.push(
          createParseError('MISSING_PARTICIPANT', getFriendlyMessage('MISSING_PARTICIPANT', {
            participantId,
          }), {
            severity: 'error',
            field: 'participants',
            line: idx + 1,
            context: { participantId },
          }),
        )
      }
    })
  })

  return { errors, warnings }
}

/**
 * Validate raw data structure before parsing
 */
export function validateRawSchema(
  rawData: unknown,
  platform: Platform,
): {
  valid: boolean
  errors: ParseError[]
  warnings: ParseWarning[]
  snapshot: SchemaSnapshot
} {
  const errors: ParseError[] = []
  const warnings: ParseWarning[] = []
  const snapshot = captureSchemaSnapshot(rawData, platform, '1.0.0')

  if (!rawData || typeof rawData !== 'object') {
    errors.push(
      createParseError('INVALID_DATA_TYPE', 'Data must be a valid object', {
        severity: 'critical',
      }),
    )
    return { valid: false, errors, warnings, snapshot }
  }

  const data = rawData as Record<string, unknown>

  // Check that at least messages or matches exists
  if (data.messages === undefined && data.matches === undefined) {
    errors.push(
      createParseError('MISSING_DATA', 'Data must contain at least "messages" or "matches" field. Your export appears to be empty or incomplete.', {
        severity: 'critical',
      }),
    )
  }

  // Check for messages array
  if (data.messages !== undefined && !Array.isArray(data.messages)) {
    errors.push(
      createParseError('INVALID_MESSAGES_TYPE', 'Messages must be an array', {
        severity: 'critical',
        field: 'messages',
      }),
    )
  }

  // Check for matches array
  if (data.matches !== undefined && !Array.isArray(data.matches)) {
    errors.push(
      createParseError('INVALID_MATCHES_TYPE', 'Matches must be an array', {
        severity: 'critical',
        field: 'matches',
      }),
    )
  }

  // Check for required message fields in snapshot
  if (snapshot.entities.messages?.missingFields && snapshot.entities.messages.missingFields.length > 0) {
    snapshot.entities.messages.missingFields.forEach((field) => {
      errors.push(
        createParseError('MISSING_REQUIRED_FIELD', getFriendlyMessage('MISSING_REQUIRED_FIELD', {
          field,
          entity: 'messages',
        }), {
          severity: 'critical',
          field,
          context: { entity: 'messages', field },
        }),
      )
    })
  }

  // Check for required match fields in snapshot
  if (snapshot.entities.matches?.missingFields && snapshot.entities.matches.missingFields.length > 0) {
    snapshot.entities.matches.missingFields.forEach((field) => {
      errors.push(
        createParseError('MISSING_REQUIRED_FIELD', getFriendlyMessage('MISSING_REQUIRED_FIELD', {
          field,
          entity: 'matches',
        }), {
          severity: 'critical',
          field,
          context: { entity: 'matches', field },
        }),
      )
    })
  }

  // Log unknown fields as warnings
  Object.entries(snapshot.unknownFields).forEach(([entity, fields]) => {
    if (fields.length > 0) {
      warnings.push(
        createParseWarning('UNKNOWN_FIELDS', `Found ${fields.length} unknown field(s) in ${entity}: ${fields.join(', ')}. These will be captured in CustomAttribute metadata.`, {
          context: { entity, fields },
        }),
      )
    }
  })

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    snapshot,
  }
}
