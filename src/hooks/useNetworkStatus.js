import { useSyncExternalStore } from 'react'

function getSnapshot() {
  return typeof navigator !== 'undefined' ? navigator.onLine : true
}

function getServerSnapshot() {
  return true
}

function subscribe(callback) {
  window.addEventListener('online', callback)
  window.addEventListener('offline', callback)
  if (navigator.connection) {
    navigator.connection.addEventListener('change', callback)
  }
  return () => {
    window.removeEventListener('online', callback)
    window.removeEventListener('offline', callback)
    if (navigator.connection) {
      navigator.connection.removeEventListener('change', callback)
    }
  }
}

/**
 * Custom hook for real-time network connectivity tracking and offline detection
 * using React 18/19 useSyncExternalStore.
 */
export function useNetworkStatus() {
  const isOnline = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
  const connectionType =
    typeof navigator !== 'undefined' && navigator.connection
      ? navigator.connection.effectiveType || navigator.connection.type
      : null

  return {
    isOnline,
    connectionType
  }
}
