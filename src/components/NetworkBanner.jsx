import React from 'react'
import { WifiOff, CloudUpload, RefreshCw, CheckCircle } from 'lucide-react'

export function NetworkBanner({
  isOnline,
  isSyncing,
  pendingCount,
  onTriggerSync,
  lastSyncResult
}) {
  if (!isOnline) {
    return (
      <div className="bg-amber-50 border-b border-amber-200 px-4 py-2.5 text-amber-900">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 text-xs sm:text-sm">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded bg-amber-200 text-amber-900 shrink-0">
              <WifiOff className="w-4 h-4" />
            </span>
            <div>
              <span className="font-bold">Offline Field Mode Active:</span>{' '}
              <span className="text-amber-800">
                Internet is disconnected. TensorFlow.js risk scoring runs 100% on this device.
                {pendingCount > 0 ? (
                  <strong className="ml-1 text-amber-950 font-semibold underline">
                    {pendingCount} record{pendingCount > 1 ? 's' : ''} queued locally in IndexedDB.
                  </strong>
                ) : (
                  ' All new assessments will be cached locally.'
                )}
              </span>
            </div>
          </div>
          <span className="hidden md:inline-block shrink-0 px-2 py-0.5 rounded bg-amber-200 text-amber-900 text-xs font-semibold">
            Auto-Sync Ready
          </span>
        </div>
      </div>
    )
  }

  if (isSyncing) {
    return (
      <div className="bg-teal-50 border-b border-teal-200 px-4 py-2 text-teal-900 animate-pulse">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 text-xs sm:text-sm">
          <div className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4 text-teal-700 animate-spin shrink-0" />
            <span>
              <strong>Synchronizing with Cloud:</strong> Uploading patient records as JSON payloads to AWS S3 bucket...
            </span>
          </div>
          <span className="font-mono text-xs font-semibold text-teal-700">In Progress</span>
        </div>
      </div>
    )
  }

  if (pendingCount > 0) {
    return (
      <div className="bg-sky-50 border-b border-sky-200 px-4 py-2 text-sky-900">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 text-xs sm:text-sm">
          <div className="flex items-center gap-2">
            <CloudUpload className="w-4 h-4 text-sky-700 shrink-0" />
            <span>
              <strong>Online & Connected:</strong> You have <strong>{pendingCount}</strong> record{pendingCount > 1 ? 's' : ''} stored locally awaiting cloud upload.
            </span>
          </div>
          <button
            onClick={onTriggerSync}
            className="px-3 py-1 rounded bg-sky-600 hover:bg-sky-700 text-white font-medium text-xs transition cursor-pointer shadow-xs"
          >
            Sync Now
          </button>
        </div>
      </div>
    )
  }

  if (lastSyncResult && lastSyncResult.synced > 0) {
    return (
      <div className="bg-emerald-50 border-b border-emerald-200 px-4 py-1.5 text-emerald-900 text-xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
            <span>
              Cloud sync completed: {lastSyncResult.synced} record{lastSyncResult.synced > 1 ? 's' : ''} pushed to AWS S3.
            </span>
          </div>
          <span className="text-[11px] text-emerald-700">Storage synchronized</span>
        </div>
      </div>
    )
  }

  return null
}
