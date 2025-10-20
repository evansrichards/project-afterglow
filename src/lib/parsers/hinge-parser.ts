/**
 * Hinge CSV Parser
 *
 * Parses Hinge data export CSV files into unified data model
 */

import type {
  ParticipantProfile,
  MatchContext,
  NormalizedMessage,
  RawRecord,
} from '@/types/data-model'
import type { DataParser, ParseResult, ParseError } from './types'
import { createParseError, createParseWarning, calculateDateRange } from './types'
import { captureSchemaSnapshot, validateParseResult, extractUnknownFields } from './validation'

const PARSER_VERSION = '1.0.0'
const USER_ID = 'user' // Hinge doesn't provide user ID, use constant

/**
 * Hinge CSV Parser implementation
 */
export class HingeParser implements DataParser {
  platform = 'hinge' as const
  version = PARSER_VERSION

  /**
   * Parse Hinge exports (CSV or JSON format)
   */
  async parse(content: string, filename: string): Promise<ParseResult> {
    try {
      // Check if this is JSON format (newer Hinge exports)
      const isJsonFormat = filename.toLowerCase().endsWith('.json') || content.trim().startsWith('[') || content.trim().startsWith('{')

      if (isJsonFormat) {
        return this.parseJSON(content)
      }

      // Legacy CSV format
      const isMatchesFile = filename.toLowerCase().includes('match')
      const isMessagesFile = filename.toLowerCase().includes('message')

      if (!isMatchesFile && !isMessagesFile) {
        return {
          success: false,
          errors: [
            createParseError('UNKNOWN_FILE_TYPE', 'Cannot determine if file contains matches or messages', {
              severity: 'critical',
              context: { filename },
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

      if (isMatchesFile) {
        return this.parseMatches(content, filename)
      } else {
        return this.parseMessages(content, filename)
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
   * Parse modern Hinge JSON export format
   */
  private parseJSON(content: string): ParseResult {
    try {
      const data = JSON.parse(content)

      if (!Array.isArray(data)) {
        return {
          success: false,
          errors: [
            createParseError('INVALID_JSON', 'Hinge JSON export must be an array of matches', {
              severity: 'critical',
            }),
          ],
        }
      }

      const messages: NormalizedMessage[] = []
      const matches: MatchContext[] = []
      const participants = new Map<string, ParticipantProfile>()
      const warnings: ReturnType<typeof createParseWarning>[] = []

      // Add user profile
      participants.set(USER_ID, {
        id: USER_ID,
        platform: 'hinge',
        isUser: true,
      })

      // Process each match
      for (let matchIndex = 0; matchIndex < data.length; matchIndex++) {
        const matchData = data[matchIndex]
        const matchId = `match_${matchIndex}`
        const otherParticipantId = `participant_${matchIndex}`

        // Extract match timestamp
        const matchTimestamp = matchData.match?.[0]?.timestamp || matchData.like?.[0]?.timestamp
        if (matchTimestamp) {
          matches.push({
            id: matchId,
            platform: 'hinge',
            createdAt: new Date(matchTimestamp).toISOString(),
            status: 'active',
            participants: [USER_ID, otherParticipantId],
            attributes: {},
          })
        }

        // Add participant
        participants.set(otherParticipantId, {
          id: otherParticipantId,
          platform: 'hinge',
          isUser: false,
        })

        // Process chats
        if (matchData.chats && Array.isArray(matchData.chats)) {
          for (let i = 0; i < matchData.chats.length; i++) {
            const chat = matchData.chats[i]

            if (chat.body && chat.timestamp) {
              messages.push({
                id: `${matchId}_msg_${i}`,
                matchId,
                senderId: USER_ID, // Hinge doesn't specify sender, assume user
                sentAt: new Date(chat.timestamp).toISOString(),
                body: chat.body,
                direction: 'user',
              })
            }
          }
        }
      }

      // Capture schema snapshot
      const schemaSnapshot = captureSchemaSnapshot(data, 'hinge', PARSER_VERSION)

      // Validate result
      const parseResult: ParseResult = {
        success: true,
        data: {
          participants: Array.from(participants.values()),
          matches,
          messages,
          rawRecords: [], // Not tracked for JSON format
        },
        metadata: {
          platform: 'hinge',
          parserVersion: PARSER_VERSION,
          messageCount: messages.length,
          matchCount: matches.length,
          participantCount: participants.size,
          dateRange: calculateDateRange(messages),
        },
        schemaSnapshot,
      }

      const validationResult = validateParseResult(parseResult)
      warnings.push(...validationResult.warnings)

      if (validationResult.errors.length > 0) {
        return {
          success: false,
          errors: validationResult.errors,
          warnings: warnings.length > 0 ? warnings : undefined,
        }
      }

      return {
        ...parseResult,
        warnings: warnings.length > 0 ? warnings : undefined,
      }
    } catch (err) {
      return {
        success: false,
        errors: [
          createParseError('JSON_PARSE_ERROR', `Failed to parse JSON: ${err instanceof Error ? err.message : 'Unknown error'}`, {
            severity: 'critical',
          }),
        ],
      }
    }
  }

  /**
   * Parse matches CSV
   */
  private parseMatches(content: string, filename: string): ParseResult {
    const rows = this.parseCSV(content)
    const warnings: ReturnType<typeof createParseWarning>[] = []

    if (rows.length === 0) {
      return {
        success: false,
        errors: [createParseError('EMPTY_FILE', 'Matches file contains no data rows')],
      }
    }

    const header = rows[0]
    const expectedFields = ['match_id', 'matched_at']

    // Validate header
    const hasRequiredFields = expectedFields.every((field) =>
      header.some((h) => h.toLowerCase().includes(field.toLowerCase())),
    )

    if (!hasRequiredFields) {
      return {
        success: false,
        errors: [
          createParseError('INVALID_HEADER', `Matches file must contain: ${expectedFields.join(', ')}`),
        ],
      }
    }

    // Parse matches
    const matches: MatchContext[] = []
    const participants: ParticipantProfile[] = []
    const participantIds = new Set<string>()

    // Add user participant
    participants.push({
      id: USER_ID,
      platform: 'hinge',
      isUser: true,
    })

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i]
      if (row.length === 0 || row.every((cell) => !cell)) continue // Skip empty rows

      try {
        const matchData = this.rowToObject(header, row)

        const matchId = matchData.match_id || matchData.conversation_id || `match_${i}`
        const matchPersonId = `match_${matchId}_person`

        // Create match participant
        if (!participantIds.has(matchPersonId)) {
          // Known participant fields
          const knownParticipantFields = ['profile_name', 'profile_age', 'profile_location']
          const participantAttributes = extractUnknownFields(matchData, knownParticipantFields)

          participants.push({
            id: matchPersonId,
            platform: 'hinge',
            name: matchData.profile_name,
            age: matchData.profile_age ? parseInt(matchData.profile_age, 10) : undefined,
            location: matchData.profile_location,
            isUser: false,
            attributes: participantAttributes,
          })
          participantIds.add(matchPersonId)
        }

        // Parse match status
        let status: 'active' | 'closed' | 'unmatched' | 'expired' = 'active'
        if (matchData.match_status) {
          const statusLower = matchData.match_status.toLowerCase()
          if (statusLower === 'closed') status = 'closed'
          else if (statusLower === 'unmatched') status = 'unmatched'
          else if (statusLower === 'expired') status = 'expired'
        }

        // Known match fields
        const knownMatchFields = [
          'match_id',
          'conversation_id',
          'matched_at',
          'match_type',
          'match_origin',
          'match_status',
          'icebreaker_sent',
          'profile_name',
          'profile_age',
          'profile_location',
        ]
        const unknownAttrs = extractUnknownFields(matchData, knownMatchFields)

        matches.push({
          id: matchId,
          platform: 'hinge',
          createdAt: matchData.matched_at || new Date().toISOString(),
          origin: matchData.match_type || matchData.match_origin,
          status,
          participants: [USER_ID, matchPersonId],
          attributes: {
            conversation_id: matchData.conversation_id,
            icebreaker_sent: matchData.icebreaker_sent === 'true',
            ...unknownAttrs,
          },
          raw: {
            platform: 'hinge',
            entity: 'match',
            source: filename,
            observedAt: new Date().toISOString(),
            data: matchData,
          },
        })
      } catch (err) {
        warnings.push(
          createParseWarning('MATCH_PARSE_FAILED', `Failed to parse match on line ${i + 1}: ${err instanceof Error ? err.message : 'Unknown error'}`, {
            line: i + 1,
          }),
        )
      }
    }

    // Create raw record
    const rawRecords: RawRecord[] = [
      {
        platform: 'hinge',
        entity: 'match',
        source: filename,
        observedAt: new Date().toISOString(),
        data: { rows: rows.slice(1).map((row) => this.rowToObject(header, row)) },
      },
    ]

    // Create raw data structure for schema snapshot
    const rawData = {
      matches: rows.slice(1).map((row) => this.rowToObject(header, row)),
    }

    const result: ParseResult = {
      success: true,
      data: {
        participants,
        matches,
        messages: [],
        rawRecords,
      },
      metadata: {
        platform: 'hinge',
        parserVersion: this.version,
        messageCount: 0,
        matchCount: matches.length,
        participantCount: participants.length,
      },
      schemaSnapshot: captureSchemaSnapshot(rawData, 'hinge', this.version),
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
  }

  /**
   * Parse messages CSV
   */
  private parseMessages(content: string, filename: string): ParseResult {
    const rows = this.parseCSV(content)
    const warnings: ReturnType<typeof createParseWarning>[] = []

    if (rows.length === 0) {
      return {
        success: false,
        errors: [createParseError('EMPTY_FILE', 'Messages file contains no data rows')],
      }
    }

    const header = rows[0]
    const expectedFields = ['sent_at', 'message_text']

    // Validate header
    const hasRequiredFields = expectedFields.some((field) =>
      header.some((h) => h.toLowerCase().includes(field.toLowerCase())),
    )

    if (!hasRequiredFields) {
      return {
        success: false,
        errors: [
          createParseError('INVALID_HEADER', `Messages file must contain timestamp and message text fields`),
        ],
      }
    }

    // Parse messages
    const messages: NormalizedMessage[] = []
    const participantNames = new Set<string>()

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i]
      if (row.length === 0 || row.every((cell) => !cell)) continue // Skip empty rows

      try {
        const msgData = this.rowToObject(header, row)

        const messageId = `msg_${i}`
        const matchId = msgData.match_id || msgData.conversation_id || 'unknown_match'
        const senderRole = msgData.sender_role?.toLowerCase() || 'unknown'
        const isUserMessage = senderRole === 'user'

        // Track participant names
        if (msgData.sender_name) participantNames.add(msgData.sender_name)
        if (msgData.recipient_name) participantNames.add(msgData.recipient_name)

        // Parse delivery status
        let delivery: 'sent' | 'delivered' | 'read' | 'unknown' = 'unknown'
        if (msgData.delivery_status) {
          const statusLower = msgData.delivery_status.toLowerCase()
          if (statusLower === 'sent') delivery = 'sent'
          else if (statusLower === 'delivered') delivery = 'delivered'
          else if (statusLower === 'read') delivery = 'read'
        }

        // Parse prompt context
        let promptContext: { title?: string; response?: string } | undefined
        const hasValidTitle = msgData.prompt_title && msgData.prompt_title !== 'None'
        const hasValidResponse = msgData.prompt_response && msgData.prompt_response !== 'None'

        if (hasValidTitle || hasValidResponse) {
          promptContext = {
            title: hasValidTitle ? msgData.prompt_title : undefined,
            response: hasValidResponse ? msgData.prompt_response : undefined,
          }
        }

        // Known message fields
        const knownMessageFields = [
          'match_id',
          'conversation_id',
          'sent_at',
          'message_text',
          'sender_role',
          'sender_name',
          'recipient_name',
          'delivery_status',
          'prompt_title',
          'prompt_response',
        ]
        const messageAttributes = extractUnknownFields(msgData, knownMessageFields)

        messages.push({
          id: messageId,
          matchId,
          senderId: isUserMessage ? USER_ID : `match_${matchId}_person`,
          sentAt: msgData.sent_at || new Date().toISOString(),
          body: msgData.message_text || '',
          direction: isUserMessage ? 'user' : 'match',
          delivery,
          promptContext,
          attributes: messageAttributes,
          raw: {
            platform: 'hinge',
            entity: 'message',
            source: filename,
            observedAt: new Date().toISOString(),
            data: msgData,
          },
        })
      } catch (err) {
        warnings.push(
          createParseWarning('MESSAGE_PARSE_FAILED', `Failed to parse message on line ${i + 1}: ${err instanceof Error ? err.message : 'Unknown error'}`, {
            line: i + 1,
          }),
        )
      }
    }

    // Create minimal participants list
    const participants: ParticipantProfile[] = [
      {
        id: USER_ID,
        platform: 'hinge',
        isUser: true,
      },
    ]

    // Create raw record
    const rawRecords: RawRecord[] = [
      {
        platform: 'hinge',
        entity: 'message',
        source: filename,
        observedAt: new Date().toISOString(),
        data: { rows: rows.slice(1).map((row) => this.rowToObject(header, row)) },
      },
    ]

    const dateRange = calculateDateRange(messages)

    // Create raw data structure for schema snapshot
    const rawData = {
      messages: rows.slice(1).map((row) => this.rowToObject(header, row)),
    }

    const result: ParseResult = {
      success: true,
      data: {
        participants,
        matches: [],
        messages,
        rawRecords,
      },
      metadata: {
        platform: 'hinge',
        parserVersion: this.version,
        messageCount: messages.length,
        matchCount: 0,
        participantCount: participants.length,
        dateRange,
      },
      schemaSnapshot: captureSchemaSnapshot(rawData, 'hinge', this.version),
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
  }

  /**
   * Validate CSV structure
   */
  validate(content: string): { valid: boolean; errors: ParseError[] } {
    const errors: ParseError[] = []

    if (!content || content.trim().length === 0) {
      errors.push(createParseError('EMPTY_FILE', 'CSV file is empty', { severity: 'critical' }))
      return { valid: false, errors }
    }

    const rows = this.parseCSV(content)

    if (rows.length < 2) {
      errors.push(
        createParseError('INSUFFICIENT_DATA', 'CSV file must contain at least a header row and one data row'),
      )
    }

    return {
      valid: errors.length === 0,
      errors,
    }
  }

  /**
   * Parse CSV content into rows
   */
  private parseCSV(content: string): string[][] {
    const rows: string[][] = []
    let currentRow: string[] = []
    let currentCell = ''
    let inQuotes = false

    for (let i = 0; i < content.length; i++) {
      const char = content[i]
      const nextChar = content[i + 1]

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          // Escaped quote
          currentCell += '"'
          i++ // Skip next quote
        } else {
          // Toggle quote state
          inQuotes = !inQuotes
        }
      } else if (char === ',' && !inQuotes) {
        // End of cell
        currentRow.push(currentCell.trim())
        currentCell = ''
      } else if ((char === '\n' || char === '\r') && !inQuotes) {
        // End of row
        if (char === '\r' && nextChar === '\n') {
          i++ // Skip \n in \r\n
        }
        if (currentCell || currentRow.length > 0) {
          currentRow.push(currentCell.trim())
          if (currentRow.some((cell) => cell.length > 0)) {
            rows.push(currentRow)
          }
          currentRow = []
          currentCell = ''
        }
      } else {
        currentCell += char
      }
    }

    // Add last cell and row
    if (currentCell || currentRow.length > 0) {
      currentRow.push(currentCell.trim())
      if (currentRow.some((cell) => cell.length > 0)) {
        rows.push(currentRow)
      }
    }

    return rows
  }

  /**
   * Convert CSV row to object using header
   */
  private rowToObject(header: string[], row: string[]): Record<string, string> {
    const obj: Record<string, string> = {}
    for (let i = 0; i < header.length; i++) {
      obj[header[i]] = row[i] || ''
    }
    return obj
  }
}

/**
 * Export singleton instance
 */
export const hingeParser = new HingeParser()
