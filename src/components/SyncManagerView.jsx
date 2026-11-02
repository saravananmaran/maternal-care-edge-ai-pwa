import React, { useState, useEffect } from 'react'
import {
  Cloud,
  CloudUpload,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Server,
  ShieldCheck,
  Clock,
  Database,
  Wifi,
  WifiOff
} from 'lucide-react'
import { getEffectiveAwsConfig } from '../services/s3Sync'

export function SyncManagerView({
  isOnline,
  isSyncing,
  pendingQueue,
  pendingCount,
  onTriggerSync,
  _lastSyncResult,
  syncError,
  onOpenSettings
}) {
  const [awsConfig, setAwsConfig] = useState(null)

  useEffect(() => {
    async function loadConfig() {
      const cfg = await getEffectiveAwsConfig()
      setAwsConfig(cfg)
    }
    loadConfig()
  }, [])

  return (
    <div className="space-y-5">
      {/* Overview Card */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-teal-100 text-teal-800">
                <Cloud className="w-5 h-5" />
              </span>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900">
                  AWS S3 Synchronization Hub
                </h2>
                <p className="text-xs text-slate-500">
                  Resilient offline-first queue with automatic cloud sync when internet is restored.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onTriggerSync}
              disabled={isSyncing || !isOnline || pendingCount === 0}
              className="px-5 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 disabled:opacity-50 text-white font-bold text-xs sm:text-sm flex items-center gap-2 transition cursor-pointer shadow-xs"
            >
              {isSyncing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-teal-200" />
                  <span>Syncing to AWS...</span>
                </>
              ) : (
                <>
                  <CloudUpload className="w-4 h-4 text-teal-200" />
                  <span>Push {pendingCount} Pending to S3</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Status Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6 pt-6 border-t border-slate-100">
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <span className="text-slate-500 text-xs font-semibold block">Device Network Status</span>
            <div className="flex items-center gap-2 mt-1">
              {isOnline ? (
                <>
                  <Wifi className="w-4 h-4 text-emerald-600" />
                  <span className="font-bold text-emerald-700 text-sm">Connected Online</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-4 h-4 text-rose-600" />
                  <span className="font-bold text-rose-700 text-sm">Offline (Disconnected)</span>
                </>
              )}
            </div>
            <span className="text-[11px] text-slate-400 block mt-1">
              Auto-sync fires as soon as network returns.
            </span>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <span className="text-slate-500 text-xs font-semibold block">IndexedDB Sync Queue</span>
            <div className="flex items-center gap-2 mt-1">
              <Database className="w-4 h-4 text-amber-600" />
              <span className="font-bold text-slate-900 text-sm">
                {pendingCount} Record{pendingCount !== 1 ? 's' : ''} Awaiting S3
              </span>
            </div>
            <span className="text-[11px] text-slate-400 block mt-1">
              Cleared only after verified HTTP 200 from S3.
            </span>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <span className="text-slate-500 text-xs font-semibold block">Target AWS S3 Bucket</span>
            <div className="flex items-center gap-2 mt-1">
              <Server className="w-4 h-4 text-teal-600" />
              <span className="font-bold text-slate-900 text-sm truncate font-mono">
                {awsConfig?.bucketName || 'Not Configured'}
              </span>
            </div>
            <span className="text-[11px] text-slate-400 block mt-1">
              Region: {awsConfig?.region || 'us-east-1'}
            </span>
          </div>
        </div>
      </div>

      {/* Sync Error Alert */}
      {syncError && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 flex items-start gap-3 text-xs sm:text-sm">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <strong className="font-bold block">Synchronization Warning:</strong>
            <span>{syncError}</span>
            <div className="mt-2">
              <button
                onClick={onOpenSettings}
                className="text-xs font-semibold underline text-rose-800 hover:text-rose-950"
              >
                Open AWS Settings to update credentials or enable Simulated Mode &rarr;
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pending Queue Detailed Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-600" />
            <h3 className="font-bold text-sm text-slate-800">
              Active Sync Queue in IndexedDB ({pendingQueue.length})
            </h3>
          </div>
          <span className="text-xs text-slate-500">
            Partition: <code className="bg-slate-200 px-1 py-0.5 rounded text-[11px]">maternal-records/{'{villageId}'}/*.json</code>
          </span>
        </div>

        {pendingQueue.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-xs space-y-1">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
            <p className="font-semibold text-slate-800 text-sm">Sync Queue is Empty</p>
            <p>All local patient assessments are fully synchronized with the cloud.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {pendingQueue.map((item, idx) => (
              <div key={item.id || idx} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">
                      {item.payload?.fullName || 'Patient'}
                    </span>
                    <span className="font-mono text-[11px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">
                      ID: {item.patientId}
                    </span>
                    <span className="font-semibold text-[11px] px-2 py-0.5 rounded bg-teal-50 text-teal-800 border border-teal-200">
                      Score: {item.payload?.riskScore}% ({item.payload?.riskLevel})
                    </span>
                  </div>
                  <div className="text-slate-500 flex flex-wrap items-center gap-3">
                    <span>Village: {item.payload?.villageId}</span>
                    <span>Queued: {new Date(item.queuedAt).toLocaleTimeString()}</span>
                    <span>Retries: {item.retryCount || 0}</span>
                  </div>
                  {item.lastError && (
                    <p className="text-rose-600 font-medium text-[11px]">
                      Last error: {item.lastError}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-800 border border-amber-300">
                    Pending Upload
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* S3 Security & Architecture Reference Guide */}
      <div className="bg-slate-900 text-slate-200 rounded-2xl p-5 sm:p-6 text-xs space-y-3">
        <div className="flex items-center gap-2 text-teal-400 font-bold text-sm">
          <ShieldCheck className="w-4 h-4" />
          <span>AWS S3 Secure Cloud Sync Architecture</span>
        </div>
        <p className="text-slate-300 leading-relaxed">
          The app uses the modular AWS SDK for JavaScript (<code>@aws-sdk/client-s3</code>) to upload
          anonymized JSON clinical assessment payloads directly to your S3 bucket.
        </p>
        <div className="bg-slate-950 p-3.5 rounded-xl font-mono text-[11px] text-teal-300 border border-slate-800 space-y-1">
          <div>// S3 Key Partitioning Structure:</div>
          <div>maternal-records/&#123;villageId&#125;/&#123;YYYY-MM-DD&#125;/&#123;patientId&#125;_&#123;timestamp&#125;.json</div>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-slate-800 text-slate-400">
          <span>Need to configure your AWS IAM credentials or change bucket?</span>
          <button
            onClick={onOpenSettings}
            className="text-teal-400 hover:text-teal-300 font-semibold underline self-start sm:self-auto cursor-pointer"
          >
            Configure AWS Credentials &rarr;
          </button>
        </div>
      </div>
    </div>
  )
}
