import React, { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../services/db'
import {
  Search,
  Filter,
  Download,
  Trash2,
  Clock,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  MapPin,
  HeartPulse,
  CheckCircle2
} from 'lucide-react'

export function PatientRegistry({ _onSelectPatientForReassessment }) {
  const [searchQuery, setSearchQuery] = useState('')
  const [filterRisk, setFilterRisk] = useState('ALL')
  const [filterSync, setFilterSync] = useState('ALL')
  const [expandedId, setExpandedId] = useState(null)

  // Reactive query watching all patient records in IndexedDB
  const patients = useLiveQuery(() => db.patients.reverse().toArray(), []) || []

  // Filtering logic
  const filteredPatients = patients.filter(patient => {
    // Search query
    const matchSearch =
      !searchQuery ||
      patient.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      patient.patientId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      patient.villageId?.toLowerCase().includes(searchQuery.toLowerCase())

    // Risk level filter
    const matchRisk = filterRisk === 'ALL' || patient.riskLevel === filterRisk

    // Sync status filter
    const matchSync = filterSync === 'ALL' || patient.syncStatus === filterSync

    return matchSearch && matchRisk && matchSync
  })

  // Export records as JSON
  const handleExportJson = () => {
    if (patients.length === 0) {
      alert('No patient records to export.')
      return
    }
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(patients, null, 2))
    const downloadAnchor = document.createElement('a')
    downloadAnchor.setAttribute('href', dataStr)
    downloadAnchor.setAttribute('download', `maternal_records_export_${Date.now()}.json`)
    document.body.appendChild(downloadAnchor)
    downloadAnchor.click()
    downloadAnchor.remove()
  }

  // Delete individual record
  const handleDelete = async (id, e) => {
    e.stopPropagation()
    if (window.confirm('Delete this patient record from local storage?')) {
      await db.patients.delete(id)
      await db.syncQueue.where('patientRecordId').equals(id).delete()
    }
  }

  return (
    <div className="space-y-4">
      {/* Top Header & Export */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
            <HeartPulse className="w-5 h-5 text-teal-600" />
            <span>Local Offline Patient Registry</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold">
              {patients.length} Total
            </span>
          </h2>
          <p className="text-xs text-slate-500">
            Records stored securely in device IndexedDB with cloud synchronization state.
          </p>
        </div>

        <button
          onClick={handleExportJson}
          className="px-3.5 py-2 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer self-start sm:self-auto"
          title="Export records to JSON file"
        >
          <Download className="w-4 h-4 text-slate-500" />
          <span>Export Local JSON</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search patient, ID, village..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={filterRisk}
            onChange={e => setFilterRisk(e.target.value)}
            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-teal-500"
          >
            <option value="ALL">All Risk Levels</option>
            <option value="HIGH">High Risk Only</option>
            <option value="MODERATE">Moderate Risk Only</option>
            <option value="LOW">Low Risk Only</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={filterSync}
            onChange={e => setFilterSync(e.target.value)}
            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-teal-500"
          >
            <option value="ALL">All Cloud Sync States</option>
            <option value="pending">Pending S3 Upload</option>
            <option value="synced">Synced with S3</option>
            <option value="failed">Failed Sync</option>
          </select>
        </div>
      </div>

      {/* Patients List */}
      {filteredPatients.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center space-y-2">
          <p className="text-slate-600 font-semibold text-sm">No patient records found.</p>
          <p className="text-xs text-slate-400">
            {patients.length === 0
              ? 'Perform your first assessment using the "New Assessment" tab.'
              : 'Try adjusting your search query or filters above.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredPatients.map(patient => {
            const isExpanded = expandedId === patient.id
            const isHigh = patient.riskLevel === 'HIGH'
            const isMod = patient.riskLevel === 'MODERATE'

            return (
              <div
                key={patient.id}
                className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs hover:border-slate-300 transition"
              >
                {/* Header Row */}
                <div
                  onClick={() => setExpandedId(isExpanded ? null : patient.id)}
                  className="p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer select-none bg-white hover:bg-slate-50/70 transition"
                >
                  <div className="flex items-start sm:items-center gap-3">
                    {/* Risk Badge Pill */}
                    <div
                      className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center shrink-0 font-bold border ${
                        isHigh
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : isMod
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      }`}
                    >
                      <span className="text-base font-black leading-none">{patient.riskScore}%</span>
                      <span className="text-[9px] uppercase tracking-wider font-extrabold mt-0.5">
                        {patient.riskLevel}
                      </span>
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-sm text-slate-900">{patient.fullName}</h4>
                        <span className="text-[11px] font-mono text-slate-500 px-1.5 py-0.2 rounded bg-slate-100">
                          {patient.patientId}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 mt-1">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          {patient.villageId}
                        </span>
                        <span>Age: {patient.age}y</span>
                        <span>Gest: {patient.gestationalAge}w</span>
                        <span>BP: {patient.systolicBP}/{patient.diastolicBP}</span>
                        <span>HR: {patient.heartRate}</span>
                      </div>
                    </div>
                  </div>

                  {/* Sync Status Badge & Action */}
                  <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                    <div>
                      {patient.syncStatus === 'synced' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Synced to S3</span>
                        </span>
                      ) : patient.syncStatus === 'pending' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300">
                          <Clock className="w-3.5 h-3.5 text-amber-600" />
                          <span>Pending S3 Sync</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-300">
                          <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                          <span>Sync Failed</span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={e => handleDelete(patient.id, e)}
                        className="p-1.5 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                        title="Delete record"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <span className="text-slate-400">
                        {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="p-4 bg-slate-50 border-t border-slate-200 text-xs space-y-3">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                        <span className="text-slate-500 block text-[10px] font-semibold uppercase">
                          Blood Pressure
                        </span>
                        <span className="font-bold text-slate-800 text-sm">
                          {patient.systolicBP} / {patient.diastolicBP} mmHg
                        </span>
                      </div>
                      <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                        <span className="text-slate-500 block text-[10px] font-semibold uppercase">
                          Heart Rate
                        </span>
                        <span className="font-bold text-slate-800 text-sm">
                          {patient.heartRate} bpm
                        </span>
                      </div>
                      <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                        <span className="text-slate-500 block text-[10px] font-semibold uppercase">
                          Blood Glucose
                        </span>
                        <span className="font-bold text-slate-800 text-sm">
                          {patient.bloodGlucose} mg/dL
                        </span>
                      </div>
                      <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                        <span className="text-slate-500 block text-[10px] font-semibold uppercase">
                          Temperature
                        </span>
                        <span className="font-bold text-slate-800 text-sm">
                          {patient.bodyTemp}°F
                        </span>
                      </div>
                    </div>

                    {/* Symptoms */}
                    {patient.symptoms && patient.symptoms.length > 0 && (
                      <div>
                        <span className="font-bold text-slate-700 block mb-1">
                          Reported Danger Symptoms:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {patient.symptoms.map(s => (
                            <span
                              key={s}
                              className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 font-medium text-[11px] border border-rose-200"
                            >
                              {s.replace(/_/g, ' ')}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Factors & Clinical Recommendations */}
                    {patient.contributingFactors && patient.contributingFactors.length > 0 && (
                      <div className="bg-white p-3 rounded-lg border border-slate-200">
                        <span className="font-bold text-slate-700 block mb-1">
                          Edge AI Clinical Assessment:
                        </span>
                        <ul className="list-disc list-inside space-y-0.5 text-slate-600">
                          {patient.contributingFactors.map((f, i) => (
                            <li key={i}>{f}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* S3 Details */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200 text-slate-500 text-[11px]">
                      <span>Created: {new Date(patient.createdAt).toLocaleString()}</span>
                      {patient.s3Key && (
                        <span className="font-mono text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                          S3 Key: {patient.s3Key}
                        </span>
                      )}
                      {patient.syncError && (
                        <span className="text-rose-600 font-semibold">
                          Error: {patient.syncError}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
