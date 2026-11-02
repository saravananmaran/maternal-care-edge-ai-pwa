import React, { useState, useEffect } from 'react'
import {
  X,
  Settings,
  Server,
  Key,
  MapPin,
  Save,
  Trash2,
  CheckCircle
} from 'lucide-react'
import { getEffectiveAwsConfig } from '../services/s3Sync'
import { setSetting, db } from '../services/db'

export function SettingsModal({ isOpen, onClose }) {
  const [config, setConfig] = useState({
    region: 'us-east-1',
    bucketName: 'maternal-health-records-edge-sync',
    accessKeyId: '',
    secretAccessKey: '',
    sessionToken: '',
    enableSimulation: true,
    defaultVillageId: 'VIL-CENTRAL-01'
  })
  const [savedSuccess, setSavedSuccess] = useState(false)

  useEffect(() => {
    if (isOpen) {
      async function load() {
        const effective = await getEffectiveAwsConfig()
        const village = (await db.settings.get('default_village'))?.value || 'VIL-CENTRAL-01'
        setConfig({
          ...effective,
          defaultVillageId: village
        })
      }
      load()
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleSave = async e => {
    e.preventDefault()
    await setSetting('aws_config', {
      region: config.region,
      bucketName: config.bucketName,
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
      sessionToken: config.sessionToken,
      enableSimulation: config.enableSimulation
    })
    await setSetting('default_village', config.defaultVillageId)

    setSavedSuccess(true)
    setTimeout(() => {
      setSavedSuccess(false)
      onClose()
    }, 1200)
  }

  const handleClearAllData = async () => {
    if (
      window.confirm(
        'CAUTION: Are you sure you want to delete ALL local patient records and reset the IndexedDB database?'
      )
    ) {
      await db.patients.clear()
      await db.syncQueue.clear()
      await db.formDraft.clear()
      alert('Local database cleared.')
      window.location.reload()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto border border-slate-200 shadow-2xl">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-slate-900 text-white flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-teal-400" />
            <h3 className="font-bold text-base sm:text-lg">App & Cloud Sync Configuration</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-5 sm:p-6 space-y-5 text-xs sm:text-sm">
          {/* Simulation Mode Toggle */}
          <div className="p-3.5 rounded-xl bg-teal-50 border border-teal-200">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={config.enableSimulation}
                onChange={e => setConfig({ ...config, enableSimulation: e.target.checked })}
                className="mt-0.5 rounded border-teal-300 text-teal-600 focus:ring-teal-500 h-4 w-4"
              />
              <div>
                <span className="font-bold text-teal-950 block text-xs sm:text-sm">
                  Enable S3 Simulation Mode (Recommended for testing without IAM keys)
                </span>
                <span className="text-teal-800 text-xs block mt-0.5">
                  Allows full offline queueing and mock S3 HTTP 200 upload responses without requiring live AWS credentials. Uncheck when using real AWS S3.
                </span>
              </div>
            </label>
          </div>

          {/* AWS S3 Bucket Settings */}
          <div>
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
              <Server className="w-4 h-4 text-teal-600" />
              AWS S3 Bucket Details
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  AWS S3 Bucket Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. maternal-health-records-edge-sync"
                  value={config.bucketName}
                  onChange={e => setConfig({ ...config, bucketName: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono text-xs focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  AWS Region
                </label>
                <input
                  type="text"
                  placeholder="e.g. us-east-1"
                  value={config.region}
                  onChange={e => setConfig({ ...config, region: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono text-xs focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>
          </div>

          {/* IAM Credentials */}
          <div>
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
              <Key className="w-4 h-4 text-teal-600" />
              AWS IAM Access Credentials (Optional in Simulation Mode)
            </h4>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  AWS Access Key ID
                </label>
                <input
                  type="text"
                  placeholder="AKIAIOSFODNN7EXAMPLE"
                  value={config.accessKeyId}
                  onChange={e => setConfig({ ...config, accessKeyId: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono text-xs focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  AWS Secret Access Key
                </label>
                <input
                  type="password"
                  placeholder="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
                  value={config.secretAccessKey}
                  onChange={e => setConfig({ ...config, secretAccessKey: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono text-xs focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  AWS Session Token (Optional / STS)
                </label>
                <input
                  type="password"
                  placeholder="Leave blank if using permanent IAM credentials"
                  value={config.sessionToken}
                  onChange={e => setConfig({ ...config, sessionToken: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono text-xs focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>
          </div>

          {/* Default Village ID */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              Default Health Center / Village ID
            </label>
            <input
              type="text"
              placeholder="e.g. VIL-CENTRAL-01"
              value={config.defaultVillageId}
              onChange={e => setConfig({ ...config, defaultVillageId: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-teal-500"
            />
          </div>

          {/* Reset / Danger Zone */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
            <button
              type="button"
              onClick={handleClearAllData}
              className="text-xs text-rose-600 hover:text-rose-800 font-semibold flex items-center gap-1 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Reset Local Database
            </button>
            <span className="text-[11px] text-slate-400">IndexedDB: MaternalCareOfflineDB</span>
          </div>

          {/* Action buttons */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 font-medium text-xs cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              {savedSuccess ? (
                <>
                  <CheckCircle className="w-4 h-4 text-teal-200" />
                  <span>Saved!</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save Configuration</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
