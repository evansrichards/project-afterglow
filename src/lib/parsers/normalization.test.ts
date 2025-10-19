import { describe, it, expect } from 'vitest'
import {
  normalizeTimestamp,
  deduplicateParticipants,
  createCanonicalId,
  normalizeTimestamps,
} from './normalization'
import type { ParticipantProfile } from '@/types/data-model'

describe('normalizeTimestamp', () => {
  it('handles ISO 8601 strings', () => {
    const result = normalizeTimestamp('2023-07-12T22:41:13.000Z')
    expect(result).toMatch(/2023-07-12T\d{2}:41:13/)
  })

  it('handles ISO strings with timezone', () => {
    const result = normalizeTimestamp('2023-07-14T19:20:55Z')
    expect(result).toMatch(/2023-07-14T\d{2}:20:55/)
  })

  it('handles Date objects', () => {
    const date = new Date('2023-07-12T22:41:13.000Z')
    const result = normalizeTimestamp(date)
    expect(result).toMatch(/2023-07-12T\d{2}:41:13/)
  })

  it('handles Unix timestamps in milliseconds', () => {
    const timestamp = 1689200473000 // 2023-07-12T22:21:13.000Z
    const result = normalizeTimestamp(timestamp)
    expect(result).toBe('2023-07-12T22:21:13.000Z')
  })

  it('handles Unix timestamps in seconds', () => {
    const timestamp = 1689200473 // 2023-07-12T22:21:13.000Z in seconds
    const result = normalizeTimestamp(timestamp)
    expect(result).toBe('2023-07-12T22:21:13.000Z')
  })

  it('returns null for invalid timestamps', () => {
    expect(normalizeTimestamp('invalid')).toBeNull()
    expect(normalizeTimestamp('')).toBeNull()
    expect(normalizeTimestamp(null)).toBeNull()
    expect(normalizeTimestamp(undefined)).toBeNull()
  })

  it('returns null for NaN', () => {
    expect(normalizeTimestamp(NaN)).toBeNull()
  })

  it('handles various ISO string formats', () => {
    expect(normalizeTimestamp('2023-07-12')).toBeTruthy()
    expect(normalizeTimestamp('2023-07-12T22:41:13')).toBeTruthy()
    expect(normalizeTimestamp('2023-07-12T22:41:13Z')).toBeTruthy()
    expect(normalizeTimestamp('2023-07-12T22:41:13.000Z')).toBeTruthy()
    expect(normalizeTimestamp('2023-07-12T22:41:13+00:00')).toBeTruthy()
  })
})

describe('deduplicateParticipants', () => {
  it('returns empty array for empty input', () => {
    const result = deduplicateParticipants([])
    expect(result).toEqual([])
  })

  it('keeps unique participants', () => {
    const participants: ParticipantProfile[] = [
      { id: 'user_1', platform: 'tinder', isUser: true },
      { id: 'person_1', platform: 'tinder', name: 'Alice', isUser: false },
      { id: 'person_2', platform: 'tinder', name: 'Bob', isUser: false },
    ]

    const result = deduplicateParticipants(participants)
    expect(result).toHaveLength(3)
  })

  it('merges duplicates with same platform and ID', () => {
    const participants: ParticipantProfile[] = [
      { id: 'person_1', platform: 'tinder', name: 'Alice', isUser: false },
      { id: 'person_1', platform: 'tinder', age: 30, isUser: false },
    ]

    const result = deduplicateParticipants(participants)
    expect(result).toHaveLength(1)
    expect(result[0].name).toBe('Alice')
    expect(result[0].age).toBe(30)
  })

  it('merges participants with same name across platforms', () => {
    const participants: ParticipantProfile[] = [
      { id: 'tinder_1', platform: 'tinder', name: 'Alice', isUser: false },
      { id: 'hinge_1', platform: 'hinge', name: 'Alice', age: 30, isUser: false },
    ]

    const result = deduplicateParticipants(participants)
    expect(result).toHaveLength(1)
    expect(result[0].name).toBe('Alice')
    expect(result[0].age).toBe(30)
  })

  it('handles case-insensitive name matching across platforms', () => {
    const participants: ParticipantProfile[] = [
      { id: 'p1', platform: 'tinder', name: 'Alice', isUser: false },
      { id: 'p2', platform: 'hinge', name: 'ALICE', isUser: false },
    ]

    const result = deduplicateParticipants(participants)
    // Should merge since same name across different platforms
    expect(result).toHaveLength(1)
    expect(result[0].name).toBe('Alice')
  })

  it('keeps separate participants with same name on same platform', () => {
    const participants: ParticipantProfile[] = [
      { id: 'p1', platform: 'tinder', name: 'Alice', isUser: false },
      { id: 'p3', platform: 'tinder', name: 'alice', isUser: false },
    ]

    const result = deduplicateParticipants(participants)
    // Should NOT merge - different IDs on same platform (different people with same name)
    expect(result).toHaveLength(2)
  })

  it('handles extra whitespace in names', () => {
    const participants: ParticipantProfile[] = [
      { id: 'p1', platform: 'tinder', name: 'Alice  Smith', isUser: false },
      { id: 'p2', platform: 'hinge', name: ' Alice Smith ', isUser: false },
    ]

    const result = deduplicateParticipants(participants)
    expect(result).toHaveLength(1)
  })

  it('keeps participants with different names separate', () => {
    const participants: ParticipantProfile[] = [
      { id: 'p1', platform: 'tinder', name: 'Alice', isUser: false },
      { id: 'p2', platform: 'tinder', name: 'Bob', isUser: false },
    ]

    const result = deduplicateParticipants(participants)
    expect(result).toHaveLength(2)
  })

  it('merges traits from duplicate participants', () => {
    const participants: ParticipantProfile[] = [
      { id: 'p1', platform: 'tinder', name: 'Alice', traits: ['Engineer', 'MIT'], isUser: false },
      {
        id: 'p1',
        platform: 'tinder',
        name: 'Alice',
        traits: ['Designer', 'MIT'],
        isUser: false,
      },
    ]

    const result = deduplicateParticipants(participants)
    expect(result).toHaveLength(1)
    expect(result[0].traits).toContain('Engineer')
    expect(result[0].traits).toContain('Designer')
    expect(result[0].traits).toContain('MIT')
    // MIT should only appear once (deduplicated)
    expect(result[0].traits?.filter((t) => t === 'MIT')).toHaveLength(1)
  })

  it('merges prompts from duplicate participants', () => {
    const participants: ParticipantProfile[] = [
      {
        id: 'p1',
        platform: 'hinge',
        name: 'Alice',
        prompts: [{ title: 'Hobby', response: 'Reading' }],
        isUser: false,
      },
      {
        id: 'p1',
        platform: 'hinge',
        name: 'Alice',
        prompts: [{ title: 'Food', response: 'Pizza' }],
        isUser: false,
      },
    ]

    const result = deduplicateParticipants(participants)
    expect(result).toHaveLength(1)
    expect(result[0].prompts).toHaveLength(2)
  })

  it('prefers first non-null values', () => {
    const participants: ParticipantProfile[] = [
      { id: 'p1', platform: 'tinder', name: 'Alice', age: 30, location: 'NYC', isUser: false },
      {
        id: 'p1',
        platform: 'tinder',
        name: 'Alice',
        age: 31,
        location: 'Boston',
        isUser: false,
      },
    ]

    const result = deduplicateParticipants(participants)
    expect(result).toHaveLength(1)
    expect(result[0].age).toBe(30) // First value
    expect(result[0].location).toBe('NYC') // First value
  })

  it('fills in missing values from duplicates', () => {
    const participants: ParticipantProfile[] = [
      { id: 'p1', platform: 'tinder', name: 'Alice', isUser: false },
      { id: 'p1', platform: 'tinder', age: 30, location: 'NYC', isUser: false },
    ]

    const result = deduplicateParticipants(participants)
    expect(result).toHaveLength(1)
    expect(result[0].name).toBe('Alice')
    expect(result[0].age).toBe(30)
    expect(result[0].location).toBe('NYC')
  })

  it('preserves user flag correctly', () => {
    const participants: ParticipantProfile[] = [
      { id: 'user_1', platform: 'tinder', isUser: true },
      { id: 'user_1', platform: 'tinder', name: 'Me', isUser: false }, // Incorrectly marked
    ]

    const result = deduplicateParticipants(participants)
    expect(result).toHaveLength(1)
    expect(result[0].isUser).toBe(true) // Should preserve user flag
  })
})

describe('createCanonicalId', () => {
  it('returns "user" for user participants', () => {
    const participant: ParticipantProfile = {
      id: 'user_123',
      platform: 'tinder',
      isUser: true,
    }

    expect(createCanonicalId(participant)).toBe('user')
  })

  it('creates platform-prefixed ID for non-users', () => {
    const participant: ParticipantProfile = {
      id: 'person_123',
      platform: 'tinder',
      isUser: false,
    }

    expect(createCanonicalId(participant)).toBe('tinder_person_123')
  })

  it('handles different platforms', () => {
    const tinder: ParticipantProfile = {
      id: '123',
      platform: 'tinder',
      isUser: false,
    }

    const hinge: ParticipantProfile = {
      id: '123',
      platform: 'hinge',
      isUser: false,
    }

    expect(createCanonicalId(tinder)).toBe('tinder_123')
    expect(createCanonicalId(hinge)).toBe('hinge_123')
  })
})

describe('normalizeTimestamps', () => {
  it('normalizes specified timestamp fields', () => {
    const data = {
      id: '123',
      createdAt: '2023-07-12T22:41:13.000Z',
      updatedAt: '2023-07-14T19:20:55Z',
      name: 'Alice',
    }

    const result = normalizeTimestamps(data, ['createdAt', 'updatedAt'])

    expect(result.id).toBe('123')
    expect(result.name).toBe('Alice')
    expect(result.createdAt).toMatch(/2023-07-12T\d{2}:41:13/)
    expect(result.updatedAt).toMatch(/2023-07-14T\d{2}:20:55/)
  })

  it('ignores non-existent fields', () => {
    const data = {
      id: '123',
      name: 'Alice',
    }

    const result = normalizeTimestamps(data, ['createdAt', 'updatedAt'])

    expect(result).toEqual(data)
  })

  it('preserves null/undefined timestamps', () => {
    const data = {
      id: '123',
      createdAt: null,
      updatedAt: undefined,
    }

    const result = normalizeTimestamps(data, ['createdAt', 'updatedAt'])

    expect(result.createdAt).toBeNull()
    expect(result.updatedAt).toBeUndefined()
  })
})
