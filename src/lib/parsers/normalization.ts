/**
 * Data normalization utilities
 *
 * Handles timestamp normalization and participant deduplication
 */

import { parseISO, formatISO, isValid } from 'date-fns'
import { toZonedTime } from 'date-fns-tz'
import type { ParticipantProfile, Platform } from '@/types/data-model'

/**
 * Normalize a timestamp string to ISO format
 *
 * Handles various input formats:
 * - ISO 8601 strings (with or without timezone)
 * - Unix timestamps (milliseconds or seconds)
 * - Date objects
 *
 * @param timestamp - Input timestamp in any format
 * @param timezone - Optional timezone (defaults to UTC)
 * @returns ISO 8601 string or null if invalid
 */
export function normalizeTimestamp(
  timestamp: string | number | Date | null | undefined,
  timezone = 'UTC',
): string | null {
  if (!timestamp) return null

  try {
    let date: Date

    if (timestamp instanceof Date) {
      date = timestamp
    } else if (typeof timestamp === 'number') {
      // Handle Unix timestamps (assume milliseconds if > year 2000 in seconds)
      const msTimestamp = timestamp > 10000000000 ? timestamp : timestamp * 1000
      date = new Date(msTimestamp)
    } else if (typeof timestamp === 'string') {
      // Try parsing as ISO string
      date = parseISO(timestamp)

      // If invalid, try as direct Date constructor
      if (!isValid(date)) {
        date = new Date(timestamp)
      }
    } else {
      return null
    }

    // Validate the resulting date
    if (!isValid(date)) {
      return null
    }

    // For UTC, just format directly to avoid timezone conversion issues
    if (timezone === 'UTC') {
      return date.toISOString()
    }

    // Convert to specified timezone and format as ISO
    const zonedDate = toZonedTime(date, timezone)
    return formatISO(zonedDate)
  } catch (error) {
    console.warn('Failed to normalize timestamp:', timestamp, error)
    return null
  }
}

/**
 * Participant identity for deduplication
 */
interface ParticipantIdentity {
  id: string
  platform: Platform
  name?: string
  nameNormalized?: string
}

/**
 * Normalize a name for comparison (lowercase, trim, remove extra spaces)
 */
function normalizeName(name: string | undefined): string | undefined {
  if (!name) return undefined
  return name.toLowerCase().trim().replace(/\s+/g, ' ')
}

/**
 * Check if two participants are the same based on identity heuristics
 */
function isSameParticipant(a: ParticipantIdentity, b: ParticipantIdentity): boolean {
  // Same platform and ID - definite match
  if (a.platform === b.platform && a.id === b.id) {
    return true
  }

  // Different platforms - check name similarity
  if (a.platform !== b.platform && a.nameNormalized && b.nameNormalized) {
    // Exact name match across platforms
    if (a.nameNormalized === b.nameNormalized) {
      return true
    }
  }

  return false
}

/**
 * Merge two participant profiles, preferring more complete data
 */
function mergeParticipants(a: ParticipantProfile, b: ParticipantProfile): ParticipantProfile {
  return {
    id: a.id, // Keep first ID as canonical
    platform: a.platform,
    name: a.name || b.name,
    age: a.age ?? b.age,
    genderLabel: a.genderLabel || b.genderLabel,
    location: a.location || b.location,
    prompts: [...(a.prompts || []), ...(b.prompts || [])],
    traits: [...new Set([...(a.traits || []), ...(b.traits || [])])],
    isUser: a.isUser || b.isUser,
    raw: a.raw, // Keep first raw data
  }
}

/**
 * Deduplicate participant list
 *
 * Uses heuristics to identify duplicate participants:
 * - Same platform + ID = same person
 * - Same name across platforms = likely same person
 *
 * @param participants - List of participants to deduplicate
 * @returns Deduplicated list with merged data
 */
export function deduplicateParticipants(
  participants: ParticipantProfile[],
): ParticipantProfile[] {
  if (participants.length === 0) return []

  // Create identity map
  const identities = participants.map((p) => ({
    id: p.id,
    platform: p.platform,
    name: p.name,
    nameNormalized: normalizeName(p.name),
  }))

  // Track which participants have been merged
  const merged = new Set<number>()
  const result: ParticipantProfile[] = []

  for (let i = 0; i < participants.length; i++) {
    if (merged.has(i)) continue

    let current = participants[i]

    // Look for duplicates
    for (let j = i + 1; j < participants.length; j++) {
      if (merged.has(j)) continue

      if (isSameParticipant(identities[i], identities[j])) {
        // Merge the participants
        current = mergeParticipants(current, participants[j])
        merged.add(j)
      }
    }

    result.push(current)
  }

  return result
}

/**
 * Create a canonical participant ID that's stable across platforms
 *
 * Uses name-based hashing for cross-platform identity
 */
export function createCanonicalId(participant: ParticipantProfile): string {
  // For user participants, use a stable "user" ID
  if (participant.isUser) {
    return 'user'
  }

  // Use platform + original ID as canonical
  return `${participant.platform}_${participant.id}`
}

/**
 * Normalize all timestamps in a parsed dataset
 */
export function normalizeTimestamps<T extends Record<string, unknown>>(
  data: T,
  timestampFields: string[],
  timezone = 'UTC',
): T {
  const normalized: Record<string, unknown> = { ...data }

  for (const field of timestampFields) {
    if (field in normalized) {
      const value = normalized[field]
      if (value) {
        normalized[field] = normalizeTimestamp(value as string | number | Date, timezone)
      }
    }
  }

  return normalized as T
}
