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
import { captureSchemaSnapshot, validateParseResult } from './validation'

const PARSER_VERSION = '1.0.0'
const USER_ID = 'user' // Hinge doesn't provide user ID, use constant

/**
 * Hinge CSV Parser implementation
 */
export class HingeParser implements DataParser {
  platform = 'hinge' as const
  version = PARSER_VERSION

  /**
   * Parse Hinge CSV exports (matches and messages)
   */
  async parse(content: string, filename: string): Promise<ParseResult> {
    try {
      // Determine if this is matches or messages file
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
          participants.push({
            id: matchPersonId,
            platform: 'hinge',
            name: matchData.profile_name,
            age: matchData.profile_age ? parseInt(matchData.profile_age, 10) : undefined,
            location: matchData.profile_location,
            isUser: false,
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

        messages.push({
          id: messageId,
          matchId,
          senderId: isUserMessage ? USER_ID : `match_${matchId}_person`,
          sentAt: msgData.sent_at || new Date().toISOString(),
          body: msgData.message_text || '',
          direction: isUserMessage ? 'user' : 'match',
          delivery,
          promptContext,
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
