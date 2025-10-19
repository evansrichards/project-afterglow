/**
 * Data model types for Project Afterglow
 * Based on the unified data model from MVP.md
 *
 * This module defines the core TypeScript interfaces for normalized dating app data.
 * All data from different platforms (Tinder, Hinge) is normalized into these unified structures.
 */

/**
 * Supported dating platforms
 */
export type Platform = 'tinder' | 'hinge'

/**
 * Valid types for custom attributes from unknown fields
 * Primitives and arrays of primitives are preserved, complex types are JSON stringified
 */
export type CustomAttributeValue = string | number | boolean | null | string[] | number[]

/**
 * Message direction from user's perspective
 */
export type MessageDirection = 'user' | 'match'

/**
 * Message delivery status
 */
export type DeliveryStatus = 'sent' | 'delivered' | 'read' | 'unknown'

/**
 * Match status
 */
export type MatchStatus = 'active' | 'closed' | 'unmatched' | 'expired'

/**
 * Attachment types
 */
export type AttachmentType = 'image' | 'video' | 'voice' | 'link'

/**
 * Entity types for raw records
 */
export type EntityType = 'match' | 'message' | 'profile'

/**
 * Raw record from source data, preserved for audit trail
 * Contains the original, untouched data from the dating app export
 */
export interface RawRecord {
  /** Platform this record came from */
  platform: Platform
  /** Type of entity this record represents */
  entity: EntityType
  /** Source filename or JSON path */
  source: string
  /** ISO timestamp when this record was captured */
  observedAt: string
  /** Original data payload, untouched for audit trail */
  data: Record<string, unknown>
}

/**
 * Normalized participant profile
 * Represents a person (user or match) with their profile information
 */
export interface ParticipantProfile {
  /** Unique identifier for this participant */
  id: string
  /** Platform this participant is from */
  platform: Platform
  /** Participant's display name */
  name?: string
  /** Calculated age from birth date */
  age?: number
  /** Gender label (e.g., "Male", "Female", "Non-binary") */
  genderLabel?: string
  /** Geographic location */
  location?: string
  /** Profile prompts with responses (common on Hinge) */
  prompts?: Array<{ title: string; response: string }>
  /** Derived traits (e.g., job titles, schools, interests) */
  traits?: string[]
  /** Whether this participant is the user (true) or a match (false) */
  isUser: boolean
  /** Unknown fields from source data captured as custom attributes */
  attributes?: Record<string, CustomAttributeValue>
  /** Optional pointer to original source data */
  raw?: RawRecord
}

/**
 * Normalized match context
 * Represents a connection/match between the user and another participant
 */
export interface MatchContext {
  /** Unique identifier for this match */
  id: string
  /** Platform this match is from */
  platform: Platform
  /** ISO timestamp when match was created */
  createdAt: string
  /** ISO timestamp when match was closed/ended (if applicable) */
  closedAt?: string
  /** How the match originated (e.g., "like", "rose", "boost", "super-like") */
  origin?: string
  /** Current status of the match */
  status: MatchStatus
  /** Array of participant IDs in this match (typically user + one match) */
  participants: string[]
  /** Platform-specific attributes and unknown fields */
  attributes: Record<string, CustomAttributeValue>
  /** Optional pointer to original source data */
  raw?: RawRecord
}

/**
 * Message attachment
 */
export interface MessageAttachment {
  /** Type of attachment */
  type: AttachmentType
  /** URL to the attachment (if available) */
  url?: string
}

/**
 * Message reaction
 */
export interface MessageReaction {
  /** Emoji used for the reaction */
  emoji: string
  /** ID of the participant who reacted */
  actorId: string
  /** ISO timestamp when reaction was sent */
  sentAt: string
}

/**
 * Prompt context for messages responding to profile prompts
 */
export interface PromptContext {
  /** The prompt title/question */
  title?: string
  /** The response to the prompt */
  response?: string
}

/**
 * Normalized message
 * Represents a single message within a match conversation
 */
export interface NormalizedMessage {
  /** Unique identifier for this message */
  id: string
  /** ID of the match this message belongs to */
  matchId: string
  /** ID of the participant who sent the message */
  senderId: string
  /** ISO timestamp when message was sent */
  sentAt: string
  /** Message text content */
  body: string
  /** Direction from user's perspective */
  direction: MessageDirection
  /** Delivery/read status if available */
  delivery?: DeliveryStatus
  /** Context if this message is responding to a profile prompt */
  promptContext?: PromptContext
  /** Reactions to this message (likes, emojis) */
  reactions?: MessageReaction[]
  /** Media attachments */
  attachments?: MessageAttachment[]
  /** Unknown fields from source data captured as custom attributes */
  attributes?: Record<string, CustomAttributeValue>
  /** Optional pointer to original source data */
  raw?: RawRecord
}

/**
 * Schema field mapping for parser adapters
 * Maps platform-specific field names to canonical field names
 */
export interface SchemaFieldMapping {
  /** Canonical field name in normalized data model */
  canonical: keyof NormalizedMessage | keyof MatchContext | keyof ParticipantProfile | string
  /** Known aliases/variants of this field across platforms */
  aliases: string[]
  /** Optional transform function to normalize the value */
  transform?: (value: unknown) => unknown
}

/**
 * Parser adapter interface
 * Defines how to parse and normalize data from a specific platform
 */
export interface ParserAdapter {
  /** Platform this adapter handles */
  platform: Platform
  /** Parser version for tracking schema changes */
  version: string
  /** Detect if given files are from this platform */
  detect: (fileMeta: { name: string; headers: string[] }) => boolean
  /** Field mappings from platform schema to normalized schema */
  fieldMappings: SchemaFieldMapping[]
  /** Normalize raw records into structured data */
  normalize: (records: RawRecord[]) => {
    participants: ParticipantProfile[]
    matches: MatchContext[]
    messages: NormalizedMessage[]
  }
}

/**
 * Date range for a dataset
 */
export interface DateRange {
  /** ISO timestamp of earliest message */
  earliest: string
  /** ISO timestamp of latest message */
  latest: string
}

/**
 * Metadata about a parsed dataset
 * Contains summary statistics and information about the imported data
 */
export interface DatasetMetadata {
  /** Unique identifier for this dataset */
  id: string
  /** Platform the data was imported from */
  platform: Platform
  /** ISO timestamp when data was imported */
  importedAt: string
  /** Version of parser that processed this data */
  parserVersion: string
  /** Total number of messages in dataset */
  messageCount: number
  /** Total number of matches in dataset */
  matchCount: number
  /** Total number of unique participants */
  participantCount: number
  /** Date range of messages (if any messages exist) */
  dateRange?: DateRange
}

/**
 * Complete normalized dataset
 * Contains all parsed and normalized data from a dating app export
 */
export interface NormalizedDataset {
  /** All participants (user and matches) */
  participants: ParticipantProfile[]
  /** All matches/connections */
  matches: MatchContext[]
  /** All messages across all matches */
  messages: NormalizedMessage[]
  /** Raw source records for audit trail */
  rawRecords: RawRecord[]
  /** Metadata about the dataset */
  metadata: DatasetMetadata
}

/**
 * User preferences
 */
export interface UserPreferences {
  /** UI theme preference */
  theme?: 'light' | 'dark'
  /** Whether privacy mode is enabled */
  privacyMode: boolean
  /** Whether telemetry is enabled */
  telemetryEnabled: boolean
}

/**
 * User session state
 * Tracks the current user session and preferences
 */
export interface SessionState {
  /** Unique session identifier */
  id: string
  /** ID of currently active dataset (if any) */
  currentDatasetId?: string
  /** ISO timestamp of last activity */
  lastActiveAt: string
  /** User preferences */
  preferences: UserPreferences
}

// ============================================================================
// Type Guards
// ============================================================================

/**
 * Type guard to check if a value is a valid Platform
 */
export function isPlatform(value: unknown): value is Platform {
  return value === 'tinder' || value === 'hinge'
}

/**
 * Type guard to check if a value is a valid MessageDirection
 */
export function isMessageDirection(value: unknown): value is MessageDirection {
  return value === 'user' || value === 'match'
}

/**
 * Type guard to check if a value is a valid MatchStatus
 */
export function isMatchStatus(value: unknown): value is MatchStatus {
  return value === 'active' || value === 'closed' || value === 'unmatched' || value === 'expired'
}

/**
 * Type guard to check if a value is a valid DeliveryStatus
 */
export function isDeliveryStatus(value: unknown): value is DeliveryStatus {
  return value === 'sent' || value === 'delivered' || value === 'read' || value === 'unknown'
}

/**
 * Type guard to check if a value is a valid ParticipantProfile
 */
export function isParticipantProfile(value: unknown): value is ParticipantProfile {
  if (typeof value !== 'object' || value === null) return false
  const p = value as Partial<ParticipantProfile>
  return (
    typeof p.id === 'string' &&
    isPlatform(p.platform) &&
    typeof p.isUser === 'boolean'
  )
}

/**
 * Type guard to check if a value is a valid MatchContext
 */
export function isMatchContext(value: unknown): value is MatchContext {
  if (typeof value !== 'object' || value === null) return false
  const m = value as Partial<MatchContext>
  return (
    typeof m.id === 'string' &&
    isPlatform(m.platform) &&
    typeof m.createdAt === 'string' &&
    isMatchStatus(m.status) &&
    Array.isArray(m.participants) &&
    typeof m.attributes === 'object'
  )
}

/**
 * Type guard to check if a value is a valid NormalizedMessage
 */
export function isNormalizedMessage(value: unknown): value is NormalizedMessage {
  if (typeof value !== 'object' || value === null) return false
  const m = value as Partial<NormalizedMessage>
  return (
    typeof m.id === 'string' &&
    typeof m.matchId === 'string' &&
    typeof m.senderId === 'string' &&
    typeof m.sentAt === 'string' &&
    typeof m.body === 'string' &&
    isMessageDirection(m.direction)
  )
}
