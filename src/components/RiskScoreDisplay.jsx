import React, { useState } from 'react'
import {
  AlertTriangle,
  CheckCircle,
  AlertOctagon,
  ShieldAlert,
  Database,
  CloudUpload,
  Clock,
  Cpu,
  FileCheck2,
  Check
} from 'lucide-react'

export function RiskScoreDisplay({
  result,
  patientData,
  onSaveRecord,
  isSaved,
  onStartNew
}) {
  const [saving, setSaving] = useState(false)

  if (!result) return null

  const isHigh = result.level === 'HIGH'
  const isModerate = result.level === 'MODERATE'
  const isLow = result.level === 'LOW'

  const handleSave = async () => {
    setSaving(true)
    try {
      await onSaveRecord(patientData, result)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden transition-all duration-300">
      {/* High-Risk / Emergency Banner */}
      {result.isEmergency && (
        <div className="bg-rose-600 text-white px-4 py-2.5 flex items-center justify-between text-xs sm:text-sm font-bold tracking-wide animate-pulse">
          <div className="flex items-center gap-2">
            <AlertOctagon className="w-5 h-5 text-white shrink-0" />
            <span>CRITICAL MATERNAL EMERGENCY - IMMEDIATE HOSPITAL REFERRAL REQUIRED</span>
          </div>
          <span className="hidden sm:inline-block px-2 py-0.5 rounded bg-white text-rose-700 font-extrabold uppercase text-xs">
            Priority 1
          </span>
        </div>
      )}

      {/* Main Score Header */}
      <div
        className={`p-5 sm:p-6 text-white border-b ${
          isHigh
            ? 'bg-rose-800 border-rose-900'
            : isModerate
            ? 'bg-amber-600 border-amber-700'
            : 'bg-emerald-700 border-emerald-800'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-wider font-extrabold px-2.5 py-0.5 rounded bg-black/20 text-white border border-white/20">
                In-Browser AI Triage
              </span>
              <span className="text-xs font-mono text-white/80">
                Patient: {patientData.fullName} ({patientData.age}y, {patientData.gestationalAge}w)
              </span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-2">
              {isHigh && <ShieldAlert className="w-8 h-8 text-rose-200 shrink-0" />}
              {isModerate && <AlertTriangle className="w-8 h-8 text-amber-200 shrink-0" />}
              {isLow && <CheckCircle className="w-8 h-8 text-emerald-200 shrink-0" />}
              <span>
                {isHigh && 'HIGH RISK MATERNAL PROFILE'}
                {isModerate && 'MODERATE RISK - CLOSE MONITORING'}
                {isLow && 'LOW RISK - ROUTINE ANTENATAL'}
              </span>
            </h3>
            <p className="text-xs sm:text-sm text-white/90 max-w-xl">
              {isHigh &&
                'High probability of maternal or fetal complications. Immediate referral to Community Health Center (CHC) or District Hospital.'}
              {isModerate &&
                'Elevated risk factors detected. Schedule clinical re-evaluation within 48-72 hours.'}
              {isLow &&
                'Vitals and clinical parameters are within acceptable safe antenatal thresholds.'}
            </p>
          </div>

          {/* Radial / Score Percentage Pill */}
          <div className="flex items-center gap-3 bg-black/25 backdrop-blur-xs p-4 rounded-2xl border border-white/20 shrink-0 self-start sm:self-auto">
            <div className="text-right">
              <div className="text-3xl sm:text-4xl font-black font-mono tracking-tight leading-none">
                {result.score}%
              </div>
              <div className="text-[10px] uppercase font-bold tracking-wider text-white/80 mt-1">
                Risk Probability
              </div>
            </div>
            <div className="w-12 h-12 rounded-full border-4 border-white/30 border-t-white flex items-center justify-center font-bold text-xs">
              AI
            </div>
          </div>
        </div>
      </div>

      <div className="p-5 sm:p-6 space-y-6">
        {/* Model Execution Metadata Pill */}
        <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600">
          <div className="flex items-center gap-1.5 font-mono">
            <Cpu className="w-3.5 h-3.5 text-teal-600" />
            <span>Engine: {result.modelVersion}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              Inference Latency: <strong>{result.inferenceLatencyMs} ms</strong>
            </span>
            <span className="text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              Zero Network Used
            </span>
          </div>
        </div>

        {/* Contributing Factors & Clinical Recommendations */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Identified Risk Factors */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              Identified Clinical Risk Factors
            </h4>
            <ul className="space-y-2">
              {result.factors.map((factor, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-2 text-xs sm:text-sm font-medium text-slate-800"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0" />
                  <span>{factor}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Actionable Clinical Protocol */}
          <div className="p-4 rounded-xl bg-teal-50/60 border border-teal-200">
            <h4 className="text-xs font-bold uppercase tracking-wider text-teal-900 mb-3 flex items-center gap-1.5">
              <FileCheck2 className="w-4 h-4 text-teal-700" />
              Actionable Health Worker Care Plan
            </h4>
            <ol className="space-y-2.5">
              {result.recommendations.map((rec, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-2 text-xs sm:text-sm font-medium text-slate-800"
                >
                  <span className="w-5 h-5 rounded-full bg-teal-200 text-teal-900 font-bold text-xs flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                  <span>{rec}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>

        {/* Action Controls & Offline Save */}
        <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <Database className="w-4 h-4 text-slate-400" />
            <span>
              Saving writes directly to <strong>IndexedDB</strong> and queues for AWS S3 upload.
            </span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {isSaved ? (
              <div className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-100 text-emerald-800 font-bold text-sm border border-emerald-300 w-full sm:w-auto justify-center">
                <Check className="w-4 h-4 text-emerald-700" />
                <span>Saved & Enqueued for Sync</span>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-md transition cursor-pointer"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Writing to IndexedDB...</span>
                  </>
                ) : (
                  <>
                    <CloudUpload className="w-4 h-4 text-teal-300" />
                    <span>Save Patient & Queue Sync</span>
                  </>
                )}
              </button>
            )}

            <button
              type="button"
              onClick={onStartNew}
              className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 font-semibold text-xs sm:text-sm transition cursor-pointer whitespace-nowrap"
            >
              Assess Next Patient
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
