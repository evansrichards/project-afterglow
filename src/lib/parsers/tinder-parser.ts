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
        data = JSON.parse(content)
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

      // Validate structure
      const validation = this.validate(content)
      if (!validation.valid) {
        return {
          success: false,
          errors: validation.errors,
        }
      }

      // Extract user ID
      const userId = data.user?._id || 'unknown_user'

      // Parse participants
      const participantMap = new Map<string, ParticipantProfile>()

      // Add user profile
      if (data.user) {
        participantMap.set(userId, this.parseUserProfile(data.user, filename))
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

      return {
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
        errors: errors.length > 0 ? errors : undefined,
        warnings: warnings.length > 0 ? warnings : undefined,
      }
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
  private parseUserProfile(user: TinderUser, source: string): ParticipantProfile {
    return {
      id: user._id,
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

    return {
      id: person._id,
      platform: 'tinder',
      name: person.name,
      age: person.birth_date ? this.calculateAge(person.birth_date) : undefined,
      genderLabel: person.gender !== undefined ? this.parseGender(person.gender) : undefined,
      traits: traits.length > 0 ? traits : undefined,
      isUser: false,
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
    return {
      id: match._id,
      platform: 'tinder',
      createdAt: match.created_date,
      closedAt: match.closed ? match.last_activity_date : undefined,
      origin: match.is_super_like ? 'super-like' : match.is_boost_match ? 'boost' : 'like',
      status: match.closed ? 'closed' : 'active',
      participants: [userId, matchPersonId],
      attributes: {
        is_super_like: match.is_super_like ?? false,
        is_boost_match: match.is_boost_match ?? false,
        is_tutorial: match.is_tutorial ?? false,
      },
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
