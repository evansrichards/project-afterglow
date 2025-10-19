/**
 * React Hooks for Database Access
 *
 * Provides reactive hooks for reading and writing data
 */

import { useState, useEffect, useCallback } from 'react'
import type {
  ParticipantProfile,
  MatchContext,
  NormalizedMessage,
  DatasetMetadata,
  SessionState,
  Platform,
} from '@/types/data-model'
import * as queries from '@lib/db/queries'

/**
 * Hook to load and reactively update participants
 */
export function useParticipants(platform?: Platform) {
  const [participants, setParticipants] = useState<ParticipantProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = platform
        ? await queries.getParticipantsByPlatform(platform)
        : await queries.getAllParticipants()
      setParticipants(data)
    } catch (err) {
      setError(err as Error)
    } finally {
      setLoading(false)
    }
  }, [platform])

  useEffect(() => {
    loadData()
  }, [loadData])

  return { participants, loading, error, refetch: loadData }
}

/**
 * Hook to load and reactively update matches
 */
export function useMatches(platform?: Platform) {
  const [matches, setMatches] = useState<MatchContext[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = platform
        ? await queries.getMatchesByPlatform(platform)
        : await queries.getAllMatches()
      setMatches(data)
    } catch (err) {
      setError(err as Error)
    } finally {
      setLoading(false)
    }
  }, [platform])

  useEffect(() => {
    loadData()
  }, [loadData])

  return { matches, loading, error, refetch: loadData }
}

/**
 * Hook to load messages for a specific match
 */
export function useMatchMessages(matchId: string | null) {
  const [messages, setMessages] = useState<NormalizedMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const loadData = useCallback(async () => {
    if (!matchId) {
      setMessages([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      const data = await queries.getMessagesForMatch(matchId)
      // Sort by sent time ascending
      data.sort((a, b) => a.sentAt.localeCompare(b.sentAt))
      setMessages(data)
    } catch (err) {
      setError(err as Error)
    } finally {
      setLoading(false)
    }
  }, [matchId])

  useEffect(() => {
    loadData()
  }, [loadData])

  return { messages, loading, error, refetch: loadData }
}

/**
 * Hook to load all datasets
 */
export function useDatasets() {
  const [datasets, setDatasets] = useState<DatasetMetadata[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await queries.getAllDatasets()
      // Sort by import date descending (most recent first)
      data.sort((a, b) => b.importedAt.localeCompare(a.importedAt))
      setDatasets(data)
    } catch (err) {
      setError(err as Error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  return { datasets, loading, error, refetch: loadData }
}

/**
 * Hook to get the user profile
 */
export function useUserProfile() {
  const [profile, setProfile] = useState<ParticipantProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await queries.getUserProfile()
      setProfile(data || null)
    } catch (err) {
      setError(err as Error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  return { profile, loading, error, refetch: loadData }
}

/**
 * Hook to manage session state
 */
export function useSession(sessionId: string = 'current') {
  const [session, setSession] = useState<SessionState | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await queries.getSession(sessionId)
      setSession(data || null)
    } catch (err) {
      setError(err as Error)
    } finally {
      setLoading(false)
    }
  }, [sessionId])

  const updateSession = useCallback(
    async (updates: Partial<SessionState>) => {
      try {
        await queries.updateSession(sessionId, updates)
        await loadData()
      } catch (err) {
        setError(err as Error)
      }
    },
    [sessionId, loadData]
  )

  useEffect(() => {
    loadData()
  }, [loadData])

  return { session, loading, error, updateSession, refetch: loadData }
}

/**
 * Hook for data import operations
 */
export function useDataImport() {
  const [importing, setImporting] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const importDataset = useCallback(async (data: Parameters<typeof queries.importDataset>[0]) => {
    try {
      setImporting(true)
      setError(null)
      await queries.importDataset(data)
    } catch (err) {
      setError(err as Error)
      throw err
    } finally {
      setImporting(false)
    }
  }, [])

  const clearAllData = useCallback(async () => {
    try {
      setImporting(true)
      setError(null)
      await queries.clearAllData()
    } catch (err) {
      setError(err as Error)
      throw err
    } finally {
      setImporting(false)
    }
  }, [])

  return { importing, error, importDataset, clearAllData }
}
