/**
 * Tests for custom attribute extraction and schema diff functionality
 */

import { describe, it, expect } from 'vitest'
import { extractUnknownFields, compareSchemas } from './validation'
import type { SchemaSnapshot } from './types'

describe('extractUnknownFields', () => {
  it('extracts simple string fields', () => {
    const rawData = {
      known_field: 'value1',
      unknown_field: 'value2',
      another_unknown: 'value3',
    }

    const result = extractUnknownFields(rawData, ['known_field'])

    expect(result).toEqual({
      unknown_field: 'value2',
      another_unknown: 'value3',
    })
  })

  it('extracts number fields', () => {
    const rawData = {
      known_field: 'value',
      score: 95,
      count: 10,
    }

    const result = extractUnknownFields(rawData, ['known_field'])

    expect(result).toEqual({
      score: 95,
      count: 10,
    })
  })

  it('extracts boolean fields', () => {
    const rawData = {
      known_field: 'value',
      is_verified: true,
      is_active: false,
    }

    const result = extractUnknownFields(rawData, ['known_field'])

    expect(result).toEqual({
      is_verified: true,
      is_active: false,
    })
  })

  it('handles null values', () => {
    const rawData = {
      known_field: 'value',
      nullable_field: null,
    }

    const result = extractUnknownFields(rawData, ['known_field'])

    expect(result).toEqual({
      nullable_field: null,
    })
  })

  it('extracts string arrays', () => {
    const rawData = {
      known_field: 'value',
      tags: ['tag1', 'tag2', 'tag3'],
    }

    const result = extractUnknownFields(rawData, ['known_field'])

    expect(result).toEqual({
      tags: ['tag1', 'tag2', 'tag3'],
    })
  })

  it('extracts number arrays', () => {
    const rawData = {
      known_field: 'value',
      scores: [1, 2, 3, 4, 5],
    }

    const result = extractUnknownFields(rawData, ['known_field'])

    expect(result).toEqual({
      scores: [1, 2, 3, 4, 5],
    })
  })

  it('converts complex arrays to JSON strings', () => {
    const rawData = {
      known_field: 'value',
      mixed_array: [1, 'two', true],
      object_array: [{ id: 1 }, { id: 2 }],
    }

    const result = extractUnknownFields(rawData, ['known_field'])

    expect(result).toEqual({
      mixed_array: JSON.stringify([1, 'two', true]),
      object_array: JSON.stringify([{ id: 1 }, { id: 2 }]),
    })
  })

  it('converts complex objects to JSON strings', () => {
    const rawData = {
      known_field: 'value',
      nested_object: { foo: 'bar', baz: 123 },
    }

    const result = extractUnknownFields(rawData, ['known_field'])

    expect(result).toEqual({
      nested_object: JSON.stringify({ foo: 'bar', baz: 123 }),
    })
  })

  it('returns undefined when no unknown fields', () => {
    const rawData = {
      field1: 'value1',
      field2: 'value2',
    }

    const result = extractUnknownFields(rawData, ['field1', 'field2'])

    expect(result).toBeUndefined()
  })

  it('handles empty object', () => {
    const result = extractUnknownFields({}, ['field1'])

    expect(result).toBeUndefined()
  })
})

describe('compareSchemas', () => {
  it('detects added message fields', () => {
    const oldSnapshot: SchemaSnapshot = {
      platform: 'tinder',
      version: '1.0.0',
      capturedAt: '2024-01-01T00:00:00Z',
      entities: {
        messages: {
          observedFields: ['_id', 'match_id', 'sent_date', 'message'],
          sampleCount: 10,
          requiredFields: ['_id', 'match_id', 'sent_date', 'message'],
        },
      },
      unknownFields: {},
    }

    const newSnapshot: SchemaSnapshot = {
      platform: 'tinder',
      version: '1.1.0',
      capturedAt: '2024-02-01T00:00:00Z',
      entities: {
        messages: {
          observedFields: ['_id', 'match_id', 'sent_date', 'message', 'liked', 'read_at'],
          sampleCount: 10,
          requiredFields: ['_id', 'match_id', 'sent_date', 'message'],
        },
      },
      unknownFields: {},
    }

    const diff = compareSchemas(oldSnapshot, newSnapshot)

    expect(diff).not.toBeNull()
    expect(diff?.platform).toBe('tinder')
    expect(diff?.fromVersion).toBe('1.0.0')
    expect(diff?.toVersion).toBe('1.1.0')
    expect(diff?.changes.messages?.addedFields).toEqual(['liked', 'read_at'])
    expect(diff?.changes.messages?.removedFields).toEqual([])
  })

  it('detects removed message fields', () => {
    const oldSnapshot: SchemaSnapshot = {
      platform: 'tinder',
      version: '1.0.0',
      capturedAt: '2024-01-01T00:00:00Z',
      entities: {
        messages: {
          observedFields: ['_id', 'match_id', 'sent_date', 'message', 'liked', 'deprecated_field'],
          sampleCount: 10,
          requiredFields: ['_id', 'match_id', 'sent_date', 'message'],
        },
      },
      unknownFields: {},
    }

    const newSnapshot: SchemaSnapshot = {
      platform: 'tinder',
      version: '1.1.0',
      capturedAt: '2024-02-01T00:00:00Z',
      entities: {
        messages: {
          observedFields: ['_id', 'match_id', 'sent_date', 'message', 'liked'],
          sampleCount: 10,
          requiredFields: ['_id', 'match_id', 'sent_date', 'message'],
        },
      },
      unknownFields: {},
    }

    const diff = compareSchemas(oldSnapshot, newSnapshot)

    expect(diff).not.toBeNull()
    expect(diff?.changes.messages?.removedFields).toEqual(['deprecated_field'])
  })

  it('detects changes in multiple entities', () => {
    const oldSnapshot: SchemaSnapshot = {
      platform: 'tinder',
      version: '1.0.0',
      capturedAt: '2024-01-01T00:00:00Z',
      entities: {
        messages: {
          observedFields: ['_id', 'sent_date'],
          sampleCount: 10,
          requiredFields: ['_id', 'sent_date'],
        },
        matches: {
          observedFields: ['_id', 'created_date'],
          sampleCount: 5,
          requiredFields: ['_id', 'created_date'],
        },
      },
      unknownFields: {},
    }

    const newSnapshot: SchemaSnapshot = {
      platform: 'tinder',
      version: '1.1.0',
      capturedAt: '2024-02-01T00:00:00Z',
      entities: {
        messages: {
          observedFields: ['_id', 'sent_date', 'new_field'],
          sampleCount: 10,
          requiredFields: ['_id', 'sent_date'],
        },
        matches: {
          observedFields: ['_id', 'created_date', 'match_type'],
          sampleCount: 5,
          requiredFields: ['_id', 'created_date'],
        },
      },
      unknownFields: {},
    }

    const diff = compareSchemas(oldSnapshot, newSnapshot)

    expect(diff).not.toBeNull()
    expect(diff?.changes.messages?.addedFields).toEqual(['new_field'])
    expect(diff?.changes.matches?.addedFields).toEqual(['match_type'])
  })

  it('returns null when no changes', () => {
    const oldSnapshot: SchemaSnapshot = {
      platform: 'tinder',
      version: '1.0.0',
      capturedAt: '2024-01-01T00:00:00Z',
      entities: {
        messages: {
          observedFields: ['_id', 'sent_date'],
          sampleCount: 10,
          requiredFields: ['_id', 'sent_date'],
        },
      },
      unknownFields: {},
    }

    const newSnapshot: SchemaSnapshot = {
      platform: 'tinder',
      version: '1.0.0',
      capturedAt: '2024-02-01T00:00:00Z',
      entities: {
        messages: {
          observedFields: ['_id', 'sent_date'],
          sampleCount: 10,
          requiredFields: ['_id', 'sent_date'],
        },
      },
      unknownFields: {},
    }

    const diff = compareSchemas(oldSnapshot, newSnapshot)

    expect(diff).toBeNull()
  })

  it('returns null when platforms differ', () => {
    const oldSnapshot: SchemaSnapshot = {
      platform: 'tinder',
      version: '1.0.0',
      capturedAt: '2024-01-01T00:00:00Z',
      entities: {},
      unknownFields: {},
    }

    const newSnapshot: SchemaSnapshot = {
      platform: 'hinge',
      version: '1.0.0',
      capturedAt: '2024-02-01T00:00:00Z',
      entities: {},
      unknownFields: {},
    }

    const diff = compareSchemas(oldSnapshot, newSnapshot)

    expect(diff).toBeNull()
  })

  it('returns null when old snapshot is undefined', () => {
    const newSnapshot: SchemaSnapshot = {
      platform: 'tinder',
      version: '1.0.0',
      capturedAt: '2024-02-01T00:00:00Z',
      entities: {},
      unknownFields: {},
    }

    const diff = compareSchemas(undefined, newSnapshot)

    expect(diff).toBeNull()
  })
})
