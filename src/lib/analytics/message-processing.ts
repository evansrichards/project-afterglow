/**
 * Message Processing Utilities
 *
 * Simple utilities for processing sanitized message data including:
 * - Basic text cleanup (whitespace normalization, empty message detection)
 * - Timestamp extraction and manipulation
 * - Message counting and grouping
 */

import type { NormalizedMessage } from '@/types/data-model'

/**
 * Text cleanup options
 */
export interface TextCleanupOptions {
  /** Trim leading/trailing whitespace */
  trim?: boolean
  /** Normalize multiple spaces to single space */
  normalizeSpaces?: boolean
  /** Remove zero-width characters */
  removeZeroWidth?: boolean
  /** Convert to lowercase */
  lowercase?: boolean
}

/**
 * Clean and normalize message text
 */
export function cleanMessageText(
  text: string,
  options: TextCleanupOptions = {}
): string {
  const {
    trim = true,
    normalizeSpaces = true,
    removeZeroWidth = true,
    lowercase = false,
  } = options

  let cleaned = text

  // Remove zero-width characters (zero-width space, zero-width joiner, etc.)
  if (removeZeroWidth) {
    cleaned = cleaned.replace(/[\u200B-\u200D\uFEFF]/g, '')
  }

  // Normalize whitespace
  if (normalizeSpaces) {
    cleaned = cleaned.replace(/\s+/g, ' ')
  }

  // Trim
  if (trim) {
    cleaned = cleaned.trim()
  }

  // Lowercase
  if (lowercase) {
    cleaned = cleaned.toLowerCase()
  }

  return cleaned
}

/**
 * Check if a message is empty or contains only whitespace
 */
export function isEmptyMessage(text: string): boolean {
  return cleanMessageText(text).length === 0
}

/**
 * Count words in a message (simple whitespace-based split)
 */
export function countWords(text: string): number {
  const cleaned = cleanMessageText(text)
  if (cleaned.length === 0) return 0
  return cleaned.split(/\s+/).length
}

/**
 * Extract timestamp from message as Date object
 */
export function extractTimestamp(message: NormalizedMessage): Date {
  return new Date(message.sentAt)
}

/**
 * Extract timestamp as milliseconds since epoch
 */
export function extractTimestampMs(message: NormalizedMessage): number {
  return new Date(message.sentAt).getTime()
}

/**
 * Group messages by match ID
 */
export function groupMessagesByMatch(
  messages: NormalizedMessage[]
): Map<string, NormalizedMessage[]> {
  const grouped = new Map<string, NormalizedMessage[]>()

  for (const message of messages) {
    const existing = grouped.get(message.matchId) || []
    existing.push(message)
    grouped.set(message.matchId, existing)
  }

  return grouped
}

/**
 * Sort messages by timestamp (oldest first)
 */
export function sortMessagesByTime(
  messages: NormalizedMessage[],
  ascending = true
): NormalizedMessage[] {
  return [...messages].sort((a, b) => {
    const timeA = extractTimestampMs(a)
    const timeB = extractTimestampMs(b)
    return ascending ? timeA - timeB : timeB - timeA
  })
}

/**
 * Count messages by direction (user vs match)
 */
export interface MessageDirectionCounts {
  user: number
  match: number
  total: number
}

export function countMessagesByDirection(
  messages: NormalizedMessage[]
): MessageDirectionCounts {
  let user = 0
  let match = 0

  for (const message of messages) {
    if (message.direction === 'user') {
      user++
    } else if (message.direction === 'match') {
      match++
    }
  }

  return {
    user,
    match,
    total: messages.length,
  }
}

/**
 * Count messages by sender ID
 */
export function countMessagesBySender(
  messages: NormalizedMessage[]
): Map<string, number> {
  const counts = new Map<string, number>()

  for (const message of messages) {
    const current = counts.get(message.senderId) || 0
    counts.set(message.senderId, current + 1)
  }

  return counts
}

/**
 * Get date range of messages
 */
export interface DateRange {
  earliest: Date
  latest: Date
  durationMs: number
}

export function getMessageDateRange(
  messages: NormalizedMessage[]
): DateRange | null {
  if (messages.length === 0) return null

  const timestamps = messages.map(extractTimestampMs)
  const earliest = Math.min(...timestamps)
  const latest = Math.max(...timestamps)

  return {
    earliest: new Date(earliest),
    latest: new Date(latest),
    durationMs: latest - earliest,
  }
}

/**
 * Filter messages by date range
 */
export function filterMessagesByDateRange(
  messages: NormalizedMessage[],
  startDate: Date,
  endDate: Date
): NormalizedMessage[] {
  const startMs = startDate.getTime()
  const endMs = endDate.getTime()

  return messages.filter(message => {
    const messageMs = extractTimestampMs(message)
    return messageMs >= startMs && messageMs <= endMs
  })
}

/**
 * Filter messages by direction
 */
export function filterMessagesByDirection(
  messages: NormalizedMessage[],
  direction: 'user' | 'match'
): NormalizedMessage[] {
  return messages.filter(message => message.direction === direction)
}

/**
 * Get first message in a conversation
 */
export function getFirstMessage(
  messages: NormalizedMessage[]
): NormalizedMessage | null {
  if (messages.length === 0) return null
  const sorted = sortMessagesByTime(messages, true)
  return sorted[0]
}

/**
 * Get last message in a conversation
 */
export function getLastMessage(
  messages: NormalizedMessage[]
): NormalizedMessage | null {
  if (messages.length === 0) return null
  const sorted = sortMessagesByTime(messages, false)
  return sorted[0]
}

/**
 * Check if a message was sent by the user
 */
export function isUserMessage(message: NormalizedMessage): boolean {
  return message.direction === 'user'
}

/**
 * Check if a message was sent by a match
 */
export function isMatchMessage(message: NormalizedMessage): boolean {
  return message.direction === 'match'
}

/**
 * Get total character count across all messages
 */
export function getTotalCharacterCount(messages: NormalizedMessage[]): number {
  return messages.reduce((sum, message) => sum + message.body.length, 0)
}

/**
 * Get total word count across all messages
 */
export function getTotalWordCount(messages: NormalizedMessage[]): number {
  return messages.reduce((sum, message) => sum + countWords(message.body), 0)
}

/**
 * Get average message length (in characters)
 */
export function getAverageMessageLength(messages: NormalizedMessage[]): number {
  if (messages.length === 0) return 0
  return getTotalCharacterCount(messages) / messages.length
}

/**
 * Group consecutive messages by sender
 */
export interface MessageGroup {
  senderId: string
  direction: 'user' | 'match'
  messages: NormalizedMessage[]
  startTime: Date
  endTime: Date
}

export function groupConsecutiveMessagesBySender(
  messages: NormalizedMessage[]
): MessageGroup[] {
  if (messages.length === 0) return []

  const sorted = sortMessagesByTime(messages, true)
  const groups: MessageGroup[] = []
  let currentGroup: NormalizedMessage[] = [sorted[0]]
  let currentSender = sorted[0].senderId

  for (let i = 1; i < sorted.length; i++) {
    const message = sorted[i]

    if (message.senderId === currentSender) {
      // Same sender, add to current group
      currentGroup.push(message)
    } else {
      // Different sender, save current group and start new one
      groups.push({
        senderId: currentSender,
        direction: currentGroup[0].direction,
        messages: currentGroup,
        startTime: extractTimestamp(currentGroup[0]),
        endTime: extractTimestamp(currentGroup[currentGroup.length - 1]),
      })

      currentGroup = [message]
      currentSender = message.senderId
    }
  }

  // Add final group
  if (currentGroup.length > 0) {
    groups.push({
      senderId: currentSender,
      direction: currentGroup[0].direction,
      messages: currentGroup,
      startTime: extractTimestamp(currentGroup[0]),
      endTime: extractTimestamp(currentGroup[currentGroup.length - 1]),
    })
  }

  return groups
}
