/**
 * Database Query Utilities
 *
 * High-level query functions for accessing data from IndexedDB
 */

import { getDB } from './connection'
import type {
  ParticipantProfile,
  MatchContext,
  NormalizedMessage,
  DatasetMetadata,
  SessionState,
  Platform,
} from '@/types/data-model'

// ============================================================================
// Participants
// ============================================================================

export async function saveParticipant(participant: ParticipantProfile): Promise<void> {
  const db = await getDB()
  await db.put('participants', participant)
}

export async function saveParticipants(participants: ParticipantProfile[]): Promise<void> {
  const db = await getDB()
  const tx = db.transaction('participants', 'readwrite')
  await Promise.all([...participants.map((p) => tx.store.put(p)), tx.done])
}

export async function getParticipant(id: string): Promise<ParticipantProfile | undefined> {
  const db = await getDB()
  return db.get('participants', id)
}

export async function getAllParticipants(): Promise<ParticipantProfile[]> {
  const db = await getDB()
  return db.getAll('participants')
}

export async function getParticipantsByPlatform(platform: Platform): Promise<ParticipantProfile[]> {
  const db = await getDB()
  return db.getAllFromIndex('participants', 'by-platform', platform)
}

export async function getUserProfile(): Promise<ParticipantProfile | undefined> {
  const db = await getDB()
  const allParticipants = await db.getAll('participants')
  return allParticipants.find((p) => p.isUser)
}

// ============================================================================
// Matches
// ============================================================================

export async function saveMatch(match: MatchContext): Promise<void> {
  const db = await getDB()
  await db.put('matches', match)
}

export async function saveMatches(matches: MatchContext[]): Promise<void> {
  const db = await getDB()
  const tx = db.transaction('matches', 'readwrite')
  await Promise.all([...matches.map((m) => tx.store.put(m)), tx.done])
}

export async function getMatch(id: string): Promise<MatchContext | undefined> {
  const db = await getDB()
  return db.get('matches', id)
}

export async function getAllMatches(): Promise<MatchContext[]> {
  const db = await getDB()
  return db.getAll('matches')
}

export async function getMatchesByPlatform(platform: Platform): Promise<MatchContext[]> {
  const db = await getDB()
  return db.getAllFromIndex('matches', 'by-platform', platform)
}

export async function getMatchesByStatus(status: MatchContext['status']): Promise<MatchContext[]> {
  const db = await getDB()
  return db.getAllFromIndex('matches', 'by-status', status)
}

export async function getMatchesForParticipant(participantId: string): Promise<MatchContext[]> {
  const db = await getDB()
  return db.getAllFromIndex('matches', 'by-participant', participantId)
}

// ============================================================================
// Messages
// ============================================================================

export async function saveMessage(message: NormalizedMessage): Promise<void> {
  const db = await getDB()
  await db.put('messages', message)
}

export async function saveMessages(messages: NormalizedMessage[]): Promise<void> {
  const db = await getDB()
  const tx = db.transaction('messages', 'readwrite')
  await Promise.all([...messages.map((m) => tx.store.put(m)), tx.done])
}

export async function getMessage(id: string): Promise<NormalizedMessage | undefined> {
  const db = await getDB()
  return db.get('messages', id)
}

export async function getAllMessages(): Promise<NormalizedMessage[]> {
  const db = await getDB()
  return db.getAll('messages')
}

export async function getMessagesForMatch(matchId: string): Promise<NormalizedMessage[]> {
  const db = await getDB()
  return db.getAllFromIndex('messages', 'by-match', matchId)
}

export async function getMessagesBySender(senderId: string): Promise<NormalizedMessage[]> {
  const db = await getDB()
  return db.getAllFromIndex('messages', 'by-sender', senderId)
}

export async function getMessagesByDirection(
  direction: 'user' | 'match'
): Promise<NormalizedMessage[]> {
  const db = await getDB()
  return db.getAllFromIndex('messages', 'by-direction', direction)
}

/**
 * Get messages for a match within a date range
 */
export async function getMessagesInDateRange(
  matchId: string,
  startDate: string,
  endDate: string
): Promise<NormalizedMessage[]> {
  const db = await getDB()
  const allMessages = await db.getAllFromIndex('messages', 'by-match', matchId)
  return allMessages.filter((msg) => msg.sentAt >= startDate && msg.sentAt <= endDate)
}

// ============================================================================
// Raw Records
// ============================================================================

export async function saveRawRecord(record: import('@/types/data-model').RawRecord): Promise<void> {
  const db = await getDB()
  await db.add('rawRecords', record)
}

export async function saveRawRecords(records: import('@/types/data-model').RawRecord[]): Promise<void> {
  const db = await getDB()
  const tx = db.transaction('rawRecords', 'readwrite')
  await Promise.all([...records.map((r) => tx.store.add(r)), tx.done])
}

export async function getAllRawRecords(): Promise<import('@/types/data-model').RawRecord[]> {
  const db = await getDB()
  return db.getAll('rawRecords')
}

export async function getRawRecordsByPlatform(platform: Platform): Promise<import('@/types/data-model').RawRecord[]> {
  const db = await getDB()
  return db.getAllFromIndex('rawRecords', 'by-platform', platform)
}

export async function getRawRecordsByEntity(entity: 'match' | 'message' | 'profile'): Promise<import('@/types/data-model').RawRecord[]> {
  const db = await getDB()
  return db.getAllFromIndex('rawRecords', 'by-entity', entity)
}

// ============================================================================
// Datasets
// ============================================================================

export async function saveDataset(dataset: DatasetMetadata): Promise<void> {
  const db = await getDB()
  await db.put('datasets', dataset)
}

export async function getDataset(id: string): Promise<DatasetMetadata | undefined> {
  const db = await getDB()
  return db.get('datasets', id)
}

export async function getAllDatasets(): Promise<DatasetMetadata[]> {
  const db = await getDB()
  return db.getAll('datasets')
}

export async function getDatasetsByPlatform(platform: Platform): Promise<DatasetMetadata[]> {
  const db = await getDB()
  return db.getAllFromIndex('datasets', 'by-platform', platform)
}

export async function getMostRecentDataset(): Promise<DatasetMetadata | undefined> {
  const db = await getDB()
  const datasets = await db.getAllFromIndex('datasets', 'by-imported')
  return datasets[datasets.length - 1]
}

// ============================================================================
// Session
// ============================================================================

export async function getSession(id: string = 'current'): Promise<SessionState | undefined> {
  const db = await getDB()
  return db.get('session', id)
}

export async function saveSession(session: SessionState): Promise<void> {
  const db = await getDB()
  await db.put('session', session)
}

export async function updateSession(
  id: string = 'current',
  updates: Partial<SessionState>
): Promise<void> {
  const db = await getDB()
  const existing = await db.get('session', id)

  if (existing) {
    await db.put('session', { ...existing, ...updates })
  }
}

// ============================================================================
// Bulk Operations
// ============================================================================

/**
 * Import a complete dataset in a single transaction
 */
export async function importDataset(data: {
  metadata: DatasetMetadata
  participants: ParticipantProfile[]
  matches: MatchContext[]
  messages: NormalizedMessage[]
  rawRecords?: import('@/types/data-model').RawRecord[]
}): Promise<void> {
  const db = await getDB()

  // Use a single transaction for atomicity
  const stores: Array<'datasets' | 'participants' | 'matches' | 'messages' | 'rawRecords'> = [
    'datasets',
    'participants',
    'matches',
    'messages',
  ]
  if (data.rawRecords && data.rawRecords.length > 0) {
    stores.push('rawRecords')
  }

  const tx = db.transaction(stores, 'readwrite')

  try {
    // Save metadata
    await tx.objectStore('datasets').put(data.metadata)

    // Save all entities
    const operations = [
      ...data.participants.map((p) => tx.objectStore('participants').put(p)),
      ...data.matches.map((m) => tx.objectStore('matches').put(m)),
      ...data.messages.map((msg) => tx.objectStore('messages').put(msg)),
    ]

    // Add raw records if provided
    if (data.rawRecords && data.rawRecords.length > 0) {
      operations.push(
        ...data.rawRecords.map((r) => tx.objectStore('rawRecords').add(r))
      )
    }

    await Promise.all(operations)

    await tx.done
    console.log(`[DB] Imported dataset ${data.metadata.id}`)
  } catch (error) {
    console.error('[DB] Error importing dataset:', error)
    throw error
  }
}

// ============================================================================
// Data Purge
// ============================================================================

/**
 * Clear all data from specific stores
 */
export async function clearAllData(): Promise<void> {
  const db = await getDB()
  const tx = db.transaction(
    ['participants', 'matches', 'messages', 'rawRecords', 'datasets'],
    'readwrite'
  )

  await Promise.all([
    tx.objectStore('participants').clear(),
    tx.objectStore('matches').clear(),
    tx.objectStore('messages').clear(),
    tx.objectStore('rawRecords').clear(),
    tx.objectStore('datasets').clear(),
    tx.done,
  ])

  console.log('[DB] All data cleared')
}

/**
 * Delete data for a specific dataset
 */
export async function deleteDataset(datasetId: string): Promise<void> {
  const db = await getDB()

  // Get the dataset metadata to check the platform
  const dataset = await db.get('datasets', datasetId)
  if (!dataset) {
    console.warn(`[DB] Dataset ${datasetId} not found`)
    return
  }

  // Delete all associated data
  const tx = db.transaction(['datasets', 'participants', 'matches', 'messages'], 'readwrite')

  try {
    // Delete dataset metadata
    await tx.objectStore('datasets').delete(datasetId)

    // Note: In a real implementation, you'd want to track which entities
    // belong to which dataset. For now, this is a simplified version.
    // You might add a datasetId field to each entity for proper cleanup.

    await tx.done
    console.log(`[DB] Deleted dataset ${datasetId}`)
  } catch (error) {
    console.error('[DB] Error deleting dataset:', error)
    throw error
  }
}
