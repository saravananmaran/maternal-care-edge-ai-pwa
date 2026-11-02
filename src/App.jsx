import React, { useState, useRef } from 'react'
import { Header } from './components/Header'
import { NetworkBanner } from './components/NetworkBanner'
import { PatientEntryForm } from './components/PatientEntryForm'
import { RiskScoreDisplay } from './components/RiskScoreDisplay'
import { PatientRegistry } from './components/PatientRegistry'
import { SyncManagerView } from './components/SyncManagerView'
import { ModelLabView } from './components/ModelLabView'
import { SettingsModal } from './components/SettingsModal'
import { useNetworkStatus } from './hooks/useNetworkStatus'
import { useSyncManager } from './hooks/useSyncManager'
import { calculateRiskScore } from './services/aiRiskModel'
import { savePatientRecord } from './services/db'
import { HeartPulse, Database, Cloud, Cpu } from 'lucide-react'

export function App() {
  const { isOnline } = useNetworkStatus()
  const {
    isSyncing,
    pendingCount,
    pendingQueue,
    triggerSyncNow,
    lastSyncResult,
    syncError
  } = useSyncManager()

  const [activeTab, setActiveTab] = useState('assessment')
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)

  // Assessment & AI Evaluation State
  const [currentResult, setCurrentResult] = useState(null)
  const [currentPatientData, setCurrentPatientData] = useState(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isSaved, setIsSaved] = useState(false)

  const resultRef = useRef(null)

  // Run TensorFlow.js Edge Risk Scoring
  const handleEvaluate = async formData => {
    setIsProcessing(true)
    setIsSaved(false)
    try {
      // Small tick to ensure UI displays loading spinner
      await new Promise(r => setTimeout(r, 60))
      const result = await calculateRiskScore(formData)
      setCurrentResult(result)
      setCurrentPatientData(formData)

      // Scroll to result smoothly
      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 100)
    } catch (err) {
      console.error('AI evaluation failed:', err)
      alert('Error running in-browser risk model: ' + err.message)
    } finally {
      setIsProcessing(false)
    }
  }

  // Save Record into IndexedDB & Enqueue for S3 Sync
  const handleSaveRecord = async (patientData, result) => {
    try {
      await savePatientRecord(patientData, result)
      setIsSaved(true)

      // If online, optionally auto-trigger sync in the background
      if (isOnline) {
        triggerSyncNow().catch(e => console.warn('Background sync queued:', e))
      }
    } catch (err) {
      console.error('Failed saving record to IndexedDB:', err)
      alert('Local storage error: ' + err.message)
    }
  }

  const handleStartNew = () => {
    setCurrentResult(null)
    setCurrentPatientData(null)
    setIsSaved(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-100 text-slate-900 pb-20 sm:pb-8">
      {/* App Header */}
      <Header
        isOnline={isOnline}
        isSyncing={isSyncing}
        pendingCount={pendingCount}
        onTriggerSync={triggerSyncNow}
        onOpenSettings={() => setIsSettingsOpen(true)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Network & Offline Status Banner */}
      <NetworkBanner
        isOnline={isOnline}
        isSyncing={isSyncing}
        pendingCount={pendingCount}
        onTriggerSync={triggerSyncNow}
        lastSyncResult={lastSyncResult}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-6 space-y-6">
        {activeTab === 'assessment' && (
          <div className="space-y-6">
            {/* Form */}
            <PatientEntryForm
              onEvaluate={handleEvaluate}
              isProcessing={isProcessing}
            />

            {/* AI Risk Score Result */}
            {currentResult && currentPatientData && (
              <div ref={resultRef} className="pt-2">
                <RiskScoreDisplay
                  result={currentResult}
                  patientData={currentPatientData}
                  onSaveRecord={handleSaveRecord}
                  isSaved={isSaved}
                  onStartNew={handleStartNew}
                />
              </div>
            )}
          </div>
        )}

        {activeTab === 'registry' && (
          <PatientRegistry
            _onSelectPatientForReassessment={() => {
              setActiveTab('assessment')
            }}
          />
        )}

        {activeTab === 'sync' && (
          <SyncManagerView
            isOnline={isOnline}
            isSyncing={isSyncing}
            pendingQueue={pendingQueue}
            pendingCount={pendingCount}
            onTriggerSync={triggerSyncNow}
            lastSyncResult={lastSyncResult}
            syncError={syncError}
            onOpenSettings={() => setIsSettingsOpen(true)}
          />
        )}

        {activeTab === 'model' && <ModelLabView />}
      </main>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />

      {/* Mobile Sticky Bottom Tab Bar (Convenient one-thumb touch access on mobile devices) */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-teal-950/95 backdrop-blur-md border-t border-teal-800 px-2 py-1.5 flex items-center justify-around text-[10px] text-teal-200">
        <button
          onClick={() => setActiveTab('assessment')}
          className={`flex flex-col items-center gap-1 p-1.5 rounded-lg ${
            activeTab === 'assessment' ? 'text-teal-300 font-bold bg-teal-900/60' : 'text-teal-300/60'
          }`}
        >
          <HeartPulse className="w-5 h-5" />
          <span>Assess</span>
        </button>

        <button
          onClick={() => setActiveTab('registry')}
          className={`flex flex-col items-center gap-1 p-1.5 rounded-lg ${
            activeTab === 'registry' ? 'text-teal-300 font-bold bg-teal-900/60' : 'text-teal-300/60'
          }`}
        >
          <Database className="w-5 h-5" />
          <span>Registry</span>
        </button>

        <button
          onClick={() => setActiveTab('sync')}
          className={`flex flex-col items-center gap-1 p-1.5 rounded-lg relative ${
            activeTab === 'sync' ? 'text-teal-300 font-bold bg-teal-900/60' : 'text-teal-300/60'
          }`}
        >
          <Cloud className="w-5 h-5" />
          <span>Sync</span>
          {pendingCount > 0 && (
            <span className="absolute top-0 right-1 w-4 h-4 rounded-full bg-amber-500 text-slate-950 font-bold text-[9px] flex items-center justify-center">
              {pendingCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('model')}
          className={`flex flex-col items-center gap-1 p-1.5 rounded-lg ${
            activeTab === 'model' ? 'text-teal-300 font-bold bg-teal-900/60' : 'text-teal-300/60'
          }`}
        >
          <Cpu className="w-5 h-5" />
          <span>TF Model</span>
        </button>
      </div>
    </div>
  )
}

export default App
