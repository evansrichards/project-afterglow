/**
 * Tests for schema validation and snapshot utilities
 */

import { describe, it, expect } from 'vitest'
import {
  captureSchemaSnapshot,
  validateParseResult,
  validateRawSchema,
} from './validation'
import type { ParseResult } from './types'

describe('captureSchemaSnapshot', () => {
  it('captures message fields from Tinder data', () => {
    const rawData = {
      messages: [
        {
          _id: '1',
          match_id: 'm1',
          sent_date: '2023-01-01',
          message: 'Hello',
          from: 'user1',
          to: 'user2',
        },
        {
          _id: '2',
          match_id: 'm1',
          sent_date: '2023-01-02',
          message: 'Hi',
          from: 'user2',
          to: 'user1',
          reactions: [],
        },
      ],
    }

    const snapshot = captureSchemaSnapshot(rawData, 'tinder', '1.0.0')

    expect(snapshot.platform).toBe('tinder')
    expect(snapshot.version).toBe('1.0.0')
    expect(snapshot.entities.messages).toBeDefined()
    expect(snapshot.entities.messages?.observedFields).toContain('_id')
    expect(snapshot.entities.messages?.observedFields).toContain('match_id')
    expect(snapshot.entities.messages?.observedFields).toContain('sent_date')
    expect(snapshot.entities.messages?.observedFields).toContain('message')
    expect(snapshot.entities.messages?.observedFields).toContain('from')
    expect(snapshot.entities.messages?.observedFields).toContain('to')
  })

  it('captures match fields from Tinder data', () => {
    const rawData = {
      matches: [
        {
          _id: 'm1',
          person: { _id: 'p1', name: 'Alice' },
          created_date: '2023-01-01',
        },
      ],
    }

    const snapshot = captureSchemaSnapshot(rawData, 'tinder', '1.0.0')

    expect(snapshot.entities.matches).toBeDefined()
    expect(snapshot.entities.matches?.observedFields).toContain('_id')
    expect(snapshot.entities.matches?.observedFields).toContain('person')
    expect(snapshot.entities.matches?.observedFields).toContain('created_date')
  })

  it('identifies missing required fields', () => {
    const rawData = {
      messages: [
        {
          _id: '1',
          // Missing: match_id, sent_date, message, from, to
        },
      ],
    }

    const snapshot = captureSchemaSnapshot(rawData, 'tinder', '1.0.0')

    expect(snapshot.entities.messages?.missingFields).toBeDefined()
    expect(snapshot.entities.messages?.missingFields).toContain('match_id')
    expect(snapshot.entities.messages?.missingFields).toContain('sent_date')
    expect(snapshot.entities.messages?.missingFields).toContain('message')
  })

  it('identifies unknown fields', () => {
    const rawData = {
      messages: [
        {
          _id: '1',
          match_id: 'm1',
          sent_date: '2023-01-01',
          message: 'Hello',
          from: 'user1',
          to: 'user2',
          custom_field: 'value', // Unknown field
          another_unknown: 123,
        },
      ],
    }

    const snapshot = captureSchemaSnapshot(rawData, 'tinder', '1.0.0')

    expect(snapshot.unknownFields.messages).toBeDefined()
    expect(snapshot.unknownFields.messages).toContain('custom_field')
    expect(snapshot.unknownFields.messages).toContain('another_unknown')
  })

  it('handles empty data', () => {
    const snapshot = captureSchemaSnapshot({}, 'tinder', '1.0.0')

    expect(snapshot.entities).toEqual({})
    expect(snapshot.unknownFields).toEqual({})
  })

  it('handles null/undefined data', () => {
    const snapshot1 = captureSchemaSnapshot(null, 'tinder', '1.0.0')
    const snapshot2 = captureSchemaSnapshot(undefined, 'tinder', '1.0.0')

    expect(snapshot1.entities).toEqual({})
    expect(snapshot2.entities).toEqual({})
  })
})

describe('validateRawSchema', () => {
  it('passes validation for valid Tinder data', () => {
    const rawData = {
      messages: [
        {
          _id: '1',
          match_id: 'm1',
          sent_date: '2023-01-01',
          message: 'Hello',
          from: 'user1',
          to: 'user2',
        },
      ],
      matches: [
        {
          _id: 'm1',
          person: { _id: 'p1' },
          created_date: '2023-01-01',
        },
      ],
    }

    const result = validateRawSchema(rawData, 'tinder')

    expect(result.valid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('fails validation for missing required message fields', () => {
    const rawData = {
      messages: [
        {
          _id: '1',
          // Missing required fields
        },
      ],
    }

    const result = validateRawSchema(rawData, 'tinder')

    expect(result.valid).toBe(false)
    expect(result.errors.length).toBeGreaterThan(0)
    expect(result.errors[0].code).toBe('MISSING_REQUIRED_FIELD')
    expect(result.errors[0].message).toContain('Missing required field')
  })

  it('fails validation for invalid messages type', () => {
    const rawData = {
      messages: 'not an array',
    }

    const result = validateRawSchema(rawData, 'tinder')

    expect(result.valid).toBe(false)
    expect(result.errors.some((e) => e.code === 'INVALID_MESSAGES_TYPE')).toBe(true)
  })

  it('warns about unknown fields', () => {
    const rawData = {
      messages: [
        {
          _id: '1',
          match_id: 'm1',
          sent_date: '2023-01-01',
          message: 'Hello',
          from: 'user1',
          to: 'user2',
          unknown_field: 'value',
        },
      ],
    }

    const result = validateRawSchema(rawData, 'tinder')

    expect(result.warnings.length).toBeGreaterThan(0)
    expect(result.warnings.some((w) => w.code === 'UNKNOWN_FIELDS')).toBe(true)
    expect(result.warnings[0].message).toContain('unknown_field')
  })
})

describe('validateParseResult', () => {
  it('passes validation for valid parse result', () => {
    const parseResult: ParseResult = {
      success: true,
      data: {
        participants: [
          { id: 'user1', platform: 'tinder', isUser: true },
          { id: 'user2', platform: 'tinder', isUser: false },
        ],
        matches: [
          {
            id: 'm1',
            platform: 'tinder',
            createdAt: '2023-01-01T00:00:00Z',
            status: 'active',
            participants: ['user1', 'user2'],
            attributes: {},
          },
        ],
        messages: [
          {
            id: 'msg1',
            matchId: 'm1',
            senderId: 'user1',
            sentAt: '2023-01-01T10:00:00Z',
            body: 'Hello',
            direction: 'user',
          },
        ],
        rawRecords: [],
      },
      metadata: {
        platform: 'tinder',
        parserVersion: '1.0.0',
        messageCount: 1,
        matchCount: 1,
        participantCount: 2,
      },
    }

    const result = validateParseResult(parseResult)

    expect(result.errors).toHaveLength(0)
    expect(result.warnings).toHaveLength(0)
  })

  it('warns about no messages', () => {
    const parseResult: ParseResult = {
      success: true,
      data: {
        participants: [],
        matches: [],
        messages: [],
        rawRecords: [],
      },
      metadata: {
        platform: 'tinder',
        parserVersion: '1.0.0',
        messageCount: 0,
        matchCount: 0,
        participantCount: 0,
      },
    }

    const result = validateParseResult(parseResult)

    expect(result.warnings.some((w) => w.code === 'NO_MESSAGES')).toBe(true)
    expect(result.warnings.some((w) => w.code === 'NO_MATCHES')).toBe(true)
  })

  it('detects invalid timestamps in messages', () => {
    const parseResult: ParseResult = {
      success: true,
      data: {
        participants: [{ id: 'user1', platform: 'tinder', isUser: true }],
        matches: [],
        messages: [
          {
            id: 'msg1',
            matchId: 'm1',
            senderId: 'user1',
            sentAt: 'invalid-date',
            body: 'Hello',
            direction: 'user',
          },
        ],
        rawRecords: [],
      },
      metadata: {
        platform: 'tinder',
        parserVersion: '1.0.0',
        messageCount: 1,
        matchCount: 0,
        participantCount: 1,
      },
    }

    const result = validateParseResult(parseResult)

    expect(result.errors.some((e) => e.code === 'INVALID_TIMESTAMP')).toBe(true)
    expect(result.errors[0].message).toContain('invalid-date')
  })

  it('detects missing participants', () => {
    const parseResult: ParseResult = {
      success: true,
      data: {
        participants: [{ id: 'user1', platform: 'tinder', isUser: true }],
        matches: [],
        messages: [
          {
            id: 'msg1',
            matchId: 'm1',
            senderId: 'unknown_sender', // This participant doesn't exist
            sentAt: '2023-01-01T10:00:00Z',
            body: 'Hello',
            direction: 'user',
          },
        ],
        rawRecords: [],
      },
      metadata: {
        platform: 'tinder',
        parserVersion: '1.0.0',
        messageCount: 1,
        matchCount: 0,
        participantCount: 1,
      },
    }

    const result = validateParseResult(parseResult)

    expect(result.errors.some((e) => e.code === 'MISSING_PARTICIPANT')).toBe(true)
    expect(result.errors[0].message).toContain('unknown_sender')
  })

  it('detects duplicate message IDs', () => {
    const parseResult: ParseResult = {
      success: true,
      data: {
        participants: [{ id: 'user1', platform: 'tinder', isUser: true }],
        matches: [],
        messages: [
          {
            id: 'msg1',
            matchId: 'm1',
            senderId: 'user1',
            sentAt: '2023-01-01T10:00:00Z',
            body: 'Hello',
            direction: 'user',
          },
          {
            id: 'msg1', // Duplicate ID
            matchId: 'm1',
            senderId: 'user1',
            sentAt: '2023-01-01T10:01:00Z',
            body: 'World',
            direction: 'user',
          },
        ],
        rawRecords: [],
      },
      metadata: {
        platform: 'tinder',
        parserVersion: '1.0.0',
        messageCount: 2,
        matchCount: 0,
        participantCount: 1,
      },
    }

    const result = validateParseResult(parseResult)

    expect(result.errors.some((e) => e.code === 'DUPLICATE_ID')).toBe(true)
    expect(result.errors[0].message).toContain('msg1')
  })

  it('warns about empty message bodies', () => {
    const parseResult: ParseResult = {
      success: true,
      data: {
        participants: [{ id: 'user1', platform: 'tinder', isUser: true }],
        matches: [],
        messages: [
          {
            id: 'msg1',
            matchId: 'm1',
            senderId: 'user1',
            sentAt: '2023-01-01T10:00:00Z',
            body: '',
            direction: 'user',
          },
        ],
        rawRecords: [],
      },
      metadata: {
        platform: 'tinder',
        parserVersion: '1.0.0',
        messageCount: 1,
        matchCount: 0,
        participantCount: 1,
      },
    }

    const result = validateParseResult(parseResult)

    expect(result.warnings.some((w) => w.code === 'EMPTY_MESSAGE_BODY')).toBe(true)
  })

  it('validates match timestamps', () => {
    const parseResult: ParseResult = {
      success: true,
      data: {
        participants: [
          { id: 'user1', platform: 'tinder', isUser: true },
          { id: 'user2', platform: 'tinder', isUser: false },
        ],
        matches: [
          {
            id: 'm1',
            platform: 'tinder',
            createdAt: 'invalid-date',
            status: 'active',
            participants: ['user1', 'user2'],
            attributes: {},
          },
        ],
        messages: [],
        rawRecords: [],
      },
      metadata: {
        platform: 'tinder',
        parserVersion: '1.0.0',
        messageCount: 0,
        matchCount: 1,
        participantCount: 2,
      },
    }

    const result = validateParseResult(parseResult)

    expect(result.errors.some((e) => e.code === 'INVALID_TIMESTAMP')).toBe(true)
    expect(result.errors.some((e) => e.field === 'createdAt')).toBe(true)
  })

  it('validates match participants exist', () => {
    const parseResult: ParseResult = {
      success: true,
      data: {
        participants: [{ id: 'user1', platform: 'tinder', isUser: true }],
        matches: [
          {
            id: 'm1',
            platform: 'tinder',
            createdAt: '2023-01-01T00:00:00Z',
            status: 'active',
            participants: ['user1', 'unknown_user'], // unknown_user doesn't exist
            attributes: {},
          },
        ],
        messages: [],
        rawRecords: [],
      },
      metadata: {
        platform: 'tinder',
        parserVersion: '1.0.0',
        messageCount: 0,
        matchCount: 1,
        participantCount: 1,
      },
    }

    const result = validateParseResult(parseResult)

    expect(result.errors.some((e) => e.code === 'MISSING_PARTICIPANT')).toBe(true)
    expect(result.errors[0].message).toContain('unknown_user')
  })

  it('handles unsuccessful parse results gracefully', () => {
    const parseResult: ParseResult = {
      success: false,
      errors: [{ code: 'PARSE_ERROR', message: 'Failed to parse', severity: 'critical' }],
    }

    const result = validateParseResult(parseResult)

    // Should not add more errors when parse already failed
    expect(result.errors).toHaveLength(0)
    expect(result.warnings).toHaveLength(0)
  })
})
