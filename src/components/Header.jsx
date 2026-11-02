import React from 'react'
import {
  Wifi,
  WifiOff,
  Cloud,
  CloudUpload,
  CheckCircle2,
  RefreshCw,
  Settings,
  HeartPulse,
  Database
} from 'lucide-react'

export function Header({
  isOnline,
  isSyncing,
  pendingCount,
  onTriggerSync,
  onOpenSettings,
  activeTab,
  setActiveTab
}) {
  return (
    <header className="sticky top-0 z-30 bg-teal-900 text-white shadow-md border-b border-teal-800">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5">
        <div className="flex items-center justify-between gap-2">
          {/* Brand & Title */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-teal-700/80 border border-teal-500/30 flex items-center justify-center shrink-0 shadow-inner">
              <HeartPulse className="w-6 h-6 text-teal-200" />
            </div>
            <div className="truncate">
              <div className="flex items-center gap-1.5">
                <h1 className="text-base sm:text-lg font-bold tracking-tight text-white truncate">
                  MaternalCare <span className="text-teal-300 font-extrabold">Edge AI</span>
                </h1>
                <span className="hidden md:inline-flex text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-teal-800 text-teal-200 border border-teal-700">
                  PWA Offline-First
                </span>
              </div>
              <p className="text-xs text-teal-200/80 truncate">
                Rural Health Worker Risk Scoring & Triage
              </p>
            </div>
          </div>

          {/* Status Badges & Controls */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            {/* Network Status Pill */}
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition-all ${
                isOnline
                  ? 'bg-emerald-950/80 text-emerald-300 border-emerald-600/50'
                  : 'bg-rose-950/90 text-rose-200 border-rose-600/60 shadow-sm'
              }`}
              title={isOnline ? 'Online: Cloud synchronization active' : 'Offline: Running purely in-browser'}
            >
              {isOnline ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  <Wifi className="w-3.5 h-3.5 text-emerald-400 hidden sm:inline" />
                  <span>Online</span>
                </>
              ) : (
                <>
                  <span className="w-2 h-2 rounded-full bg-rose-400"></span>
                  <WifiOff className="w-3.5 h-3.5 text-rose-400" />
                  <span>Offline Mode</span>
                </>
              )}
            </div>

            {/* Sync Queue Pill & Action */}
            <button
              onClick={onTriggerSync}
              disabled={isSyncing || !isOnline || pendingCount === 0}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
                isSyncing
                  ? 'bg-amber-950/80 text-amber-300 border-amber-600 animate-pulse'
                  : pendingCount > 0
                  ? isOnline
                    ? 'bg-amber-900/60 text-amber-200 border-amber-500/60 hover:bg-amber-900'
                    : 'bg-slate-800 text-slate-300 border-slate-700'
                  : 'bg-teal-800/60 text-teal-300 border-teal-700/60 hover:bg-teal-800'
              }`}
              title={
                !isOnline
                  ? `${pendingCount} records queued for cloud sync (Waiting for connection)`
                  : pendingCount > 0
                  ? `Click to sync ${pendingCount} pending record(s) to AWS S3`
                  : 'All local records synchronized with AWS S3'
              }
            >
              {isSyncing ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-300" />
                  <span>Syncing...</span>
                </>
              ) : pendingCount > 0 ? (
                <>
                  <CloudUpload className="w-3.5 h-3.5 text-amber-300" />
                  <span>{pendingCount} Pending</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="hidden sm:inline">Synced</span>
                </>
              )}
            </button>

            {/* Settings Trigger */}
            <button
              onClick={onOpenSettings}
              className="p-1.5 rounded-lg text-teal-200 hover:text-white hover:bg-teal-800 border border-teal-700/60 transition-colors"
              title="AWS S3 & Model Settings"
              aria-label="Settings"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <nav className="flex items-center gap-1 sm:gap-2 mt-2 pt-1 border-t border-teal-800/60 overflow-x-auto no-scrollbar text-xs sm:text-sm font-medium">
          <button
            onClick={() => setActiveTab('assessment')}
            className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'assessment'
                ? 'bg-teal-600 text-white font-semibold shadow-sm'
                : 'text-teal-200 hover:text-white hover:bg-teal-800/50'
            }`}
          >
            <HeartPulse className="w-3.5 h-3.5" />
            <span>New Assessment</span>
          </button>

          <button
            onClick={() => setActiveTab('registry')}
            className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'registry'
                ? 'bg-teal-600 text-white font-semibold shadow-sm'
                : 'text-teal-200 hover:text-white hover:bg-teal-800/50'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>Patient Registry</span>
          </button>

          <button
            onClick={() => setActiveTab('sync')}
            className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'sync'
                ? 'bg-teal-600 text-white font-semibold shadow-sm'
                : 'text-teal-200 hover:text-white hover:bg-teal-800/50'
            }`}
          >
            <Cloud className="w-3.5 h-3.5" />
            <span>AWS S3 Sync Queue</span>
            {pendingCount > 0 && (
              <span className="ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500 text-slate-950 font-bold">
                {pendingCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('model')}
            className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'model'
                ? 'bg-teal-600 text-white font-semibold shadow-sm'
                : 'text-teal-200 hover:text-white hover:bg-teal-800/50'
            }`}
          >
            <span className="font-mono text-teal-300 font-bold text-xs">TF.js</span>
            <span>Edge Model</span>
          </button>
        </nav>
      </div>
    </header>
  )
}

