# Data Persistence Layer

This directory contains the data persistence layer for Project Afterglow, providing both local (IndexedDB) and cloud (Supabase) storage capabilities.

## Architecture

```
┌─────────────────────┐
│   Application       │
│   Components        │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│   queries.ts        │  ← High-level query API
│   (CRUD operations) │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│   connection.ts     │  ← Database connection management
│   (getDB)           │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│   schema.ts         │  ← Schema definition & initialization
│   (IndexedDB)       │
└─────────────────────┘
```

## Files

### `schema.ts`
Defines the IndexedDB schema with typed stores:
- **participants** - User and match profiles
- **matches** - Match/connection contexts
- **messages** - Conversation messages
- **rawRecords** - Original source data for audit trail
- **datasets** - Dataset metadata
- **session** - User session state

All stores include appropriate indexes for efficient querying.

### `connection.ts`
Manages the database connection lifecycle:
- Singleton pattern for single connection instance
- Automatic schema initialization on first use
- Connection cleanup and database deletion utilities
- Debug logging for database operations

### `queries.ts`
Provides high-level CRUD operations for all entity types:

#### Participants
- `saveParticipant(participant)` - Save single participant
- `saveParticipants(participants)` - Batch save participants
- `getParticipant(id)` - Get by ID
- `getAllParticipants()` - Get all
- `getParticipantsByPlatform(platform)` - Filter by platform
- `getUserProfile()` - Get the user's profile

#### Matches
- `saveMatch(match)` - Save single match
- `saveMatches(matches)` - Batch save matches
- `getMatch(id)` - Get by ID
- `getAllMatches()` - Get all
- `getMatchesByPlatform(platform)` - Filter by platform
- `getMatchesByStatus(status)` - Filter by status
- `getMatchesForParticipant(participantId)` - Get matches for a participant

#### Messages
- `saveMessage(message)` - Save single message
- `saveMessages(messages)` - Batch save messages
- `getMessage(id)` - Get by ID
- `getAllMessages()` - Get all
- `getMessagesForMatch(matchId)` - Get messages for a match
- `getMessagesBySender(senderId)` - Filter by sender
- `getMessagesByDirection(direction)` - Filter by direction
- `getMessagesInDateRange(matchId, start, end)` - Date range query

#### Raw Records
- `saveRawRecord(record)` - Save single raw record
- `saveRawRecords(records)` - Batch save raw records
- `getAllRawRecords()` - Get all
- `getRawRecordsByPlatform(platform)` - Filter by platform
- `getRawRecordsByEntity(entity)` - Filter by entity type

#### Datasets
- `saveDataset(dataset)` - Save dataset metadata
- `getDataset(id)` - Get by ID
- `getAllDatasets()` - Get all
- `getDatasetsByPlatform(platform)` - Filter by platform
- `getMostRecentDataset()` - Get most recently imported

#### Session
- `getSession(id)` - Get session state
- `saveSession(session)` - Save session
- `updateSession(id, updates)` - Partial update

#### Bulk Operations
- `importDataset(data)` - Import complete dataset atomically
- `clearAllData()` - Clear all user data
- `deleteDataset(datasetId)` - Delete specific dataset

## Usage Examples

### Importing a Dataset

```typescript
import { importDataset } from '@/lib/db/queries'

// Import parsed data from dating app export
await importDataset({
  metadata: {
    id: 'dataset-1',
    platform: 'tinder',
    parserVersion: '1.0.0',
    importedAt: new Date().toISOString(),
    messageCount: 1500,
    matchCount: 42,
    participantCount: 43,
  },
  participants: [...],
  matches: [...],
  messages: [...],
  rawRecords: [...] // optional
})
```

### Querying Messages

```typescript
import { getMessagesForMatch } from '@/lib/db/queries'

// Get all messages for a specific conversation
const messages = await getMessagesForMatch('match-123')

// Messages are automatically sorted by sentAt index
messages.forEach(msg => {
  console.log(`${msg.direction}: ${msg.body}`)
})
```

### Session Management

```typescript
import { getSession, updateSession } from '@/lib/db/queries'

// Get current session
const session = await getSession('current')

// Update preferences
await updateSession('current', {
  preferences: {
    ...session.preferences,
    theme: 'dark'
  }
})
```

## Supabase Cloud Sync (Future)

The Supabase schema is defined in `/supabase/schema.sql` and will be used for optional cloud sync in a future release.

### Key Differences: Local vs Cloud

**IndexedDB (Local)**
- ✅ Stores complete raw data
- ✅ No size limits (within reason)
- ✅ Full offline access
- ✅ Privacy-first (data never leaves device by default)

**Supabase (Cloud)**
- ✅ Only stores SANITIZED data
- ✅ All PII removed before upload
- ✅ Row Level Security policies
- ✅ Automatic data expiration (90 days)
- ✅ Cross-device sync
- ✅ Optional cloud backup

## Privacy & Security

### Local Storage (IndexedDB)
- All data stored locally in browser
- No data transmission without explicit user consent
- Can be instantly cleared via `clearAllData()`
- Persists across browser sessions until manually deleted

### Cloud Storage (Supabase) - When Enabled
- Only SANITIZED data is uploaded
- All PII must be removed before transmission
- Row Level Security ensures users only access their own data
- Encryption at rest
- Automatic expiration after 90 days
- Instant purge available via API

## Testing

All database operations have comprehensive test coverage. Run tests with:

```bash
npm test -- src/lib/db/queries.test.ts
```

Tests use fake-indexeddb for in-memory testing, ensuring:
- ✅ CRUD operations work correctly
- ✅ Indexes perform as expected
- ✅ Transactions are atomic
- ✅ Data isolation between tests
- ✅ Connection lifecycle management

## Performance Considerations

### Indexes
All frequently-queried fields have indexes:
- Participant queries by platform and user flag
- Match queries by platform, status, and participant
- Message queries by match, sender, timestamp, and direction

### Batch Operations
Use batch operations for better performance:
- `saveParticipants()` instead of multiple `saveParticipant()` calls
- `saveMessages()` for bulk inserts
- `importDataset()` for atomic multi-store transactions

### Transaction Best Practices
- All batch operations use single transactions for atomicity
- Read operations don't need transactions (auto-commit)
- Avoid long-running transactions (blocks other operations)

## Migration Strategy (Future)

When schema updates are needed:
1. Increment `DB_VERSION` in `schema.ts`
2. Add migration logic to handle version upgrades
3. Test migration with sample data
4. Document breaking changes

Example:
```typescript
if (oldVersion < 2) {
  // Migrate from v1 to v2
  const store = db.createObjectStore('newStore', { keyPath: 'id' })
  // ... add indexes
}
```
