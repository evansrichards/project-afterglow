import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { deleteDatabase } from './connection'
import * as queries from './queries'
import type { ParticipantProfile, MatchContext, NormalizedMessage } from '@/types/data-model'

describe('Database Queries', () => {
  // Clean up database before and after each test
  beforeEach(async () => {
    await deleteDatabase()
  })

  afterEach(async () => {
    await deleteDatabase()
  })

  describe('Participants', () => {
    const mockParticipant: ParticipantProfile = {
      id: 'participant-1',
      platform: 'tinder',
      name: 'John Doe',
      age: 28,
      isUser: false,
    }

    it('should save and retrieve a participant', async () => {
      await queries.saveParticipant(mockParticipant)
      const retrieved = await queries.getParticipant('participant-1')
      expect(retrieved).toEqual(mockParticipant)
    })

    it('should save multiple participants', async () => {
      const participants: ParticipantProfile[] = [
        mockParticipant,
        { ...mockParticipant, id: 'participant-2', name: 'Jane Doe' },
      ]

      await queries.saveParticipants(participants)
      const all = await queries.getAllParticipants()
      expect(all).toHaveLength(2)
    })

    it('should filter participants by platform', async () => {
      await queries.saveParticipants([
        mockParticipant,
        { ...mockParticipant, id: 'participant-2', platform: 'hinge' },
      ])

      const tinderParticipants = await queries.getParticipantsByPlatform('tinder')
      expect(tinderParticipants).toHaveLength(1)
      expect(tinderParticipants[0].platform).toBe('tinder')
    })

    it('should retrieve user profile', async () => {
      const userProfile: ParticipantProfile = { ...mockParticipant, id: 'user-1', isUser: true }
      await queries.saveParticipants([mockParticipant, userProfile])

      const retrieved = await queries.getUserProfile()
      expect(retrieved?.isUser).toBe(true)
      expect(retrieved?.id).toBe('user-1')
    })
  })

  describe('Matches', () => {
    const mockMatch: MatchContext = {
      id: 'match-1',
      platform: 'tinder',
      createdAt: '2025-01-01T00:00:00Z',
      status: 'active',
      participants: ['user-1', 'participant-1'],
      attributes: {},
    }

    it('should save and retrieve a match', async () => {
      await queries.saveMatch(mockMatch)
      const retrieved = await queries.getMatch('match-1')
      expect(retrieved).toEqual(mockMatch)
    })

    it('should save multiple matches', async () => {
      const matches: MatchContext[] = [mockMatch, { ...mockMatch, id: 'match-2' }]

      await queries.saveMatches(matches)
      const all = await queries.getAllMatches()
      expect(all).toHaveLength(2)
    })

    it('should filter matches by status', async () => {
      await queries.saveMatches([mockMatch, { ...mockMatch, id: 'match-2', status: 'closed' }])

      const activeMatches = await queries.getMatchesByStatus('active')
      expect(activeMatches).toHaveLength(1)
      expect(activeMatches[0].status).toBe('active')
    })

    it('should find matches for a participant', async () => {
      await queries.saveMatches([
        mockMatch,
        { ...mockMatch, id: 'match-2', participants: ['user-1', 'participant-2'] },
      ])

      const matches = await queries.getMatchesForParticipant('participant-1')
      expect(matches).toHaveLength(1)
      expect(matches[0].id).toBe('match-1')
    })
  })

  describe('Messages', () => {
    const mockMessage: NormalizedMessage = {
      id: 'message-1',
      matchId: 'match-1',
      senderId: 'user-1',
      sentAt: '2025-01-01T12:00:00Z',
      body: 'Hello!',
      direction: 'user',
    }

    it('should save and retrieve a message', async () => {
      await queries.saveMessage(mockMessage)
      const retrieved = await queries.getMessage('message-1')
      expect(retrieved).toEqual(mockMessage)
    })

    it('should save multiple messages', async () => {
      const messages: NormalizedMessage[] = [
        mockMessage,
        { ...mockMessage, id: 'message-2', body: 'Hi there!' },
      ]

      await queries.saveMessages(messages)
      const all = await queries.getAllMessages()
      expect(all).toHaveLength(2)
    })

    it('should get messages for a match', async () => {
      await queries.saveMessages([
        mockMessage,
        { ...mockMessage, id: 'message-2', matchId: 'match-2' },
      ])

      const matchMessages = await queries.getMessagesForMatch('match-1')
      expect(matchMessages).toHaveLength(1)
      expect(matchMessages[0].matchId).toBe('match-1')
    })

    it('should filter messages by direction', async () => {
      await queries.saveMessages([
        mockMessage,
        { ...mockMessage, id: 'message-2', direction: 'match' },
      ])

      const userMessages = await queries.getMessagesByDirection('user')
      expect(userMessages).toHaveLength(1)
      expect(userMessages[0].direction).toBe('user')
    })

    it('should get messages in date range', async () => {
      await queries.saveMessages([
        { ...mockMessage, id: 'msg-1', sentAt: '2025-01-01T10:00:00Z' },
        { ...mockMessage, id: 'msg-2', sentAt: '2025-01-01T14:00:00Z' },
        { ...mockMessage, id: 'msg-3', sentAt: '2025-01-01T18:00:00Z' },
      ])

      const messages = await queries.getMessagesInDateRange(
        'match-1',
        '2025-01-01T12:00:00Z',
        '2025-01-01T16:00:00Z'
      )

      expect(messages).toHaveLength(1)
      expect(messages[0].id).toBe('msg-2')
    })
  })

  describe('Bulk Operations', () => {
    it('should import a complete dataset', async () => {
      const dataset = {
        metadata: {
          id: 'dataset-1',
          platform: 'tinder' as const,
          importedAt: '2025-01-01T00:00:00Z',
          parserVersion: '1.0.0',
          messageCount: 2,
          matchCount: 1,
          participantCount: 2,
        },
        participants: [
          {
            id: 'user-1',
            platform: 'tinder' as const,
            name: 'User',
            isUser: true,
          },
          {
            id: 'participant-1',
            platform: 'tinder' as const,
            name: 'Match',
            isUser: false,
          },
        ],
        matches: [
          {
            id: 'match-1',
            platform: 'tinder' as const,
            createdAt: '2025-01-01T00:00:00Z',
            status: 'active' as const,
            participants: ['user-1', 'participant-1'],
            attributes: {},
          },
        ],
        messages: [
          {
            id: 'message-1',
            matchId: 'match-1',
            senderId: 'user-1',
            sentAt: '2025-01-01T12:00:00Z',
            body: 'Hello!',
            direction: 'user' as const,
          },
          {
            id: 'message-2',
            matchId: 'match-1',
            senderId: 'participant-1',
            sentAt: '2025-01-01T12:05:00Z',
            body: 'Hi!',
            direction: 'match' as const,
          },
        ],
      }

      await queries.importDataset(dataset)

      // Verify everything was imported
      const participants = await queries.getAllParticipants()
      const matches = await queries.getAllMatches()
      const messages = await queries.getAllMessages()
      const datasets = await queries.getAllDatasets()

      expect(participants).toHaveLength(2)
      expect(matches).toHaveLength(1)
      expect(messages).toHaveLength(2)
      expect(datasets).toHaveLength(1)
    })

    it('should clear all data', async () => {
      // Add some data first
      await queries.saveParticipant({
        id: 'participant-1',
        platform: 'tinder',
        isUser: false,
      })
      await queries.saveMatch({
        id: 'match-1',
        platform: 'tinder',
        createdAt: '2025-01-01',
        status: 'active',
        participants: [],
        attributes: {},
      })

      // Clear all data
      await queries.clearAllData()

      // Verify everything is empty
      const participants = await queries.getAllParticipants()
      const matches = await queries.getAllMatches()
      const messages = await queries.getAllMessages()

      expect(participants).toHaveLength(0)
      expect(matches).toHaveLength(0)
      expect(messages).toHaveLength(0)
    })
  })

  describe('Session', () => {
    it('should save and retrieve session', async () => {
      const session = {
        id: 'current',
        lastActiveAt: new Date().toISOString(),
        preferences: {
          privacyMode: true,
          telemetryEnabled: false,
        },
      }

      await queries.saveSession(session)
      const retrieved = await queries.getSession('current')
      expect(retrieved).toEqual(session)
    })

    it('should update session', async () => {
      const session = {
        id: 'current',
        lastActiveAt: '2025-01-01T00:00:00Z',
        preferences: {
          privacyMode: true,
          telemetryEnabled: false,
        },
      }

      await queries.saveSession(session)
      await queries.updateSession('current', {
        currentDatasetId: 'dataset-1',
      })

      const updated = await queries.getSession('current')
      expect(updated?.currentDatasetId).toBe('dataset-1')
      expect(updated?.preferences.privacyMode).toBe(true)
    })
  })
})
