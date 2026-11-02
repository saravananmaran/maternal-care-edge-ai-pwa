import React, { useState, useEffect, useCallback } from 'react'
import {
  HeartPulse,
  Activity,
  AlertOctagon,
  Sparkles,
  RotateCcw,
  User,
  MapPin,
  Calendar,
  Thermometer,
  Droplet,
  FileText,
  BookmarkCheck
} from 'lucide-react'
import { DANGER_SIGNS } from '../services/aiRiskModel'
import { CLINICAL_PRESETS } from '../services/mockData'
import { saveFormDraft, getFormDraft, clearFormDraft } from '../services/db'

const INITIAL_FORM_STATE = {
  fullName: '',
  villageId: 'VIL-CENTRAL-01',
  patientId: '',
  age: '',
  gestationalAge: '',
  gravida: '1',
  parity: '0',
  systolicBP: '',
  diastolicBP: '',
  heartRate: '',
  bloodGlucose: '',
  bodyTemp: '98.6',
  symptoms: [],
  notes: ''
}

let demoCounter = 10001
function getNextDemoPatientId() {
  return `MCH-${demoCounter++}`
}

export function PatientEntryForm({ onEvaluate, isProcessing }) {
  const [formData, setFormData] = useState(INITIAL_FORM_STATE)
  const [draftRestored, setDraftRestored] = useState(false)
  const [errors, setErrors] = useState({})

  // Load draft from IndexedDB on component mount
  useEffect(() => {
    async function loadSavedDraft() {
      try {
        const savedDraft = await getFormDraft()
        if (savedDraft && Object.keys(savedDraft).length > 0) {
          setFormData(savedDraft)
          setDraftRestored(true)
          setTimeout(() => setDraftRestored(false), 3000)
        }
      } catch (err) {
        console.warn('Failed loading draft:', err)
      }
    }
    loadSavedDraft()
  }, [])

  // Auto-save draft on form change
  const handleChange = useCallback((field, value) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value }
      saveFormDraft(updated)
      return updated
    })

    // Clear error for field if any
    setErrors(prev => {
      if (prev[field]) {
        const next = { ...prev }
        delete next[field]
        return next
      }
      return prev
    })
  }, [])

  const handleToggleSymptom = symptomId => {
    setFormData(prev => {
      const current = prev.symptoms || []
      const next = current.includes(symptomId)
        ? current.filter(id => id !== symptomId)
        : [...current, symptomId]
      const updated = { ...prev, symptoms: next }
      saveFormDraft(updated)
      return updated
    })
  }

  const handleApplyPreset = preset => {
    const updated = {
      ...INITIAL_FORM_STATE,
      ...preset.data,
      patientId: getNextDemoPatientId()
    }
    setFormData(updated)
    saveFormDraft(updated)
    setErrors({})
  }

  const handleReset = async () => {
    if (window.confirm('Reset this form and clear entered vitals?')) {
      setFormData(INITIAL_FORM_STATE)
      setErrors({})
      await clearFormDraft()
    }
  }

  const validateForm = () => {
    const newErrors = {}
    if (!formData.fullName.trim()) newErrors.fullName = 'Patient name is required'
    if (!formData.age || formData.age < 12 || formData.age > 55) {
      newErrors.age = 'Enter valid maternal age (12 - 55)'
    }
    if (!formData.gestationalAge || formData.gestationalAge < 4 || formData.gestationalAge > 44) {
      newErrors.gestationalAge = 'Enter gestational weeks (4 - 44)'
    }
    if (!formData.systolicBP || formData.systolicBP < 60 || formData.systolicBP > 240) {
      newErrors.systolicBP = 'Enter systolic BP (60 - 240)'
    }
    if (!formData.diastolicBP || formData.diastolicBP < 35 || formData.diastolicBP > 160) {
      newErrors.diastolicBP = 'Enter diastolic BP (35 - 160)'
    }
    if (!formData.heartRate || formData.heartRate < 40 || formData.heartRate > 200) {
      newErrors.heartRate = 'Enter heart rate (40 - 200)'
    }
    if (!formData.bloodGlucose || formData.bloodGlucose < 30 || formData.bloodGlucose > 500) {
      newErrors.bloodGlucose = 'Enter blood glucose (30 - 500)'
    }
    if (!formData.bodyTemp || formData.bodyTemp < 92 || formData.bodyTemp > 108) {
      newErrors.bodyTemp = 'Enter temperature in °F (92 - 108)'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = e => {
    e.preventDefault()
    if (validateForm()) {
      onEvaluate(formData)
    } else {
      // Scroll to top of form to show validation message
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  // Visual cues for BP classification
  const sysVal = Number(formData.systolicBP) || 0
  const diaVal = Number(formData.diastolicBP) || 0
  const isBPCrisis = sysVal >= 160 || diaVal >= 110
  const isBPHigh = (sysVal >= 140 && sysVal < 160) || (diaVal >= 90 && diaVal < 110)
  const isBPElevated = sysVal >= 120 && sysVal < 140 && diaVal < 90

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Top Banner / Auto-Save Indicator */}
      <div className="bg-slate-900 text-white px-4 py-3 sm:px-6 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <HeartPulse className="w-5 h-5 text-teal-400" />
          <h2 className="font-bold text-base sm:text-lg tracking-tight">
            Patient Vitals & Danger Sign Assessment
          </h2>
        </div>
        <div className="flex items-center gap-2 text-xs">
          {draftRestored && (
            <span className="flex items-center gap-1 text-emerald-400 font-medium">
              <BookmarkCheck className="w-3.5 h-3.5" />
              Draft Restored from Local Storage
            </span>
          )}
          <span className="text-slate-400 font-mono text-[11px] hidden sm:inline">
            Draft Auto-saved to IndexedDB
          </span>
        </div>
      </div>

      {/* Quick Clinical Scenarios Presets Bar */}
      <div className="bg-teal-50/70 border-b border-teal-100 px-4 py-2.5 sm:px-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <span className="text-xs font-semibold text-teal-900 flex items-center gap-1 shrink-0">
            <Sparkles className="w-3.5 h-3.5 text-teal-600" />
            Quick Clinical Presets for Field Demonstration:
          </span>
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            {CLINICAL_PRESETS.map(preset => (
              <button
                key={preset.id}
                type="button"
                onClick={() => handleApplyPreset(preset)}
                className={`text-xs px-2.5 py-1 rounded-md font-medium whitespace-nowrap transition cursor-pointer border ${
                  preset.color === 'red'
                    ? 'bg-rose-100 hover:bg-rose-200 text-rose-800 border-rose-200'
                    : preset.color === 'amber'
                    ? 'bg-amber-100 hover:bg-amber-200 text-amber-800 border-amber-200'
                    : 'bg-emerald-100 hover:bg-emerald-200 text-emerald-800 border-emerald-200'
                }`}
                title={`Load sample case: ${preset.label}`}
              >
                {preset.tag}
              </button>
            ))}
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-6">
        {/* Section 1: Demographics */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
            <User className="w-4 h-4 text-teal-600" />
            1. Patient Information
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Full Name */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Full Name of Mother *
              </label>
              <input
                type="text"
                placeholder="e.g. Maria Gonzalez / Sunita Devi"
                value={formData.fullName}
                onChange={e => handleChange('fullName', e.target.value)}
                className={`w-full px-3.5 py-2.5 rounded-lg border text-sm font-medium transition focus:ring-2 focus:ring-teal-500 focus:border-teal-500 ${
                  errors.fullName ? 'border-rose-400 bg-rose-50/50' : 'border-slate-300 bg-white'
                }`}
              />
              {errors.fullName && <p className="text-rose-600 text-xs mt-1">{errors.fullName}</p>}
            </div>

            {/* Village / Sector */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                Village / Sub-Center ID
              </label>
              <input
                type="text"
                placeholder="e.g. VIL-NORTH-04"
                value={formData.villageId}
                onChange={e => handleChange('villageId', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 bg-white text-sm font-medium focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              />
            </div>

            {/* Patient ID */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                National / RCH Health ID
              </label>
              <input
                type="text"
                placeholder="Auto-generated if blank"
                value={formData.patientId}
                onChange={e => handleChange('patientId', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 bg-white text-sm font-mono focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              />
            </div>

            {/* Age */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Maternal Age (Years) *
              </label>
              <input
                type="number"
                min="12"
                max="55"
                placeholder="e.g. 24"
                value={formData.age}
                onChange={e => handleChange('age', e.target.value)}
                className={`w-full px-3.5 py-2.5 rounded-lg border text-sm font-semibold transition focus:ring-2 focus:ring-teal-500 focus:border-teal-500 ${
                  errors.age ? 'border-rose-400 bg-rose-50/50' : 'border-slate-300 bg-white'
                }`}
              />
              {errors.age && <p className="text-rose-600 text-xs mt-1">{errors.age}</p>}
            </div>

            {/* Gestational Age */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                Gestational Age (Weeks) *
              </label>
              <input
                type="number"
                min="4"
                max="44"
                placeholder="e.g. 32"
                value={formData.gestationalAge}
                onChange={e => handleChange('gestationalAge', e.target.value)}
                className={`w-full px-3.5 py-2.5 rounded-lg border text-sm font-semibold transition focus:ring-2 focus:ring-teal-500 focus:border-teal-500 ${
                  errors.gestationalAge ? 'border-rose-400 bg-rose-50/50' : 'border-slate-300 bg-white'
                }`}
              />
              {errors.gestationalAge && (
                <p className="text-rose-600 text-xs mt-1">{errors.gestationalAge}</p>
              )}
            </div>

            {/* Gravida */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Gravidity (Total Pregnancies)
              </label>
              <input
                type="number"
                min="1"
                max="15"
                placeholder="1"
                value={formData.gravida}
                onChange={e => handleChange('gravida', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 bg-white text-sm font-semibold focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              />
            </div>

            {/* Parity */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Parity (Prior Deliveries)
              </label>
              <input
                type="number"
                min="0"
                max="15"
                placeholder="0"
                value={formData.parity}
                onChange={e => handleChange('parity', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 bg-white text-sm font-semibold focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Clinical Vitals */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-teal-600" />
              2. Objective Vital Signs
            </h3>
            {isBPCrisis ? (
              <span className="text-xs font-bold px-2 py-0.5 rounded bg-rose-600 text-white animate-pulse">
                CRITICAL BP ALERT
              </span>
            ) : isBPHigh ? (
              <span className="text-xs font-bold px-2 py-0.5 rounded bg-amber-500 text-slate-950">
                HYPERTENSION LEVEL
              </span>
            ) : null}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Blood Pressure Combo Card */}
            <div
              className={`p-3.5 rounded-xl border transition-all ${
                isBPCrisis
                  ? 'bg-rose-50/70 border-rose-300 ring-2 ring-rose-400'
                  : isBPHigh
                  ? 'bg-amber-50/70 border-amber-300 ring-1 ring-amber-400'
                  : isBPElevated
                  ? 'bg-yellow-50/70 border-yellow-300'
                  : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-slate-800">
                  Blood Pressure (mmHg) *
                </label>
                <span className="text-[10px] text-slate-500 font-medium">Sys / Dia</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <input
                    type="number"
                    min="60"
                    max="240"
                    placeholder="Systolic (120)"
                    value={formData.systolicBP}
                    onChange={e => handleChange('systolicBP', e.target.value)}
                    className={`w-full px-3 py-2 rounded-lg border text-sm font-bold text-center ${
                      errors.systolicBP ? 'border-rose-400 bg-rose-50' : 'border-slate-300 bg-white'
                    }`}
                  />
                  <span className="block text-[10px] text-slate-500 text-center mt-1">
                    Systolic
                  </span>
                </div>
                <div>
                  <input
                    type="number"
                    min="35"
                    max="160"
                    placeholder="Diastolic (80)"
                    value={formData.diastolicBP}
                    onChange={e => handleChange('diastolicBP', e.target.value)}
                    className={`w-full px-3 py-2 rounded-lg border text-sm font-bold text-center ${
                      errors.diastolicBP ? 'border-rose-400 bg-rose-50' : 'border-slate-300 bg-white'
                    }`}
                  />
                  <span className="block text-[10px] text-slate-500 text-center mt-1">
                    Diastolic
                  </span>
                </div>
              </div>
              {(errors.systolicBP || errors.diastolicBP) && (
                <p className="text-rose-600 text-xs mt-1.5">
                  {errors.systolicBP || errors.diastolicBP}
                </p>
              )}
            </div>

            {/* Heart Rate */}
            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50">
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Heart Rate / Pulse (bpm) *
              </label>
              <input
                type="number"
                min="40"
                max="200"
                placeholder="e.g. 78"
                value={formData.heartRate}
                onChange={e => handleChange('heartRate', e.target.value)}
                className={`w-full px-3 py-2 rounded-lg border text-sm font-semibold ${
                  errors.heartRate ? 'border-rose-400 bg-rose-50' : 'border-slate-300 bg-white'
                }`}
              />
              <span className="block text-[10px] text-slate-500 mt-1">Normal: 60 - 100 bpm</span>
              {errors.heartRate && <p className="text-rose-600 text-xs mt-1">{errors.heartRate}</p>}
            </div>

            {/* Blood Glucose */}
            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50">
              <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center gap-1">
                <Droplet className="w-3.5 h-3.5 text-rose-500" />
                Blood Glucose (mg/dL) *
              </label>
              <input
                type="number"
                min="30"
                max="500"
                placeholder="e.g. 95 (Fasting/Random)"
                value={formData.bloodGlucose}
                onChange={e => handleChange('bloodGlucose', e.target.value)}
                className={`w-full px-3 py-2 rounded-lg border text-sm font-semibold ${
                  errors.bloodGlucose ? 'border-rose-400 bg-rose-50' : 'border-slate-300 bg-white'
                }`}
              />
              <span className="block text-[10px] text-slate-500 mt-1">
                Normal Random: &lt; 140 mg/dL
              </span>
              {errors.bloodGlucose && (
                <p className="text-rose-600 text-xs mt-1">{errors.bloodGlucose}</p>
              )}
            </div>

            {/* Body Temperature */}
            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50">
              <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center gap-1">
                <Thermometer className="w-3.5 h-3.5 text-amber-500" />
                Body Temperature (°F) *
              </label>
              <input
                type="number"
                step="0.1"
                min="92"
                max="108"
                placeholder="e.g. 98.6"
                value={formData.bodyTemp}
                onChange={e => handleChange('bodyTemp', e.target.value)}
                className={`w-full px-3 py-2 rounded-lg border text-sm font-semibold ${
                  errors.bodyTemp ? 'border-rose-400 bg-rose-50' : 'border-slate-300 bg-white'
                }`}
              />
              <span className="block text-[10px] text-slate-500 mt-1">
                Normal: 97.7°F - 99.5°F
              </span>
              {errors.bodyTemp && <p className="text-rose-600 text-xs mt-1">{errors.bodyTemp}</p>}
            </div>
          </div>
        </div>

        {/* Section 3: Danger Signs Checklist */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <AlertOctagon className="w-4 h-4 text-rose-600" />
              3. WHO Maternal Danger Signs Checklist
            </h3>
            <span className="text-xs font-medium text-slate-500">
              {formData.symptoms.length} selected
            </span>
          </div>
          <p className="text-xs text-slate-600 mb-3">
            Select any danger symptoms observed by or reported to the healthcare worker:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {DANGER_SIGNS.map(sign => {
              const isChecked = (formData.symptoms || []).includes(sign.id)
              return (
                <label
                  key={sign.id}
                  onClick={() => handleToggleSymptom(sign.id)}
                  className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer select-none transition-all ${
                    isChecked
                      ? 'bg-rose-50/90 border-rose-300 text-rose-950 ring-1 ring-rose-400'
                      : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-800'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => {}} // handled by parent label onClick
                    className="mt-0.5 rounded border-slate-300 text-rose-600 focus:ring-rose-500 h-4 w-4"
                  />
                  <div className="text-xs font-medium leading-tight">
                    <span>{sign.label}</span>
                    <span className="block text-[10px] text-slate-500 mt-0.5 font-normal">
                      Focus: {sign.category}
                    </span>
                  </div>
                </label>
              )
            })}
          </div>
        </div>

        {/* Section 4: Clinical Notes */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
            <FileText className="w-3.5 h-3.5 text-slate-400" />
            4. Clinical Observations & Field Notes (Optional)
          </label>
          <textarea
            rows="2"
            placeholder="Document any relevant past medical history, family history of pre-eclampsia, or physical exam findings..."
            value={formData.notes}
            onChange={e => handleChange('notes', e.target.value)}
            className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-sm font-medium focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
          ></textarea>
        </div>

        {/* Actions Bar */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-200">
          <button
            type="button"
            onClick={handleReset}
            className="w-full sm:w-auto px-4 py-2.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 font-medium text-sm flex items-center justify-center gap-2 transition cursor-pointer"
          >
            <RotateCcw className="w-4 h-4 text-slate-500" />
            <span>Clear / Reset Form</span>
          </button>

          <button
            type="submit"
            disabled={isProcessing}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition cursor-pointer disabled:opacity-50"
          >
            {isProcessing ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Running TensorFlow.js Edge Model...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 text-teal-300" />
                <span>Calculate AI Risk & Triage</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
