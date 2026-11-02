import { useState, useEffect, useCallback } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../services/db'
import {
  syncPendingQueueToS3,
  subscribeToSyncEvents,
  initBackgroundSyncListener
} from '../services/s3Sync'

export function useSyncManager() {
  const [isSyncing, setIsSyncing] = useState(false)
  const [syncStatus, setSyncStatus] = useState('idle') // 'idle' | 'syncing' | 'completed' | 'failed'
  const [syncProgress, setSyncProgress] = useState({ total: 0, completed: 0 })
  const [lastSyncResult, setLastSyncResult] = useState(null)
  const [syncError, setSyncError] = useState(null)

  // Reactive query watching the pending sync queue in IndexedDB
  const pendingQueue = useLiveQuery(() => db.syncQueue.toArray(), []) || []
  const totalPatientsCount = useLiveQuery(() => db.patients.count(), []) || 0
  const pendingCount = pendingQueue.length

  useEffect(() => {
    // Start background listener for online network events
    const cleanupNetworkListener = initBackgroundSyncListener()

    // Subscribe to detailed sync events
    const unsubscribeSync = subscribeToSyncEvents(event => {
      switch (event.type) {
        case 'STARTED':
          setIsSyncing(true)
          setSyncStatus('syncing')
          setSyncProgress({ total: event.total, completed: 0 })
          setSyncError(null)
          break
        case 'PROGRESS':
          setSyncProgress({ total: event.total, completed: event.completed })
          break
        case 'COMPLETED':
          setIsSyncing(false)
          setSyncStatus('completed')
          setLastSyncResult(event)
          // Reset to idle after 4 seconds
          setTimeout(() => setSyncStatus('idle'), 4000)
          break
        case 'FAILED':
        case 'ITEM_ERROR':
          setIsSyncing(false)
          setSyncStatus('failed')
          setSyncError(event.error)
          break
        case 'SKIPPED_OFFLINE':
          setIsSyncing(false)
          setSyncStatus('idle')
          break
        default:
          break
      }
    })

    return () => {
      cleanupNetworkListener()
      unsubscribeSync()
    }
  }, [])

  const triggerSyncNow = useCallback(async () => {
    try {
      setIsSyncing(true)
      setSyncStatus('syncing')
      setSyncError(null)
      const res = await syncPendingQueueToS3()
      return res
    } catch (err) {
      setSyncError(err.message || 'Sync failed')
      setSyncStatus('failed')
      throw err
    } finally {
      setIsSyncing(false)
    }
  }, [])

  return {
    isSyncing,
    syncStatus,
    syncProgress,
    pendingCount,
    pendingQueue,
    totalPatientsCount,
    lastSyncResult,
    syncError,
    triggerSyncNow
  }
}

