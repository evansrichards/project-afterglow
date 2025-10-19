/**
 * IndexedDB Connection Management
 *
 * Provides a singleton connection to the AfterglowDB database
 */

import { openDB, IDBPDatabase } from 'idb'
import type { AfterglowDB } from './schema'
import { DB_NAME, DB_VERSION, initializeSchema } from './schema'

/**
 * Cached database instance
 */
let dbInstance: IDBPDatabase<AfterglowDB> | null = null

/**
 * Open or retrieve the database connection
 *
 * @returns Promise resolving to the database instance
 */
export async function getDB(): Promise<IDBPDatabase<AfterglowDB>> {
  if (dbInstance) {
    return dbInstance
  }

  dbInstance = await openDB<AfterglowDB>(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion, newVersion) {
      console.log(`[DB] Upgrading database from v${oldVersion} to v${newVersion}`)
      initializeSchema(db)
    },
    blocked() {
      console.warn('[DB] Database upgrade blocked by another tab')
    },
    blocking() {
      console.warn('[DB] This tab is blocking a database upgrade')
    },
    terminated() {
      console.error('[DB] Database connection unexpectedly terminated')
      dbInstance = null
    },
  })

  console.log('[DB] Database connection established')
  return dbInstance
}

/**
 * Close the database connection
 */
export async function closeDB(): Promise<void> {
  if (dbInstance) {
    dbInstance.close()
    dbInstance = null
    console.log('[DB] Database connection closed')
  }
}

/**
 * Delete the entire database (for privacy/data purge)
 *
 * @returns Promise resolving when database is deleted
 */
export async function deleteDatabase(): Promise<void> {
  await closeDB()

  return new Promise((resolve, reject) => {
    const request = indexedDB.deleteDatabase(DB_NAME)

    request.onsuccess = () => {
      console.log('[DB] Database deleted successfully')
      resolve()
    }

    request.onerror = () => {
      console.error('[DB] Error deleting database:', request.error)
      reject(request.error)
    }

    request.onblocked = () => {
      console.warn('[DB] Database deletion blocked - close all tabs')
    }
  })
}

/**
 * Check if the database exists
 *
 * @returns Promise resolving to true if database exists
 */
export async function databaseExists(): Promise<boolean> {
  try {
    const databases = await indexedDB.databases()
    return databases.some((db) => db.name === DB_NAME)
  } catch (error) {
    // Fallback for browsers that don't support indexedDB.databases()
    console.warn('[DB] Unable to check database existence:', error)
    return false
  }
}
