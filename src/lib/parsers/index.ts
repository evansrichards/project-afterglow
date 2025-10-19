/**
 * Parser factory and orchestration
 */

import type { Platform } from '@/types/data-model'
import type { ExtractedFile } from '@lib/upload/zip-extractor'
import type { DataParser, ParseResult } from './types'
import { tinderParser } from './tinder-parser'
import { hingeParser } from './hinge-parser'
import { createParseError } from './types'

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

    return parser.parse(jsonFile.content, jsonFile.filename)
  }

  // For Hinge, parse CSV files and merge results
  if (platform === 'hinge') {
    const csvFiles = files.filter((f) => f.extension === 'csv')
    if (csvFiles.length === 0) {
      return {
        success: false,
        errors: [
          createParseError('NO_CSV_FILES', 'Hinge export must contain CSV files', {
            severity: 'critical',
          }),
        ],
      }
    }

    // Parse each CSV file
    const results = await Promise.all(
      csvFiles.map((file) => parser.parse(file.content, file.filename)),
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
    return mergeParseResults(results.filter((r) => r.success), platform)
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
