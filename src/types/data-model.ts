/**
 * Data model types for Project Afterglow
 * Based on the unified data model from MVP.md
 */

export type Platform = 'tinder' | 'hinge'

export type CustomAttributeValue = string | number | boolean | null | string[] | number[]

export interface RawRecord {
  platform: Platform
  entity: 'match' | 'message' | 'profile'
  source: string // filename or JSON path
  observedAt: string // timestamp capture
  data: Record<string, unknown> // untouched payload for audit trail
}

export interface ParticipantProfile {
  id: string
  platform: Platform
  name?: string
  age?: number
  genderLabel?: string
  location?: string
  prompts?: Array<{ title: string; response: string }>
  traits?: string[] // derived (e.g., job titles, schools)
  isUser: boolean
  attributes?: Record<string, CustomAttributeValue> // unknown fields from source data
  raw?: RawRecord // optional pointer to source
}

export interface MatchContext {
  id: string
  platform: Platform
  createdAt: string
  closedAt?: string
  origin?: string // like, rose, boost, super-like
  status: 'active' | 'closed' | 'unmatched' | 'expired'
  participants: string[]
  attributes: Record<string, CustomAttributeValue>
  raw?: RawRecord
}

export interface NormalizedMessage {
  id: string
  matchId: string
  senderId: string
  sentAt: string
  body: string
  direction: 'user' | 'match'
  delivery?: 'sent' | 'delivered' | 'read' | 'unknown'
  promptContext?: { title?: string; response?: string }
  reactions?: Array<{ emoji: string; actorId: string; sentAt: string }>
  attachments?: Array<{ type: 'image' | 'video' | 'voice' | 'link'; url?: string }>
  attributes?: Record<string, CustomAttributeValue> // unknown fields from source data
  raw?: RawRecord
}

export interface SchemaFieldMapping {
  canonical: keyof NormalizedMessage | keyof MatchContext | keyof ParticipantProfile | string
  aliases: string[] // observed variants
  transform?: (value: unknown) => unknown
}

export interface ParserAdapter {
  platform: Platform
  version: string
  detect: (fileMeta: { name: string; headers: string[] }) => boolean
  fieldMappings: SchemaFieldMapping[]
  normalize: (records: RawRecord[]) => {
    participants: ParticipantProfile[]
    matches: MatchContext[]
    messages: NormalizedMessage[]
  }
}

/**
 * Metadata about a parsed dataset
 */
export interface DatasetMetadata {
  id: string
  platform: Platform
  importedAt: string
  parserVersion: string
  messageCount: number
  matchCount: number
  participantCount: number
  dateRange?: {
    earliest: string
    latest: string
  }
}

/**
 * User session state
 */
export interface SessionState {
  id: string
  currentDatasetId?: string
  lastActiveAt: string
  preferences: {
    theme?: 'light' | 'dark'
    privacyMode: boolean
    telemetryEnabled: boolean
  }
}
