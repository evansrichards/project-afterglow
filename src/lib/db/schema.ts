/**
 * IndexedDB Schema Definition for Project Afterglow
 *
 * Database: afterglow-db
 * Version: 1
 */

import { DBSchema, IDBPDatabase } from 'idb'
import type {
  ParticipantProfile,
  MatchContext,
  NormalizedMessage,
  RawRecord,
  DatasetMetadata,
  SessionState,
} from '@/types/data-model'

/**
 * Database schema with typed stores
 */
export interface AfterglowDB extends DBSchema {
  // Normalized data stores
  participants: {
    key: string // ParticipantProfile.id
    value: ParticipantProfile
    indexes: {
      'by-platform': string
      'by-user-flag': number // 1 for user, 0 for matches
    }
  }

  matches: {
    key: string // MatchContext.id
    value: MatchContext
    indexes: {
      'by-platform': string
      'by-status': string
      'by-created': string
      'by-participant': string // For querying matches by participant ID
    }
  }

  messages: {
    key: string // NormalizedMessage.id
    value: NormalizedMessage
    indexes: {
      'by-match': string
      'by-sender': string
      'by-sent-at': string
      'by-direction': string
    }
  }

  // Raw data for audit trail
  rawRecords: {
    key: string // Generated ID
    value: RawRecord
    indexes: {
      'by-platform': string
      'by-entity': string
      'by-observed': string
    }
  }

  // Dataset metadata
  datasets: {
    key: string // DatasetMetadata.id
    value: DatasetMetadata
    indexes: {
      'by-platform': string
      'by-imported': string
    }
  }

  // Session state
  session: {
    key: string // SessionState.id (typically 'current')
    value: SessionState
  }
}

/**
 * Database version number
 */
export const DB_VERSION = 1

/**
 * Database name
 */
export const DB_NAME = 'afterglow-db'

/**
 * Initialize database schema and create indexes
 */
export function initializeSchema(db: IDBPDatabase<AfterglowDB>) {
  // Participants store
  if (!db.objectStoreNames.contains('participants')) {
    const participantStore = db.createObjectStore('participants', { keyPath: 'id' })
    participantStore.createIndex('by-platform', 'platform')
    participantStore.createIndex('by-user-flag', 'isUser')
  }

  // Matches store
  if (!db.objectStoreNames.contains('matches')) {
    const matchStore = db.createObjectStore('matches', { keyPath: 'id' })
    matchStore.createIndex('by-platform', 'platform')
    matchStore.createIndex('by-status', 'status')
    matchStore.createIndex('by-created', 'createdAt')
    matchStore.createIndex('by-participant', 'participants', { multiEntry: true })
  }

  // Messages store
  if (!db.objectStoreNames.contains('messages')) {
    const messageStore = db.createObjectStore('messages', { keyPath: 'id' })
    messageStore.createIndex('by-match', 'matchId')
    messageStore.createIndex('by-sender', 'senderId')
    messageStore.createIndex('by-sent-at', 'sentAt')
    messageStore.createIndex('by-direction', 'direction')
  }

  // Raw records store
  if (!db.objectStoreNames.contains('rawRecords')) {
    const rawStore = db.createObjectStore('rawRecords', { keyPath: 'id', autoIncrement: true })
    rawStore.createIndex('by-platform', 'platform')
    rawStore.createIndex('by-entity', 'entity')
    rawStore.createIndex('by-observed', 'observedAt')
  }

  // Datasets store
  if (!db.objectStoreNames.contains('datasets')) {
    const datasetStore = db.createObjectStore('datasets', { keyPath: 'id' })
    datasetStore.createIndex('by-platform', 'platform')
    datasetStore.createIndex('by-imported', 'importedAt')
  }

  // Session store
  if (!db.objectStoreNames.contains('session')) {
    db.createObjectStore('session', { keyPath: 'id' })
  }
}
