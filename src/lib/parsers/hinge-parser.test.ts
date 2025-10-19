import { describe, it, expect } from 'vitest'
import { hingeParser } from './hinge-parser'

describe('HingeParser', () => {
  const validMatchesCSV = `match_id,conversation_id,matched_at,match_origin,match_type,match_status,profile_name,profile_age,profile_location,icebreaker_sent
match_001,conv_001,2023-07-14T19:20:55Z,discover,like,open,Jordan,31,Brooklyn NY,true
match_002,conv_002,2023-08-02T02:10:03Z,standouts,rose,open,Morgan,34,Queens NY,false
match_003,conv_003,2023-04-19T15:58:11Z,discover,like,closed,Jamie,33,Jersey City NJ,true`

  const validMessagesCSV = `conversation_id,match_id,sent_at,sender_role,sender_name,recipient_name,message_text,prompt_title,prompt_response,delivery_status,like_context
conv_001,match_001,2023-07-14T19:21:04Z,user,Avery,Jordan,Hey! Loved your travel photos.,Prompt: "My simple pleasures",Lazy mornings with coffee,delivered,like
conv_001,match_001,2023-07-14T19:25:51Z,match,Jordan,Avery,Thanks! What's been your favorite trip?,Prompt: "My simple pleasures",Lazy mornings with coffee,delivered,match
conv_002,match_002,2023-08-02T02:15:10Z,match,Morgan,Avery,You seem fun but I hate texting lol.,None,None,delivered,skip`

  describe('parse - matches', () => {
    it('successfully parses matches CSV', async () => {
      const result = await hingeParser.parse(validMatchesCSV, 'matches.csv')

      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
      expect(result.metadata).toBeDefined()
    })

    it('extracts correct number of matches', async () => {
      const result = await hingeParser.parse(validMatchesCSV, 'matches.csv')

      expect(result.data?.matches).toHaveLength(3)
      expect(result.metadata?.matchCount).toBe(3)
    })

    it('creates user participant', async () => {
      const result = await hingeParser.parse(validMatchesCSV, 'matches.csv')

      const user = result.data?.participants.find((p) => p.isUser)
      expect(user).toBeDefined()
      expect(user?.platform).toBe('hinge')
    })

    it('creates match participants with details', async () => {
      const result = await hingeParser.parse(validMatchesCSV, 'matches.csv')

      const matchParticipants = result.data?.participants.filter((p) => !p.isUser)
      expect(matchParticipants).toHaveLength(3)

      const jordan = matchParticipants?.find((p) => p.name === 'Jordan')
      expect(jordan?.age).toBe(31)
      expect(jordan?.location).toBe('Brooklyn NY')
    })

    it('parses match status correctly', async () => {
      const result = await hingeParser.parse(validMatchesCSV, 'matches.csv')

      const matches = result.data?.matches || []
      const openMatches = matches.filter((m) => m.status === 'active')
      const closedMatches = matches.filter((m) => m.status === 'closed')

      expect(openMatches).toHaveLength(2)
      expect(closedMatches).toHaveLength(1)
    })

    it('preserves match origin', async () => {
      const result = await hingeParser.parse(validMatchesCSV, 'matches.csv')

      const match = result.data?.matches.find((m) => m.id === 'match_002')
      expect(match?.origin).toBe('rose')
    })

    it('returns no messages for matches file', async () => {
      const result = await hingeParser.parse(validMatchesCSV, 'matches.csv')

      expect(result.data?.messages).toHaveLength(0)
      expect(result.metadata?.messageCount).toBe(0)
    })
  })

  describe('parse - messages', () => {
    it('successfully parses messages CSV', async () => {
      const result = await hingeParser.parse(validMessagesCSV, 'messages.csv')

      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
    })

    it('extracts correct number of messages', async () => {
      const result = await hingeParser.parse(validMessagesCSV, 'messages.csv')

      expect(result.data?.messages).toHaveLength(3)
      expect(result.metadata?.messageCount).toBe(3)
    })

    it('identifies message direction correctly', async () => {
      const result = await hingeParser.parse(validMessagesCSV, 'messages.csv')

      const messages = result.data?.messages || []
      const userMessages = messages.filter((m) => m.direction === 'user')
      const matchMessages = messages.filter((m) => m.direction === 'match')

      expect(userMessages).toHaveLength(1)
      expect(matchMessages).toHaveLength(2)
    })

    it('preserves message text', async () => {
      const result = await hingeParser.parse(validMessagesCSV, 'messages.csv')

      const firstMessage = result.data?.messages[0]
      expect(firstMessage?.body).toBe('Hey! Loved your travel photos.')
    })

    it('parses delivery status', async () => {
      const result = await hingeParser.parse(validMessagesCSV, 'messages.csv')

      const messages = result.data?.messages || []
      const deliveredMessages = messages.filter((m) => m.delivery === 'delivered')

      expect(deliveredMessages).toHaveLength(3)
    })

    it('parses prompt context', async () => {
      const result = await hingeParser.parse(validMessagesCSV, 'messages.csv')

      const messageWithPrompt = result.data?.messages[0]
      expect(messageWithPrompt?.promptContext).toBeDefined()
      expect(messageWithPrompt?.promptContext?.title).toContain('simple pleasures')
      expect(messageWithPrompt?.promptContext?.response).toBe('Lazy mornings with coffee')
    })

    it('handles None values in prompt context', async () => {
      const result = await hingeParser.parse(validMessagesCSV, 'messages.csv')

      const messageWithoutPrompt = result.data?.messages[2]
      expect(messageWithoutPrompt?.promptContext).toBeUndefined()
    })

    it('calculates date range correctly', async () => {
      const result = await hingeParser.parse(validMessagesCSV, 'messages.csv')

      expect(result.metadata?.dateRange).toBeDefined()
      expect(result.metadata?.dateRange?.earliest).toBe('2023-07-14T19:21:04.000Z')
      expect(result.metadata?.dateRange?.latest).toBe('2023-08-02T02:15:10.000Z')
    })

    it('returns no matches for messages file', async () => {
      const result = await hingeParser.parse(validMessagesCSV, 'messages.csv')

      expect(result.data?.matches).toHaveLength(0)
      expect(result.metadata?.matchCount).toBe(0)
    })
  })

  describe('CSV parsing', () => {
    it('handles quoted fields', async () => {
      const csvWithQuotes = `conversation_id,match_id,sent_at,sender_role,message_text,delivery_status
conv_001,match_001,2023-07-14T19:21:04Z,user,"Message with, comma in it",delivered`

      const result = await hingeParser.parse(csvWithQuotes, 'test_messages.csv')
      // Should not crash and handle quotes correctly
      expect(result.success).toBe(true)
      expect(result.data?.messages[0].body).toBe('Message with, comma in it')
    })

    it('handles escaped quotes', async () => {
      const csvWithEscapedQuotes = `conversation_id,match_id,sent_at,sender_role,message_text,delivery_status
conv_001,match_001,2023-07-14T19:21:04Z,user,"She said ""hello""",delivered`

      const result = await hingeParser.parse(csvWithEscapedQuotes, 'test_messages.csv')
      expect(result.success).toBe(true)
    })

    it('handles different line endings', async () => {
      const csvWithCRLF = validMatchesCSV.replace(/\n/g, '\r\n')
      const result = await hingeParser.parse(csvWithCRLF, 'matches.csv')

      expect(result.success).toBe(true)
      expect(result.data?.matches).toHaveLength(3)
    })

    it('skips empty rows', async () => {
      const csvWithEmptyRows = `match_id,matched_at
match_001,2023-07-14T19:20:55Z

match_002,2023-08-02T02:10:03Z`

      const result = await hingeParser.parse(csvWithEmptyRows, 'test_matches.csv')
      expect(result.success).toBe(true)
      expect(result.data?.matches).toHaveLength(2)
    })
  })

  describe('validate', () => {
    it('validates correct CSV', () => {
      const result = hingeParser.validate(validMatchesCSV)
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('rejects empty content', () => {
      const result = hingeParser.validate('')
      expect(result.valid).toBe(false)
      expect(result.errors[0].code).toBe('EMPTY_FILE')
    })

    it('rejects header-only CSV', () => {
      const result = hingeParser.validate('header1,header2,header3')
      expect(result.valid).toBe(false)
      expect(result.errors[0].code).toBe('INSUFFICIENT_DATA')
    })
  })

  describe('error handling', () => {
    it('returns error for unknown file type', async () => {
      const result = await hingeParser.parse(validMatchesCSV, 'unknown.csv')
      expect(result.success).toBe(false)
      expect(result.errors?.[0].code).toBe('UNKNOWN_FILE_TYPE')
    })

    it('returns error for empty file', async () => {
      const result = await hingeParser.parse('', 'matches.csv')
      expect(result.success).toBe(false)
      expect(result.errors?.[0].code).toBe('EMPTY_FILE')
    })

    it('returns error for invalid header', async () => {
      const invalidCSV = `wrong,headers,here
value1,value2,value3`

      const result = await hingeParser.parse(invalidCSV, 'matches.csv')
      expect(result.success).toBe(false)
      expect(result.errors?.[0].code).toBe('INVALID_HEADER')
    })

    it('continues parsing after individual row failures', async () => {
      // Even with malformed data, parser should try to extract what it can
      const partiallyValidCSV = `match_id,matched_at,profile_name
match_001,2023-07-14T19:20:55Z,Alice
,invalid_date,Bob
match_003,2023-08-14T19:20:55Z,Charlie`

      const result = await hingeParser.parse(partiallyValidCSV, 'matches.csv')
      expect(result.success).toBe(true)
      // Should parse at least the valid rows
      expect(result.data?.matches.length).toBeGreaterThan(0)
    })
  })

  describe('metadata', () => {
    it('sets correct platform', async () => {
      const result = await hingeParser.parse(validMatchesCSV, 'matches.csv')
      expect(result.metadata?.platform).toBe('hinge')
    })

    it('includes parser version', async () => {
      const result = await hingeParser.parse(validMatchesCSV, 'matches.csv')
      expect(result.metadata?.parserVersion).toBeDefined()
    })

    it('counts participants correctly', async () => {
      const result = await hingeParser.parse(validMatchesCSV, 'matches.csv')
      // User + 3 match participants
      expect(result.metadata?.participantCount).toBe(4)
    })
  })
})
