/**
 * Tinder JSON Parser
 *
 * Parses Tinder data export JSON files into unified data model
 */

import type {
  ParticipantProfile,
  MatchContext,
  NormalizedMessage,
  RawRecord,
} from '@/types/data-model'
import type { DataParser, ParseResult, ParseError } from './types'
import { createParseError, createParseWarning, calculateDateRange } from './types'
import { validateParseResult, validateRawSchema, extractUnknownFields } from './validation'

const PARSER_VERSION = '1.0.0'

/**
 * Tinder-specific type definitions
 */
interface TinderExport {
  data_creation?: string
  messages?: TinderMessage[]
  matches?: TinderMatch[]
  user?: TinderUser
}

interface TinderMessage {
  _id: string
  match_id: string
  sent_date: string
  message: string
  from: string
  to: string
  liked?: boolean
  reactions?: Array<{
    emoji: string
    actor: string
    sent_date: string
  }>
}

interface TinderMatch {
  _id: string
  person: TinderPerson
  created_date: string
  last_activity_date?: string
  is_super_like?: boolean
  is_boost_match?: boolean
  is_tutorial?: boolean
  closed?: boolean
}

interface TinderPerson {
  _id: string
  name?: string
  birth_date?: string
  gender?: number
  bio?: string
  jobs?: Array<{
    company?: { name?: string }
    title?: { name?: string }
  }>
  schools?: Array<{ name?: string }>
}

interface TinderUser {
  _id: string
  bio?: string
  gender?: number
  birth_date?: string
}

/**
 * Tinder JSON Parser implementation
 */
export class TinderParser implements DataParser {
  platform = 'tinder' as const
  version = PARSER_VERSION

  /**
   * Parse Tinder JSON export
   */
  async parse(content: string, filename: string): Promise<ParseResult> {
    const errors: ParseError[] = []
    const warnings: ReturnType<typeof createParseWarning>[] = []

    try {
      // Parse JSON
      let data: TinderExport
      try {
        const rawData = JSON.parse(content) as Record<string, unknown>

        // Normalize field names: Tinder exports may have capitalized field names
        // Convert Messages -> messages, User -> user, etc.
        data = {
          messages: (rawData.messages || rawData.Messages) as TinderMessage[] | undefined,
          matches: (rawData.matches || rawData.Matches) as TinderMatch[] | undefined,
          user: (rawData.user || rawData.User) as TinderUser | undefined,
          data_creation: (rawData.data_creation || rawData.Data_creation) as string | undefined,
        }

        // Handle nested Messages structure: { Messages: [{ match_id, messages: [...] }] }
        if (rawData.Messages && Array.isArray(rawData.Messages)) {
          const messagesArray = rawData.Messages as Array<{
            match_id?: string
            messages?: Array<{
              to?: string | number
              from?: string | number
              message?: string
              sent_date?: string
            }>
          }>
          const flatMessages: TinderMessage[] = []
          const syntheticMatches: TinderMatch[] = []

          for (const matchGroup of messagesArray) {
            const matchId = matchGroup.match_id || `match_${flatMessages.length}`

            if (matchGroup.messages && Array.isArray(matchGroup.messages)) {
              // Extract match creation date (earliest message) and other participants
              const messageDates = matchGroup.messages
                .map(m => m.sent_date)
                .filter((d): d is string => !!d)
              const earliestDate = messageDates.length > 0
                ? messageDates.reduce((earliest, current) =>
                    new Date(current) < new Date(earliest) ? current : earliest
                  )
                : new Date().toISOString()

              // Infer participant ID from messages (the "to" or "from" that isn't "You")
              const participantIds = new Set<string | number>()
              for (const msg of matchGroup.messages) {
                if (msg.from !== 'You' && msg.from) participantIds.add(msg.from)
                if (msg.to !== 'You' && msg.to) participantIds.add(msg.to)
              }
              const participantId = participantIds.size > 0
                ? String(Array.from(participantIds)[0])
                : `participant_${matchId}`

              // Create a synthetic match object
              syntheticMatches.push({
                _id: matchId,
                person: {
                  _id: participantId,
                  name: undefined, // Name not available in this format
                },
                created_date: earliestDate,
              })

              for (let i = 0; i < matchGroup.messages.length; i++) {
                const msg = matchGroup.messages[i]

                // Convert nested message format to TinderMessage format
                const normalizedMessage: TinderMessage = {
                  _id: `${matchId}_msg_${i}`,
                  match_id: matchId,
                  sent_date: msg.sent_date || new Date().toISOString(),
                  message: msg.message || '',
                  from: String(msg.from || ''),
                  to: String(msg.to || ''),
                }

                flatMessages.push(normalizedMessage)
              }
            }
          }

          if (flatMessages.length > 0) {
            data.messages = flatMessages
          }

          // If there are no explicit matches but we created synthetic ones, use them
          if (syntheticMatches.length > 0 && !data.matches) {
            data.matches = syntheticMatches
          }
        }
      } catch (err) {
        return {
          success: false,
          errors: [
            createParseError('INVALID_JSON', `Failed to parse JSON: ${err instanceof Error ? err.message : 'Unknown error'}`, {
              severity: 'critical',
            }),
          ],
        }
      }

      // Validate raw schema and capture snapshot
      const schemaValidation = validateRawSchema(data, 'tinder')
      if (!schemaValidation.valid) {
        return {
          success: false,
          errors: schemaValidation.errors,
          warnings: schemaValidation.warnings.length > 0 ? schemaValidation.warnings : undefined,
          schemaSnapshot: schemaValidation.snapshot,
        }
      }

      // Merge schema warnings into parser warnings
      warnings.push(...schemaValidation.warnings)

      // Extract user ID
      const userId = data.user?._id || 'unknown_user'

      // Parse participants
      const participantMap = new Map<string, ParticipantProfile>()

      // Add user profile
      if (data.user) {
        participantMap.set(userId, this.parseUserProfile(data.user, userId, filename))
      }

      // Parse matches and their participants
      const matches: MatchContext[] = []
      if (data.matches) {
        for (const match of data.matches) {
          const participant = this.parseParticipant(match.person, filename)
          participantMap.set(participant.id, participant)

          matches.push(this.parseMatch(match, userId, participant.id, filename))
        }
      }

      // Parse messages
      const messages: NormalizedMessage[] = []
      if (data.messages) {
        for (const msg of data.messages) {
          try {
            messages.push(this.parseMessage(msg, userId, filename))
          } catch (err) {
            warnings.push(
              createParseWarning('MESSAGE_PARSE_FAILED', `Failed to parse message ${msg._id}: ${err instanceof Error ? err.message : 'Unknown error'}`, {
                field: 'messages',
                context: { messageId: msg._id },
              }),
            )
          }
        }
      }

      // Create raw records
      const rawRecords: RawRecord[] = [
        {
          platform: 'tinder',
          entity: 'profile',
          source: filename,
          observedAt: new Date().toISOString(),
          data: data as unknown as Record<string, unknown>,
        },
      ]

      // Calculate metadata
      const dateRange = calculateDateRange(messages)

      const result: ParseResult = {
        success: true,
        data: {
          participants: Array.from(participantMap.values()),
          matches,
          messages,
          rawRecords,
        },
        metadata: {
          platform: 'tinder',
          parserVersion: this.version,
          messageCount: messages.length,
          matchCount: matches.length,
          participantCount: participantMap.size,
          dateRange,
        },
        schemaSnapshot: schemaValidation.snapshot,
        errors: errors.length > 0 ? errors : undefined,
        warnings: warnings.length > 0 ? warnings : undefined,
      }

      // Validate parsed result
      const resultValidation = validateParseResult(result)
      if (resultValidation.errors.length > 0) {
        result.errors = [...(result.errors || []), ...resultValidation.errors]
      }
      if (resultValidation.warnings.length > 0) {
        result.warnings = [...(result.warnings || []), ...resultValidation.warnings]
      }

      return result
    } catch (err) {
      return {
        success: false,
        errors: [
          createParseError('PARSE_FAILED', `Unexpected parsing error: ${err instanceof Error ? err.message : 'Unknown error'}`, {
            severity: 'critical',
          }),
        ],
      }
    }
  }

  /**
   * Validate Tinder JSON structure
   */
  validate(content: string): { valid: boolean; errors: ParseError[] } {
    const errors: ParseError[] = []

    try {
      const data = JSON.parse(content)

      if (typeof data !== 'object' || data === null) {
        errors.push(createParseError('INVALID_STRUCTURE', 'Root element must be an object'))
      }

      // Check for expected top-level fields
      if (!data.messages && !data.matches) {
        errors.push(
          createParseError('MISSING_DATA', 'File must contain at least "messages" or "matches" field', {
            severity: 'critical',
          }),
        )
      }

      if (data.messages && !Array.isArray(data.messages)) {
        errors.push(createParseError('INVALID_MESSAGES', '"messages" field must be an array'))
      }

      if (data.matches && !Array.isArray(data.matches)) {
        errors.push(createParseError('INVALID_MATCHES', '"matches" field must be an array'))
      }
    } catch (err) {
      errors.push(
        createParseError('INVALID_JSON', `Invalid JSON: ${err instanceof Error ? err.message : 'Unknown error'}`, {
          severity: 'critical',
        }),
      )
    }

    return {
      valid: errors.length === 0,
      errors,
    }
  }

  /**
   * Parse user profile
   */
  private parseUserProfile(user: TinderUser, userId: string, source: string): ParticipantProfile {
    return {
      id: userId,
      platform: 'tinder',
      isUser: true,
      age: user.birth_date ? this.calculateAge(user.birth_date) : undefined,
      genderLabel: user.gender !== undefined ? this.parseGender(user.gender) : undefined,
      raw: {
        platform: 'tinder',
        entity: 'profile',
        source,
        observedAt: new Date().toISOString(),
        data: user as unknown as Record<string, unknown>,
      },
    }
  }

  /**
   * Parse match participant
   */
  private parseParticipant(person: TinderPerson, source: string): ParticipantProfile {
    const traits: string[] = []

    // Extract job titles
    if (person.jobs) {
      for (const job of person.jobs) {
        if (job.title?.name) traits.push(job.title.name)
        if (job.company?.name) traits.push(job.company.name)
      }
    }

    // Extract schools
    if (person.schools) {
      for (const school of person.schools) {
        if (school.name) traits.push(school.name)
      }
    }

    // Known fields that are mapped to normalized structure
    const knownFields = ['_id', 'name', 'birth_date', 'gender', 'bio', 'jobs', 'schools']

    // Extract unknown fields into attributes
    const attributes = extractUnknownFields(person as unknown as Record<string, unknown>, knownFields)

    return {
      id: person._id,
      platform: 'tinder',
      name: person.name,
      age: person.birth_date ? this.calculateAge(person.birth_date) : undefined,
      genderLabel: person.gender !== undefined ? this.parseGender(person.gender) : undefined,
      traits: traits.length > 0 ? traits : undefined,
      isUser: false,
      attributes,
      raw: {
        platform: 'tinder',
        entity: 'profile',
        source,
        observedAt: new Date().toISOString(),
        data: person as unknown as Record<string, unknown>,
      },
    }
  }

  /**
   * Parse match context
   */
  private parseMatch(
    match: TinderMatch,
    userId: string,
    matchPersonId: string,
    source: string,
  ): MatchContext {
    // Known fields that are mapped to normalized structure
    const knownFields = [
      '_id',
      'person',
      'created_date',
      'last_activity_date',
      'is_super_like',
      'is_boost_match',
      'is_tutorial',
      'closed',
    ]

    // Extract unknown fields into attributes
    const unknownAttrs = extractUnknownFields(match as unknown as Record<string, unknown>, knownFields)

    // Combine known attributes with unknown fields
    const attributes = {
      is_super_like: match.is_super_like ?? false,
      is_boost_match: match.is_boost_match ?? false,
      is_tutorial: match.is_tutorial ?? false,
      ...unknownAttrs,
    }

    return {
      id: match._id,
      platform: 'tinder',
      createdAt: match.created_date,
      closedAt: match.closed ? match.last_activity_date : undefined,
      origin: match.is_super_like ? 'super-like' : match.is_boost_match ? 'boost' : 'like',
      status: match.closed ? 'closed' : 'active',
      participants: [userId, matchPersonId],
      attributes,
      raw: {
        platform: 'tinder',
        entity: 'match',
        source,
        observedAt: new Date().toISOString(),
        data: match as unknown as Record<string, unknown>,
      },
    }
  }

  /**
   * Parse message
   */
  private parseMessage(msg: TinderMessage, userId: string, source: string): NormalizedMessage {
    // Known fields that are mapped to normalized structure
    const knownFields = [
      '_id',
      'match_id',
      'sent_date',
      'message',
      'from',
      'to',
      'liked',
      'reactions',
    ]

    // Extract unknown fields into attributes
    const attributes = extractUnknownFields(msg as unknown as Record<string, unknown>, knownFields)

    return {
      id: msg._id,
      matchId: msg.match_id,
      senderId: msg.from,
      sentAt: msg.sent_date,
      body: msg.message,
      direction: msg.from === userId ? 'user' : 'match',
      reactions:
        msg.reactions && msg.reactions.length > 0
          ? msg.reactions.map((r) => ({
              emoji: r.emoji,
              actorId: r.actor,
              sentAt: r.sent_date,
            }))
          : undefined,
      attributes,
      raw: {
        platform: 'tinder',
        entity: 'message',
        source,
        observedAt: new Date().toISOString(),
        data: msg as unknown as Record<string, unknown>,
      },
    }
  }

  /**
   * Calculate age from birth date
   */
  private calculateAge(birthDate: string): number | undefined {
    try {
      const birth = new Date(birthDate)
      const today = new Date()
      let age = today.getFullYear() - birth.getFullYear()
      const monthDiff = today.getMonth() - birth.getMonth()

      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--
      }

      return age > 0 && age < 120 ? age : undefined
    } catch {
      return undefined
    }
  }

  /**
   * Parse gender code to label
   */
  private parseGender(gender: number): string {
    // Tinder uses: 0 = male, 1 = female, -1 = non-binary/other
    switch (gender) {
      case 0:
        return 'Male'
      case 1:
        return 'Female'
      case -1:
        return 'Non-binary'
      default:
        return 'Other'
    }
  }
}

/**
 * Export singleton instance
 */
export const tinderParser = new TinderParser()
