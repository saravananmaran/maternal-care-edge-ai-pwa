import Dexie from 'dexie'

/**
 * IndexedDB database for MaternalCare Edge AI PWA.
 * Uses Dexie.js for resilient offline-first storage and synchronization queues.
 */
export const db = new Dexie('MaternalCareOfflineDB')

db.version(1).stores({
  patients: '++id, patientId, villageId, fullName, riskLevel, riskScore, syncStatus, createdAt, syncedAt',
  syncQueue: '++id, patientRecordId, patientId, queuedAt, retryCount',
  formDraft: 'key',
  settings: 'key'
})

/**
 * Save a new or updated patient record to IndexedDB
 * and automatically enqueue it into the offline syncQueue.
 */
export async function savePatientRecord(patientData, riskResult) {
  const now = new Date().toISOString()
  const recordId = patientData.id

  const recordPayload = {
    patientId: patientData.patientId || `MCH-${Date.now().toString().slice(-6)}`,
    villageId: patientData.villageId || 'VIL-CENTRAL-01',
    fullName: patientData.fullName?.trim() || 'Anonymous Patient',
    age: Number(patientData.age),
    gestationalAge: Number(patientData.gestationalAge),
    gravida: Number(patientData.gravida || 1),
    parity: Number(patientData.parity || 0),
    systolicBP: Number(patientData.systolicBP),
    diastolicBP: Number(patientData.diastolicBP),
    heartRate: Number(patientData.heartRate),
    bloodGlucose: Number(patientData.bloodGlucose),
    bodyTemp: Number(patientData.bodyTemp),
    symptoms: patientData.symptoms || [],
    notes: patientData.notes || '',
    riskScore: riskResult.score,
    riskLevel: riskResult.level,
    contributingFactors: riskResult.factors || [],
    clinicalRecommendations: riskResult.recommendations || [],
    modelMetadata: {
      modelVersion: riskResult.modelVersion || 'tfjs-maternal-v1.2',
      inferenceLatencyMs: riskResult.inferenceLatencyMs || 0,
      timestamp: now
    },
    syncStatus: 'pending',
    syncError: null,
    s3Key: null,
    createdAt: patientData.createdAt || now,
    updatedAt: now,
    syncedAt: null
  }

  let savedLocalId

  if (recordId) {
    // Update existing record
    await db.patients.update(recordId, recordPayload)
    savedLocalId = recordId
  } else {
    // Insert new record
    savedLocalId = await db.patients.add(recordPayload)
  }

  // Construct S3 export payload
  const s3Payload = {
    schemaVersion: '1.0',
    recordId: savedLocalId,
    ...recordPayload,
    deviceInfo: {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      exportedAt: now
    }
  }

  // Enqueue into syncQueue (check if already in queue to avoid duplicate items)
  const existingQueueItem = await db.syncQueue
    .where('patientRecordId')
    .equals(savedLocalId)
    .first()

  if (existingQueueItem) {
    await db.syncQueue.update(existingQueueItem.id, {
      payload: s3Payload,
      queuedAt: now,
      retryCount: 0,
      lastError: null
    })
  } else {
    await db.syncQueue.add({
      patientRecordId: savedLocalId,
      patientId: recordPayload.patientId,
      action: recordId ? 'UPDATE' : 'CREATE',
      payload: s3Payload,
      queuedAt: now,
      retryCount: 0,
      lastAttemptAt: null,
      lastError: null
    })
  }

  // Clear draft once saved
  await clearFormDraft()

  return { id: savedLocalId, ...recordPayload }
}

/**
 * Retrieve all pending sync queue items.
 */
export async function getPendingSyncQueue() {
  return await db.syncQueue.toArray()
}

/**
 * Remove an item from sync queue and mark the patient record as 'synced'.
 */
export async function markRecordAsSynced(patientRecordId, s3Key) {
  const now = new Date().toISOString()
  
  await db.transaction('rw', db.patients, db.syncQueue, async () => {
    // Update patient record
    await db.patients.update(patientRecordId, {
      syncStatus: 'synced',
      syncError: null,
      s3Key,
      syncedAt: now
    })

    // Delete from sync queue
    await db.syncQueue
      .where('patientRecordId')
      .equals(patientRecordId)
      .delete()
  })
}

/**
 * Mark a record's sync attempt as failed and increment retry count.
 */
export async function markRecordSyncFailed(patientRecordId, errorMessage) {
  const now = new Date().toISOString()

  await db.transaction('rw', db.patients, db.syncQueue, async () => {
    await db.patients.update(patientRecordId, {
      syncStatus: 'failed',
      syncError: errorMessage
    })

    const queueItem = await db.syncQueue
      .where('patientRecordId')
      .equals(patientRecordId)
      .first()

    if (queueItem) {
      await db.syncQueue.update(queueItem.id, {
        retryCount: (queueItem.retryCount || 0) + 1,
        lastAttemptAt: now,
        lastError: errorMessage
      })
    }
  })
}

/**
 * Save form draft in real-time to avoid data loss.
 */
export async function saveFormDraft(formData) {
  try {
    await db.formDraft.put({
      key: 'current_patient_draft',
      data: formData,
      updatedAt: Date.now()
    })
  } catch (err) {
    console.warn('Draft auto-save failed:', err)
  }
}

/**
 * Retrieve saved form draft.
 */
export async function getFormDraft() {
  const draft = await db.formDraft.get('current_patient_draft')
  return draft ? draft.data : null
}

/**
 * Clear the current form draft.
 */
export async function clearFormDraft() {
  await db.formDraft.delete('current_patient_draft')
}

/**
 * Get or set application settings (AWS credentials, village id, etc.)
 */
export async function getSetting(key, defaultValue = null) {
  const setting = await db.settings.get(key)
  return setting ? setting.value : defaultValue
}

export async function setSetting(key, value) {
  await db.settings.put({ key, value })
}

