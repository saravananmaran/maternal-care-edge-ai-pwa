# MaternalCare Edge AI - Offline-First Risk Scoring PWA 🩺⚡

> An **offline-first Progressive Web App (PWA)** engineered for rural community health workers (ASHAs, ANMs, CHWs) to perform in-the-field maternal health risk scoring and clinical triage. The app functions **100% without internet access**, runs **TensorFlow.js edge AI directly in the browser**, persists all vitals to **IndexedDB**, and performs **background cloud synchronization to Amazon S3** when network connectivity is restored.

---

## 🏗️ Architecture Overview

```
                      +-------------------------------------------------+
                      |           RURAL FIELD WORKER DEVICE             |
                      |                                                 |
[Patient Vitals] ---> | [React + Tailwind UI]  <-- Auto-Save Draft      |
                      |          |                                      |
                      |          v                                      |
                      | [TensorFlow.js Engine] (Runs 100% On-Device)    |
                      |   - 8 Normalized Feature Inputs                 |
                      |   - Sequential Neural Network Model             |
                      |   - WHO Danger Signs Clinical Safety Guardrail  |
                      |          |                                      |
                      |          v                                      |
                      | [Risk Score: 0-100% & Triage Alert]             |
                      |          |                                      |
                      |          v                                      |
                      | [IndexedDB - Dexie.js]                          |
                      |   ├── patients (Offline Registry)               |
                      |   └── syncQueue (Pending Upload FIFO Queue)     |
                      +-------------------------------------------------+
                                         |
                                         | (Network Monitor: navigator.onLine)
                                         | Offline: Remains queued safely
                                         | Online: Background Sync Triggered
                                         v
                      +-------------------------------------------------+
                      |               AMAZON WEB SERVICES               |
                      |  AWS S3 Bucket: PutObjectCommand (JSON)        |
                      |  Key: maternal-records/{village}/{date}/{id}.json|
                      +-------------------------------------------------+
```

---

## 🚀 Key Features

1. **True Offline-First Progressive Web App (PWA):**
   - Configured with `vite-plugin-pwa` and Workbox.
   - Precaches application shell, assets, icons, and TensorFlow.js model files.
   - Real-time network detection hook (`useNetworkStatus`) with visible status indicators:
     - 🟢 **Online Mode** (Cloud auto-sync active)
     - 🔴 **Offline Mode** (All scoring on-device; records queued in IndexedDB)
     - 🟡 **Syncing** (Uploading pending records to AWS S3)

2. **Mobile-First High-Contrast Healthcare Form:**
   - Designed for outdoor sunlight and one-handed mobile touch operation.
   - Collects key vitals: Age, Gestational Weeks, Gravida, Parity, Systolic BP, Diastolic BP, Heart Rate, Blood Glucose, Body Temp.
   - WHO Maternal Danger Signs checklist (Severe headache, blurred vision, convulsions, vaginal bleeding, epigastric pain, reduced fetal movement).
   - Real-time draft auto-save to IndexedDB prevents data loss if battery dies or app closes.
   - Quick clinical preset loader (e.g., Pre-eclampsia crisis, Gestational Diabetes, Normal Checkup).

3. **In-Browser Edge AI Risk Engine (TensorFlow.js):**
   - Sequential Neural Network running via WebGL/WASM/CPU directly in the browser.
   - 8-dimensional normalized input vector.
   - Outputs a continuous **Risk Score Percentage (0% to 100%)** categorized into:
     - 🟢 **Low Risk (< 45%)**: Routine WHO 8-contact antenatal care.
     - 🟡 **Moderate Risk (45% - 79%)**: Enhanced surveillance & 48h re-evaluation.
     - 🔴 **High Risk (>= 80%) / Critical Emergency**: Immediate hospital referral protocol.
   - Hybrid clinical safety layer ensures life-threatening emergencies (e.g. active convulsions or BP >= 160/110) immediately trigger high-priority alerts.

4. **Resilient Background Synchronization to AWS S3:**
   - Modular AWS SDK (`@aws-sdk/client-s3`).
   - Every assessed patient is automatically queued in `syncQueue` in IndexedDB.
   - Automatic sync executes as soon as the device detects an internet connection (`online` event), or via the manual "Sync Now" button.
   - Records are partitioned cleanly: `maternal-records/{villageId}/{YYYY-MM-DD}/{patientId}_{timestamp}.json`.
   - **Records are only removed from the local queue upon verified HTTP 200 / S3 success response**.

---

## 📁 Project File Structure

```
├── public/
│   ├── favicon.svg
│   ├── pwa-192x192.svg           # High-resolution PWA icon
│   ├── pwa-512x512.svg           # Splash & maskable PWA icon
│   └── model/                    # Custom TF.js Model Drop-in Directory
│       └── README.md             # Guide for dropping model.json & shards
├── src/
│   ├── components/
│   │   ├── Header.jsx            # App bar, network pill, sync indicator, navigation
│   │   ├── NetworkBanner.jsx     # High-visibility offline/sync status alert bar
│   │   ├── PatientEntryForm.jsx  # High-contrast mobile vital entry & danger checklist
│   │   ├── RiskScoreDisplay.jsx  # AI risk gauge, clinical recommendations, save action
│   │   ├── PatientRegistry.jsx   # Local IndexedDB registry, search, filters & JSON export
│   │   ├── SyncManagerView.jsx   # AWS S3 sync queue hub, audit table, retry tracker
│   │   ├── ModelLabView.jsx      # TF.js diagnostics, benchmark tool & architecture
│   │   └── SettingsModal.jsx     # In-app AWS IAM & village settings
│   ├── hooks/
│   │   ├── useNetworkStatus.js   # Real-time network listener (useSyncExternalStore)
│   │   └── useSyncManager.js     # Dexie live query sync manager & progress tracker
│   ├── services/
│   │   ├── db.js                 # Dexie.js IndexedDB schema (patients, syncQueue, drafts)
│   │   ├── aiRiskModel.js        # TensorFlow.js model, normalization, WHO clinical rules
│   │   ├── s3Sync.js             # AWS SDK S3Client, PutObjectCommand & queue uploader
│   │   └── mockData.js           # Clinical demo presets (Pre-eclampsia, Hemorrhage, etc.)
│   ├── App.jsx                   # Master state orchestrator & mobile navigation
│   ├── index.css                 # Tailwind v4 styles & accessible focus rings
│   └── main.jsx                  # React mount & Workbox service worker registration
├── .env.example                  # AWS credentials template
├── .env                          # Local environment variables
├── index.html                    # PWA metadata, standalone iOS tags, viewport settings
├── vite.config.js                # Vite + React + Tailwind v4 + VitePWA Workbox config
└── package.json
```

---

## ⚙️ Configuration & Customization

### 1. Where to Insert AWS S3 Credentials & IAM Setup

You have **two options** to configure your AWS S3 bucket:

#### Option A: In `.env` or Environment Variables
Edit the `.env` file in the project root:
```env
VITE_AWS_REGION=us-east-1
VITE_AWS_BUCKET_NAME=your-maternal-health-bucket
VITE_AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
VITE_AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
VITE_AWS_SESSION_TOKEN=   # Optional (for temporary STS tokens)
VITE_AWS_ENABLE_SIMULATION=false
```

#### Option B: In-App Settings Modal
You can configure AWS credentials directly inside the running PWA without rebuilding:
1. Tap the **Settings** icon (top right).
2. Enter your **Bucket Name**, **Region**, **Access Key ID**, and **Secret Access Key**.
3. Toggle **Simulation Mode** off.
4. Tap **Save Configuration**. Credentials are saved securely to IndexedDB.

#### AWS S3 Bucket CORS Configuration
Your S3 bucket must permit web browser `PUT` requests. In AWS S3 Console -> Bucket -> Permissions -> Cross-origin resource sharing (CORS), add:
```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["PUT", "POST", "GET"],
    "AllowedOrigins": ["*"],
    "ExposeHeaders": ["ETag"]
  }
]
```

#### Minimum Required AWS IAM Policy:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": "s3:PutObject",
      "Resource": "arn:aws:s3:::your-maternal-health-bucket/maternal-records/*"
    }
  ]
}
```

---

### 2. Where to Insert Custom TensorFlow.js Model Files

The app is built to automatically use your custom pre-trained Keras/TensorFlow model if available:

1. Convert your trained model to TF.js format:
   ```bash
   pip install tensorflowjs
   tensorflowjs_converter --input_format=keras path/to/maternal_model.h5 ./public/model/
   ```
2. Place the resulting files into `public/model/`:
   ```
   public/model/
   ├── model.json
   └── group1-shard1of1.bin
   ```
3. The app automatically checks for `/model/model.json`. If found, it loads it via `tf.loadLayersModel('/model/model.json')` and caches the weights in the Workbox Service Worker for offline use.
4. If no custom model is placed there, the app uses its built-in calibrated Sequential Neural Network model (`src/services/aiRiskModel.js`).

---

## 🛠️ Local Development & Running

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Dev Server
```bash
npm run dev
```

### 3. Build Production PWA
```bash
npm run build
```

### 4. Preview Built PWA
```bash
npm run preview
```

### 5. Testing Offline Capabilities in Chrome / Edge DevTools
1. Open DevTools (`F12`) -> **Network** tab.
2. Select **Offline** from the throttling dropdown.
3. Submit a new patient assessment -> Notice risk score calculates in milliseconds with **Zero Network Used**.
4. Check **Patient Registry** -> Notice record saved in IndexedDB with `Pending S3 Sync` badge.
5. In Network tab, switch back to **Online** -> Watch background auto-sync trigger and push the record to AWS S3!
