import { describe, it, expect } from 'vitest'
import { tinderParser } from './tinder-parser'

describe('TinderParser', () => {
  const validTinderExport = JSON.stringify({
    data_creation: '2023-09-01T00:00:00.000Z',
    user: {
      _id: 'user_123',
      bio: 'Test bio',
      gender: 1,
      birth_date: '1992-03-08T00:00:00.000Z',
    },
    matches: [
      {
        _id: 'match_1',
        person: {
          _id: 'person_1',
          name: 'Alice',
          birth_date: '1990-05-22T00:00:00.000Z',
          gender: 1,
          bio: 'Alice bio',
          jobs: [{ company: { name: 'Tech Corp' }, title: { name: 'Engineer' } }],
          schools: [{ name: 'MIT' }],
        },
        created_date: '2023-07-11T15:05:33.000Z',
        last_activity_date: '2023-07-12T22:44:05.000Z',
        is_super_like: false,
        is_boost_match: false,
        closed: false,
      },
    ],
    messages: [
      {
        _id: 'msg_1',
        match_id: 'match_1',
        sent_date: '2023-07-12T22:41:13.000Z',
        message: 'Hello!',
        from: 'user_123',
        to: 'person_1',
        liked: false,
        reactions: [],
      },
      {
        _id: 'msg_2',
        match_id: 'match_1',
        sent_date: '2023-07-12T22:44:02.000Z',
        message: 'Hi there!',
        from: 'person_1',
        to: 'user_123',
        liked: true,
        reactions: [
          {
            emoji: '😊',
            actor: 'user_123',
            sent_date: '2023-07-12T22:44:05.000Z',
          },
        ],
      },
    ],
  })

  describe('parse', () => {
    it('successfully parses valid Tinder export', async () => {
      const result = await tinderParser.parse(validTinderExport, 'tinder.json')

      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
      expect(result.metadata).toBeDefined()
    })

    it('extracts user participant', async () => {
      const result = await tinderParser.parse(validTinderExport, 'tinder.json')

      const userParticipant = result.data?.participants.find((p) => p.isUser)
      expect(userParticipant).toBeDefined()
      expect(userParticipant?.id).toBe('user_123')
      expect(userParticipant?.platform).toBe('tinder')
      expect(userParticipant?.age).toBeGreaterThan(30)
    })

    it('extracts match participants', async () => {
      const result = await tinderParser.parse(validTinderExport, 'tinder.json')

      const matchParticipants = result.data?.participants.filter((p) => !p.isUser)
      expect(matchParticipants).toHaveLength(1)
      expect(matchParticipants?.[0].name).toBe('Alice')
      expect(matchParticipants?.[0].traits).toContain('Engineer')
      expect(matchParticipants?.[0].traits).toContain('MIT')
    })

    it('extracts matches with correct structure', async () => {
      const result = await tinderParser.parse(validTinderExport, 'tinder.json')

      expect(result.data?.matches).toHaveLength(1)
      const match = result.data?.matches[0]
      expect(match?.id).toBe('match_1')
      expect(match?.platform).toBe('tinder')
      expect(match?.participants).toHaveLength(2)
      expect(match?.status).toBe('active')
      expect(match?.origin).toBe('like')
    })

    it('extracts messages with correct direction', async () => {
      const result = await tinderParser.parse(validTinderExport, 'tinder.json')

      expect(result.data?.messages).toHaveLength(2)

      const userMessage = result.data?.messages[0]
      expect(userMessage?.direction).toBe('user')
      expect(userMessage?.senderId).toBe('user_123')
      expect(userMessage?.body).toBe('Hello!')

      const matchMessage = result.data?.messages[1]
      expect(matchMessage?.direction).toBe('match')
      expect(matchMessage?.senderId).toBe('person_1')
      expect(matchMessage?.body).toBe('Hi there!')
    })

    it('extracts message reactions', async () => {
      const result = await tinderParser.parse(validTinderExport, 'tinder.json')

      const messageWithReaction = result.data?.messages[1]
      expect(messageWithReaction?.reactions).toHaveLength(1)
      expect(messageWithReaction?.reactions?.[0].emoji).toBe('😊')
      expect(messageWithReaction?.reactions?.[0].actorId).toBe('user_123')
    })

    it('calculates correct metadata', async () => {
      const result = await tinderParser.parse(validTinderExport, 'tinder.json')

      expect(result.metadata?.platform).toBe('tinder')
      expect(result.metadata?.messageCount).toBe(2)
      expect(result.metadata?.matchCount).toBe(1)
      expect(result.metadata?.participantCount).toBe(2)
      expect(result.metadata?.dateRange).toBeDefined()
      expect(result.metadata?.dateRange?.earliest).toBe('2023-07-12T22:41:13.000Z')
    })

    it('handles super likes correctly', async () => {
      const exportWithSuperLike = JSON.stringify({
        user: { _id: 'user_123' },
        matches: [
          {
            _id: 'match_1',
            person: { _id: 'person_1', name: 'Bob' },
            created_date: '2023-07-11T15:05:33.000Z',
            is_super_like: true,
            closed: false,
          },
        ],
        messages: [],
      })

      const result = await tinderParser.parse(exportWithSuperLike, 'tinder.json')
      expect(result.data?.matches[0].origin).toBe('super-like')
    })

    it('handles closed matches', async () => {
      const exportWithClosedMatch = JSON.stringify({
        user: { _id: 'user_123' },
        matches: [
          {
            _id: 'match_1',
            person: { _id: 'person_1', name: 'Charlie' },
            created_date: '2023-07-11T15:05:33.000Z',
            last_activity_date: '2023-07-15T10:00:00.000Z',
            closed: true,
          },
        ],
        messages: [],
      })

      const result = await tinderParser.parse(exportWithClosedMatch, 'tinder.json')
      expect(result.data?.matches[0].status).toBe('closed')
      expect(result.data?.matches[0].closedAt).toBe('2023-07-15T10:00:00.000Z')
    })

    it('handles missing optional fields gracefully', async () => {
      const minimalExport = JSON.stringify({
        user: { _id: 'user_123' },
        matches: [
          {
            _id: 'match_1',
            person: { _id: 'person_1' },
            created_date: '2023-07-11T15:05:33.000Z',
          },
        ],
        messages: [],
      })

      const result = await tinderParser.parse(minimalExport, 'tinder.json')
      expect(result.success).toBe(true)
      expect(result.data?.participants[1].name).toBeUndefined()
      expect(result.data?.participants[1].age).toBeUndefined()
    })

    it('returns error for invalid JSON', async () => {
      const result = await tinderParser.parse('{ invalid json', 'tinder.json')

      expect(result.success).toBe(false)
      expect(result.errors).toBeDefined()
      expect(result.errors?.[0].code).toBe('INVALID_JSON')
    })

    it('returns error for empty data', async () => {
      const emptyExport = JSON.stringify({
        user: { _id: 'user_123' },
      })

      const result = await tinderParser.parse(emptyExport, 'tinder.json')
      expect(result.success).toBe(false)
      expect(result.errors?.[0].code).toBe('MISSING_DATA')
    })
  })

  describe('validate', () => {
    it('validates correct structure', () => {
      const result = tinderParser.validate(validTinderExport)
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('rejects invalid JSON', () => {
      const result = tinderParser.validate('not json')
      expect(result.valid).toBe(false)
      expect(result.errors[0].code).toBe('INVALID_JSON')
    })

    it('rejects non-object root', () => {
      const result = tinderParser.validate('[]')
      expect(result.valid).toBe(false)
    })

    it('rejects missing data fields', () => {
      const result = tinderParser.validate('{}')
      expect(result.valid).toBe(false)
      expect(result.errors[0].code).toBe('MISSING_DATA')
    })

    it('rejects non-array messages', () => {
      const result = tinderParser.validate(JSON.stringify({ messages: 'not an array' }))
      expect(result.valid).toBe(false)
      expect(result.errors[0].code).toBe('INVALID_MESSAGES')
    })

    it('rejects non-array matches', () => {
      const result = tinderParser.validate(JSON.stringify({ matches: 'not an array' }))
      expect(result.valid).toBe(false)
      expect(result.errors[0].code).toBe('INVALID_MATCHES')
    })
  })

  describe('gender parsing', () => {
    it('parses gender codes correctly', async () => {
      const exportWithGenders = JSON.stringify({
        user: { _id: 'user_123', gender: 0 },
        matches: [
          {
            _id: 'match_1',
            person: { _id: 'person_1', name: 'Test', gender: 1 },
            created_date: '2023-07-11T15:05:33.000Z',
          },
          {
            _id: 'match_2',
            person: { _id: 'person_2', name: 'Test2', gender: -1 },
            created_date: '2023-07-11T15:05:33.000Z',
          },
        ],
        messages: [],
      })

      const result = await tinderParser.parse(exportWithGenders, 'tinder.json')
      const user = result.data?.participants.find((p) => p.isUser)
      expect(user?.genderLabel).toBe('Male')

      const match1 = result.data?.participants.find((p) => p.id === 'person_1')
      expect(match1?.genderLabel).toBe('Female')

      const match2 = result.data?.participants.find((p) => p.id === 'person_2')
      expect(match2?.genderLabel).toBe('Non-binary')
    })
  })

  describe('age calculation', () => {
    it('calculates age correctly', async () => {
      // Use a specific birth date that should be ~32 years old from 2024
      const exportWithAge = JSON.stringify({
        user: { _id: 'user_123', birth_date: '1992-01-01T00:00:00.000Z' },
        matches: [],
        messages: [],
      })

      const result = await tinderParser.parse(exportWithAge, 'tinder.json')
      const user = result.data?.participants.find((p) => p.isUser)
      expect(user?.age).toBeGreaterThan(30)
      expect(user?.age).toBeLessThan(40)
    })

    it('handles invalid birth dates', async () => {
      const exportWithInvalidAge = JSON.stringify({
        user: { _id: 'user_123', birth_date: 'invalid' },
        matches: [],
        messages: [],
      })

      const result = await tinderParser.parse(exportWithInvalidAge, 'tinder.json')
      const user = result.data?.participants.find((p) => p.isUser)
      expect(user?.age).toBeUndefined()
    })
  })
})
