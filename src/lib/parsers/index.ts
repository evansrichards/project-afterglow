/**
 * Parser factory and orchestration
 */

import type { Platform } from '@/types/data-model'
import type { ExtractedFile } from '@lib/upload/zip-extractor'
import type { DataParser, ParseResult } from './types'
import { tinderParser } from './tinder-parser'
import { hingeParser } from './hinge-parser'
import { createParseError } from './types'
import { deduplicateParticipants, normalizeTimestamp } from './normalization'

/**
 * Get parser for a specific platform
 */
export function getParser(platform: Platform): DataParser {
  switch (platform) {
    case 'tinder':
      return tinderParser
    case 'hinge':
      return hingeParser
    default:
      throw new Error(`No parser available for platform: ${platform}`)
  }
}

/**
 * Parse extracted files from a ZIP or single file
 */
export async function parseExtractedFiles(
  files: ExtractedFile[],
  platform: Platform,
): Promise<ParseResult> {
  if (files.length === 0) {
    return {
      success: false,
      errors: [createParseError('NO_FILES', 'No files to parse', { severity: 'critical' })],
    }
  }

  const parser = getParser(platform)

  // For Tinder, expect a single JSON file
  if (platform === 'tinder') {
    const jsonFile = files.find((f) => f.extension === 'json')
    if (!jsonFile) {
      return {
        success: false,
        errors: [
          createParseError('NO_JSON_FILE', 'Tinder export must contain a JSON file', {
            severity: 'critical',
          }),
        ],
      }
    }

    const result = await parser.parse(jsonFile.content, jsonFile.filename)

    // Apply normalization and deduplication
    if (result.success && result.data) {
      result.data.participants = deduplicateParticipants(result.data.participants)

      // Normalize timestamps in messages
      result.data.messages = result.data.messages.map((msg) => ({
        ...msg,
        sentAt: normalizeTimestamp(msg.sentAt) || msg.sentAt,
        reactions: msg.reactions?.map((r) => ({
          ...r,
          sentAt: normalizeTimestamp(r.sentAt) || r.sentAt,
        })),
      }))

      // Normalize timestamps in matches
      result.data.matches = result.data.matches.map((match) => ({
        ...match,
        createdAt: normalizeTimestamp(match.createdAt) || match.createdAt,
        closedAt: match.closedAt ? normalizeTimestamp(match.closedAt) || match.closedAt : undefined,
      }))

      // Update participant count after deduplication
      if (result.metadata) {
        result.metadata.participantCount = result.data.participants.length
      }
    }

    return result
  }

  // For Hinge, parse CSV or JSON files and merge results
  if (platform === 'hinge') {
    // Modern Hinge exports use JSON, legacy exports use CSV
    const dataFiles = files.filter((f) => f.extension === 'csv' || f.extension === 'json')
    if (dataFiles.length === 0) {
      return {
        success: false,
        errors: [
          createParseError('NO_DATA_FILES', 'Hinge export must contain CSV or JSON files', {
            severity: 'critical',
          }),
        ],
      }
    }

    // Parse each file
    const results = await Promise.all(
      dataFiles.map((file) => parser.parse(file.content, file.filename)),
    )

    // Check if any parsing failed
    const failures = results.filter((r) => !r.success)
    if (failures.length === results.length) {
      // All failed
      return {
        success: false,
        errors: failures.flatMap((f) => f.errors || []),
      }
    }

    // Merge successful results
    const merged = mergeParseResults(results.filter((r) => r.success), platform)

    // Apply normalization and deduplication
    if (merged.success && merged.data) {
      merged.data.participants = deduplicateParticipants(merged.data.participants)

      // Normalize timestamps in messages
      merged.data.messages = merged.data.messages.map((msg) => ({
        ...msg,
        sentAt: normalizeTimestamp(msg.sentAt) || msg.sentAt,
      }))

      // Normalize timestamps in matches
      merged.data.matches = merged.data.matches.map((match) => ({
        ...match,
        createdAt: normalizeTimestamp(match.createdAt) || match.createdAt,
        closedAt: match.closedAt ? normalizeTimestamp(match.closedAt) || match.closedAt : undefined,
      }))

      // Update participant count after deduplication
      if (merged.metadata) {
        merged.metadata.participantCount = merged.data.participants.length
      }
    }

    return merged
  }

  return {
    success: false,
    errors: [
      createParseError('UNKNOWN_PLATFORM', `Unknown platform: ${platform}`, { severity: 'critical' }),
    ],
  }
}

/**
 * Merge multiple parse results (for Hinge with separate matches/messages files)
 */
function mergeParseResults(results: ParseResult[], platform: Platform): ParseResult {
  const allParticipants = new Map<
    string,
    NonNullable<ParseResult['data']>['participants'][0]
  >()
  const allMatches: NonNullable<ParseResult['data']>['matches'] = []
  const allMessages: NonNullable<ParseResult['data']>['messages'] = []
  const allRawRecords: NonNullable<ParseResult['data']>['rawRecords'] = []
  const allErrors: ParseResult['errors'] = []
  const allWarnings: ParseResult['warnings'] = []

  let totalMessageCount = 0
  let totalMatchCount = 0

  for (const result of results) {
    if (!result.data) continue

    // Merge participants (deduplicate by ID)
    for (const participant of result.data.participants) {
      if (!allParticipants.has(participant.id)) {
        allParticipants.set(participant.id, participant)
      }
    }

    // Merge matches
    allMatches.push(...result.data.matches)
    totalMatchCount += result.data.matches.length

    // Merge messages
    allMessages.push(...result.data.messages)
    totalMessageCount += result.data.messages.length

    // Merge raw records
    allRawRecords.push(...result.data.rawRecords)

    // Merge errors and warnings
    if (result.errors) allErrors.push(...result.errors)
    if (result.warnings) allWarnings.push(...result.warnings)
  }

  // Calculate date range from all messages
  const dateRange =
    allMessages.length > 0
      ? (() => {
          const dates = allMessages
            .map((m: { sentAt: string }) => new Date(m.sentAt).getTime())
            .filter((d: number) => !isNaN(d))
          if (dates.length === 0) return undefined
          return {
            earliest: new Date(Math.min(...dates)).toISOString(),
            latest: new Date(Math.max(...dates)).toISOString(),
          }
        })()
      : undefined

  return {
    success: true,
    data: {
      participants: Array.from(allParticipants.values()),
      matches: allMatches,
      messages: allMessages,
      rawRecords: allRawRecords,
    },
    metadata: {
      platform,
      parserVersion: results[0].metadata?.parserVersion || '1.0.0',
      messageCount: totalMessageCount,
      matchCount: totalMatchCount,
      participantCount: allParticipants.size,
      dateRange,
    },
    errors: allErrors.length > 0 ? allErrors : undefined,
    warnings: allWarnings.length > 0 ? allWarnings : undefined,
  }
}

// Export parser instances and types
export { tinderParser, hingeParser }
export type { DataParser, ParseResult, ParseError, ParseWarning } from './types'
