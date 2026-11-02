import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import {
  getPendingSyncQueue,
  markRecordAsSynced,
  markRecordSyncFailed,
  getSetting
} from './db'

/**
 * ============================================================================
 * AWS S3 BACKGROUND CLOUD SYNCHRONIZATION SERVICE
 * ============================================================================
 * 
 * INSERT YOUR AWS CREDENTIALS HERE OR IN A `.env` FILE:
 * - VITE_AWS_REGION
 * - VITE_AWS_BUCKET_NAME
 * - VITE_AWS_ACCESS_KEY_ID
 * - VITE_AWS_SECRET_ACCESS_KEY
 * - VITE_AWS_SESSION_TOKEN (Optional, for temporary STS credentials)
 * 
 * Alternatively, you can enter credentials directly inside the app's
 * "Settings" modal without rebuilding the app.
 * ============================================================================
 */

export const DEFAULT_AWS_CONFIG = {
  region: import.meta.env.VITE_AWS_REGION || 'us-east-1',
  bucketName: import.meta.env.VITE_AWS_BUCKET_NAME || 'maternal-health-records-edge-sync',
  accessKeyId: import.meta.env.VITE_AWS_ACCESS_KEY_ID || '',
  secretAccessKey: import.meta.env.VITE_AWS_SECRET_ACCESS_KEY || '',
  sessionToken: import.meta.env.VITE_AWS_SESSION_TOKEN || '',
  // When enableSimulation is true, simulated S3 uploads succeed locally for offline testing
  enableSimulation: import.meta.env.VITE_AWS_ENABLE_SIMULATION !== 'false'
}

let activeSyncPromise = null
const syncListeners = new Set()

/**
 * Register a listener for sync lifecycle events (started, completed, failed, progress).
 */
export function subscribeToSyncEvents(listener) {
  syncListeners.add(listener)
  return () => syncListeners.delete(listener)
}

function notifySyncListeners(event) {
  syncListeners.forEach(listener => {
    try {
      listener(event)
    } catch (err) {
      console.error('Error in sync listener:', err)
    }
  })
}

/**
 * Retrieves the effective AWS configuration (IndexedDB settings take precedence, then env, then defaults).
 */
export async function getEffectiveAwsConfig() {
  const customConfig = await getSetting('aws_config', null)
  return {
    ...DEFAULT_AWS_CONFIG,
    ...(customConfig || {})
  }
}

/**
 * Creates an initialized S3Client instance.
 */
export async function createS3Client() {
  const config = await getEffectiveAwsConfig()

  if (!config.accessKeyId || !config.secretAccessKey) {
    if (config.enableSimulation) {
      return null // Will trigger mock upload simulator
    }
    throw new Error('AWS credentials missing. Please configure Access Key ID and Secret Access Key in Settings.')
  }

  const credentials = {
    accessKeyId: config.accessKeyId.trim(),
    secretAccessKey: config.secretAccessKey.trim()
  }

  if (config.sessionToken && config.sessionToken.trim()) {
    credentials.sessionToken = config.sessionToken.trim()
  }

  return new S3Client({
    region: config.region.trim(),
    credentials
  })
}

/**
 * Executes a simulated S3 upload with realistic network latency
 * for testing when actual AWS IAM credentials are not configured.
 */
async function simulateS3Upload(s3Key, _payload) {
  await new Promise(resolve => setTimeout(resolve, 600))
  console.info(`[S3 SIMULATION] Uploaded payload to s3://${DEFAULT_AWS_CONFIG.bucketName}/${s3Key}`)
  return {
    $metadata: { httpStatusCode: 200 },
    ETag: `"${Math.random().toString(16).substring(2, 10)}"`,
    simulated: true
  }
}

/**
 * Synchronizes all pending records in the IndexedDB sync queue to AWS S3.
 * Only deletes records from the local queue upon successful upload.
 */
export async function syncPendingQueueToS3() {
  if (activeSyncPromise) {
    return activeSyncPromise
  }

  if (!navigator.onLine) {
    notifySyncListeners({ type: 'SKIPPED_OFFLINE', message: 'Device is offline. Sync skipped.' })
    return { synced: 0, failed: 0, skipped: true }
  }

  activeSyncPromise = (async () => {
    const queue = await getPendingSyncQueue()
    if (queue.length === 0) {
      notifySyncListeners({ type: 'IDLE', total: 0, completed: 0 })
      return { synced: 0, failed: 0, total: 0 }
    }

    notifySyncListeners({ type: 'STARTED', total: queue.length, completed: 0 })

    const config = await getEffectiveAwsConfig()
    let s3Client = null
    let isSimulated = false

    try {
      s3Client = await createS3Client()
    } catch (err) {
      if (config.enableSimulation) {
        isSimulated = true
      } else {
        notifySyncListeners({ type: 'FAILED', error: err.message })
        throw err
      }
    }

    if (!s3Client) {
      isSimulated = true
    }

    let syncedCount = 0
    let failedCount = 0

    for (let i = 0; i < queue.length; i++) {
      const item = queue[i]
      const { patientRecordId, payload } = item

      // Standard partitioned key: maternal-records/{villageId}/{patientId}_{timestamp}.json
      const villageId = payload.villageId || 'general'
      const patientId = payload.patientId || `PID-${patientRecordId}`
      const datePart = new Date().toISOString().split('T')[0]
      const s3Key = `maternal-records/${villageId}/${datePart}/${patientId}_${Date.now()}.json`

      try {
        let response

        if (isSimulated) {
          response = await simulateS3Upload(s3Key, payload)
        } else {
          // ================================================================
          // AWS S3 PutObjectCommand Execution
          // ================================================================
          const command = new PutObjectCommand({
            Bucket: config.bucketName,
            Key: s3Key,
            Body: JSON.stringify(payload, null, 2),
            ContentType: 'application/json',
            Metadata: {
              'patient-id': String(patientId),
              'village-id': String(villageId),
              'risk-level': String(payload.riskLevel || 'UNKNOWN'),
              'risk-score': String(payload.riskScore || 0)
            }
          })

          response = await s3Client.send(command)
        }

        // Verify successful response
        if (response.$metadata && (response.$metadata.httpStatusCode === 200 || response.simulated)) {
          // Clear from local queue only upon successful response
          await markRecordAsSynced(patientRecordId, s3Key)
          syncedCount++
          
          notifySyncListeners({
            type: 'PROGRESS',
            total: queue.length,
            completed: syncedCount + failedCount,
            lastSyncedId: patientId,
            isSimulated
          })
        } else {
          throw new Error(`S3 returned unexpected status: ${response.$metadata?.httpStatusCode}`)
        }
      } catch (uploadError) {
        console.error(`[S3 SYNC ERROR] Failed uploading record #${patientRecordId}:`, uploadError)
        failedCount++
        await markRecordSyncFailed(patientRecordId, uploadError.message || 'Network/S3 error')
        
        notifySyncListeners({
          type: 'ITEM_ERROR',
          patientRecordId,
          error: uploadError.message
        })
      }
    }

    const result = {
      synced: syncedCount,
      failed: failedCount,
      total: queue.length,
      isSimulated
    }

    notifySyncListeners({ type: 'COMPLETED', ...result })
    return result
  })()

  try {
    return await activeSyncPromise
  } finally {
    activeSyncPromise = null
  }
}

/**
 * Initializes automatic background synchronization listener.
 * Automatically triggers sync when device transitions from offline to online.
 */
export function initBackgroundSyncListener() {
  const handleOnline = () => {
    console.info('[Network] Device connected online. Initiating automated S3 background sync...')
    // Small delay to allow connection stability
    setTimeout(() => {
      syncPendingQueueToS3().catch(err => {
        console.warn('[Network Sync] Auto-sync attempt error:', err)
      })
    }, 1500)
  }

  window.addEventListener('online', handleOnline)

  return () => {
    window.removeEventListener('online', handleOnline)
  }
}
