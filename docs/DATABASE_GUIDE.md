# Database Access Guide

## Overview

Project Afterglow uses IndexedDB for client-side data storage, providing offline-first persistence for all dating data. The database layer is built with `idb` (a promise-based wrapper for IndexedDB) and provides type-safe access through TypeScript.

## Architecture

```
┌─────────────────────────────────────┐
│  React Components                    │
├─────────────────────────────────────┤
│  React Hooks (useDatabase.ts)       │
│  - useParticipants()                 │
│  - useMatches()                      │
│  - useMatchMessages()                │
│  - useDatasets()                     │
│  - useSession()                      │
├─────────────────────────────────────┤
│  Query Layer (queries.ts)            │
│  - CRUD operations                   │
│  - Filtered queries                  │
│  - Bulk operations                   │
├─────────────────────────────────────┤
│  Connection Layer (connection.ts)    │
│  - Database initialization           │
│  - Connection management             │
│  - Database deletion                 │
├─────────────────────────────────────┤
│  Schema (schema.ts)                  │
│  - Object store definitions          │
│  - Index configuration               │
├─────────────────────────────────────┤
│  IndexedDB (Browser)                 │
└─────────────────────────────────────┘
```

## Database Schema

### Stores

The database contains 6 object stores:

| Store | Purpose | Indexes |
|-------|---------|---------|
| `participants` | User and match profiles | by-platform, by-user-flag |
| `matches` | Match contexts | by-platform, by-status, by-created, by-participant |
| `messages` | Normalized messages | by-match, by-sender, by-sent-at, by-direction |
| `rawRecords` | Raw data audit trail | by-platform, by-entity, by-observed |
| `datasets` | Import metadata | by-platform, by-imported |
| `session` | User session state | (none) |

### Data Model

See [src/types/data-model.ts](../src/types/data-model.ts) for complete type definitions.

**Key Types:**
- `ParticipantProfile` — User and match profiles
- `MatchContext` — Match metadata and status
- `NormalizedMessage` — Parsed messages
- `DatasetMetadata` — Import tracking
- `SessionState` — User preferences

## Usage

### Using React Hooks (Recommended)

```typescript
import { useMatches, useMatchMessages } from '@hooks/useDatabase'

function MyComponent() {
  // Load all matches
  const { matches, loading, error, refetch } = useMatches()

  // Load messages for a specific match
  const { messages } = useMatchMessages('match-123')

  if (loading) return <div>Loading...</div>
  if (error) return <div>Error: {error.message}</div>

  return (
    <div>
      {matches.map(match => (
        <div key={match.id}>{match.id}</div>
      ))}
    </div>
  )
}
```

### Using Query Functions Directly

```typescript
import * as db from '@lib/db'

// Save a participant
await db.saveParticipant({
  id: 'user-1',
  platform: 'tinder',
  name: 'John Doe',
  isUser: true,
})

// Get all matches for a user
const matches = await db.getAllMatches()

// Get messages for a specific match
const messages = await db.getMessagesForMatch('match-123')
```

### Importing a Complete Dataset

```typescript
import { useDataImport } from '@hooks/useDatabase'

function ImportButton() {
  const { importing, error, importDataset } = useDataImport()

  const handleImport = async () => {
    await importDataset({
      metadata: {
        id: 'dataset-1',
        platform: 'tinder',
        importedAt: new Date().toISOString(),
        parserVersion: '1.0.0',
        messageCount: 100,
        matchCount: 10,
        participantCount: 11,
      },
      participants: [...],
      matches: [...],
      messages: [...],
    })
  }

  return (
    <button onClick={handleImport} disabled={importing}>
      {importing ? 'Importing...' : 'Import Data'}
    </button>
  )
}
```

## Available Hooks

### `useParticipants(platform?)`

Load and reactively update participants.

```typescript
const { participants, loading, error, refetch } = useParticipants()
// or filter by platform
const { participants } = useParticipants('tinder')
```

### `useMatches(platform?)`

Load and reactively update matches.

```typescript
const { matches, loading, error, refetch } = useMatches()
```

### `useMatchMessages(matchId)`

Load messages for a specific match, sorted by sent time.

```typescript
const { messages, loading, error, refetch } = useMatchMessages('match-123')
```

### `useDatasets()`

Load all imported datasets, sorted by import date (most recent first).

```typescript
const { datasets, loading, error, refetch } = useDatasets()
```

### `useUserProfile()`

Get the current user's profile.

```typescript
const { profile, loading, error, refetch } = useUserProfile()
```

### `useSession(sessionId?)`

Manage session state with updates.

```typescript
const { session, loading, error, updateSession, refetch } = useSession()

// Update session
await updateSession({ currentDatasetId: 'dataset-1' })
```

### `useDataImport()`

Handle data import and deletion operations.

```typescript
const { importing, error, importDataset, clearAllData } = useDataImport()

// Import dataset
await importDataset(data)

// Clear all data (privacy purge)
await clearAllData()
```

## Query Functions Reference

### Participants

```typescript
// Save
await saveParticipant(participant)
await saveParticipants([participant1, participant2])

// Retrieve
const participant = await getParticipant('id')
const all = await getAllParticipants()
const byPlatform = await getParticipantsByPlatform('tinder')
const userProfile = await getUserProfile()
```

### Matches

```typescript
// Save
await saveMatch(match)
await saveMatches([match1, match2])

// Retrieve
const match = await getMatch('id')
const all = await getAllMatches()
const byPlatform = await getMatchesByPlatform('tinder')
const byStatus = await getMatchesByStatus('active')
const forParticipant = await getMatchesForParticipant('participant-id')
```

### Messages

```typescript
// Save
await saveMessage(message)
await saveMessages([message1, message2])

// Retrieve
const message = await getMessage('id')
const all = await getAllMessages()
const forMatch = await getMessagesForMatch('match-id')
const bySender = await getMessagesBySender('sender-id')
const byDirection = await getMessagesByDirection('user')
const inRange = await getMessagesInDateRange('match-id', startDate, endDate)
```

### Datasets

```typescript
await saveDataset(metadata)
const dataset = await getDataset('id')
const all = await getAllDatasets()
const byPlatform = await getDatasetsByPlatform('tinder')
const mostRecent = await getMostRecentDataset()
```

### Session

```typescript
const session = await getSession('current')
await saveSession(session)
await updateSession('current', { currentDatasetId: 'dataset-1' })
```

### Bulk Operations

```typescript
// Import complete dataset (atomic transaction)
await importDataset({
  metadata,
  participants,
  matches,
  messages,
})

// Clear all data
await clearAllData()

// Delete specific dataset
await deleteDataset('dataset-id')
```

### Database Management

```typescript
import { getDB, closeDB, deleteDatabase, databaseExists } from '@lib/db'

// Get database instance
const db = await getDB()

// Close connection
await closeDB()

// Delete database (privacy purge)
await deleteDatabase()

// Check if database exists
const exists = await databaseExists()
```

## Privacy & Data Purge

Project Afterglow prioritizes user privacy with instant data deletion:

```typescript
import { deleteDatabase } from '@lib/db'

// Complete data purge - removes entire database
await deleteDatabase()
```

Or using the hook:

```typescript
const { clearAllData } = useDataImport()

// Clear all data but keep database structure
await clearAllData()
```

## Testing

Database queries are fully tested with `fake-indexeddb`. Tests automatically:
- Clean up before/after each test
- Use isolated database instances
- Verify CRUD operations
- Test filtering and indexes
- Validate bulk operations

Run tests:

```bash
npm test src/lib/db/queries.test.ts
```

## Performance Tips

1. **Use indexes** — All common query patterns are indexed
2. **Bulk operations** — Use `saveParticipants()` instead of looping `saveParticipant()`
3. **Transactions** — `importDataset()` uses a single transaction for atomicity
4. **Hooks auto-refresh** — Hooks manage loading states and caching
5. **Selective loading** — Use filtered queries instead of loading all data

## Error Handling

All database operations may throw errors. Handle them appropriately:

```typescript
try {
  await db.saveParticipant(participant)
} catch (error) {
  console.error('Failed to save participant:', error)
  // Show user-friendly error message
}
```

Hooks provide built-in error states:

```typescript
const { data, error } = useMatches()

if (error) {
  return <ErrorMessage error={error} />
}
```

## Database Versioning

Current version: **1**

To upgrade the schema:
1. Increment `DB_VERSION` in `src/lib/db/schema.ts`
2. Update `initializeSchema()` with migration logic
3. Test with existing data
4. Document migration in release notes

## Browser Compatibility

IndexedDB is supported in all modern browsers:
- Chrome 24+
- Firefox 16+
- Safari 10+
- Edge 12+

## File Structure

```
src/
├── lib/
│   └── db/
│       ├── index.ts           # Main export
│       ├── connection.ts      # Database connection management
│       ├── schema.ts          # Schema definition
│       ├── queries.ts         # Query functions
│       └── queries.test.ts    # Tests
├── hooks/
│   └── useDatabase.ts         # React hooks
└── types/
    └── data-model.ts          # TypeScript types
```

## Best Practices

1. **Always use transactions for multi-store updates**
2. **Handle database upgrade scenarios gracefully**
3. **Test with realistic data volumes**
4. **Provide clear error messages to users**
5. **Use hooks in React components**
6. **Use query functions in utilities/workers**
7. **Clean up database connections in cleanup effects**

## Example: Complete Data Flow

```typescript
// 1. User uploads file
const file = event.target.files[0]

// 2. Parse file (in future parser module)
const parsed = await parseFile(file)

// 3. Import to database
await importDataset({
  metadata: {
    id: generateId(),
    platform: 'tinder',
    importedAt: new Date().toISOString(),
    parserVersion: '1.0.0',
    messageCount: parsed.messages.length,
    matchCount: parsed.matches.length,
    participantCount: parsed.participants.length,
  },
  participants: parsed.participants,
  matches: parsed.matches,
  messages: parsed.messages,
})

// 4. React components automatically update via hooks
function Dashboard() {
  const { matches } = useMatches()
  const { messages } = useMatchMessages(matches[0]?.id)

  return <InsightView matches={matches} messages={messages} />
}
```

---

**Last Updated:** 2025-10-18
**Database Version:** 1
**Author:** Project Afterglow Team
