/**
 * Database Access Layer - Main Export
 *
 * Provides a unified interface for all database operations
 */

// Connection management
export { getDB, closeDB, deleteDatabase, databaseExists } from './connection'

// Query functions
export * from './queries'

// Schema types
export type { AfterglowDB } from './schema'
export { DB_NAME, DB_VERSION } from './schema'
