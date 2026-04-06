# ☁ CloudDrive

A secure, full-stack cloud file storage application - similar to Google Drive - built as an internship project.

**Author:** Vaishnavi Saudagar

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, React Router v6, Axios |
| Backend | Node.js, Express.js |
| Authentication | Google OAuth 2.0 |
| Storage | Google Cloud Storage (GCS) |
| Security | Helmet, express-rate-limit, HPP |
| Logging | Winston |

---

## ✨ Features

- 🔐 **Google OAuth 2.0 login** - secure sign-in with your Google account
- 📤 **Drag & drop file upload** - with real-time progress bar
- 📥 **Signed download URLs** - secure, time-limited download links
- 🕓 **File versioning** - every upload creates a new version; view history and restore any version
- 🔗 **Shareable links** - generate expiring public links for any file
- 🗑 **File management** - delete files (all versions) with one click
- 🔍 **File search** - filter your files instantly
- 🔔 **Toast notifications** - real-time feedback on every action

---

## 🔒 Security

| Feature | Implementation |
|---|---|
| Secure HTTP headers | Helmet.js (15+ headers) |
| Rate limiting | express-rate-limit (per route) |
| HTTP Parameter Pollution | hpp middleware |
| File type validation | MIME type whitelist |
| Filename sanitization | Strips path traversal & dangerous chars |
| IDOR protection | gcsPath ownership verified on every request |
| Session security | httpOnly + sameSite cookies, 32-char secret enforced |
| Input validation | UUID format checks on all params |
| Error safety | Stack traces never exposed to client in production |

### Rate Limits
| Route | Limit |
|---|---|
| All `/api/*` | 100 requests / 15 min |
| `/auth/*` | 10 requests / 15 min |
| File uploads | 20 uploads / hour |
| Share link creation | 30 links / hour |
| Public downloads | 50 downloads / hour |

---

## 📁 Project Structure

```
clouddrive/
├── backend/
│   ├── .env.example
│   ├── package.json
│   ├── logs/                          ← auto-generated at runtime
│   └── src/
│       ├── index.js                   ← Express entry + all security wired in
│       ├── config/
│       │   ├── gcs.js                 ← Google Cloud Storage client
│       │   ├── oauth.js               ← Google OAuth2 setup
│       │   └── logger.js              ← Winston logger
│       ├── middleware/
│       │   ├── auth.js                ← session guard (requireAuth)
│       │   └── security.js            ← rate limiters, helmet, MIME whitelist
│       ├── routes/
│       │   ├── auth.js                ← /auth/login, /callback, /me, /logout
│       │   ├── files.js               ← /api/files (upload, download, versions)
│       │   └── share.js               ← /api/share (create, list, revoke)
│       └── services/
│           ├── fileService.js         ← all GCS operations + versioning
│           └── shareService.js        ← share token management
│
└── frontend/
    ├── index.html                     ← Vite entry HTML (root level)
    ├── vite.config.js                 ← Vite config + proxy to backend
    ├── package.json
    └── src/
        ├── main.jsx                   ← React entry point
        ├── App.jsx                    ← Router + auth guards
        ├── index.css                  ← Global design system
        ├── context/
        │   └── AuthContext.jsx        ← Global auth state
        ├── hooks/
        │   └── useToast.js            ← Toast notification system
        ├── utils/
        │   └── api.js                 ← All Axios API calls
        ├── pages/
        │   ├── LoginPage.jsx/css      ← Google OAuth login screen
        │   ├── Dashboard.jsx/css      ← Main file manager UI
        │   └── SharePage.jsx/css      ← Public file download page
        └── components/
            ├── Dropzone.jsx/css       ← Drag & drop upload
            ├── FileCard.jsx/css       ← File row with actions
            ├── VersionsModal.jsx      ← Version history + restore
            └── ShareModal.jsx         ← Generate & copy share links
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js v18+
- A Google Cloud Platform account (free tier is sufficient)

---

### Step 1 — GCP Project Setup

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create a new project and note your **Project ID**
3. Enable these APIs:
   - Cloud Storage API
   - Google OAuth2 API

---

### Step 2 — Create a GCS Bucket

1. Go to **Cloud Storage → Buckets → Create**
2. Give it a globally unique name e.g. `clouddrive-yourname-2025`
3. Region: `us-central1`
4. Leave all other settings as default → **Create**

---

### Step 3 — Service Account Key

1. Go to **IAM & Admin → Service Accounts → Create Service Account**
2. Name: `clouddrive-sa` → **Create**
3. Grant role: **Storage Object Admin** → **Done**
4. Click the service account → **Keys → Add Key → JSON**
5. Download and rename to `service-account-key.json`
6. Place it inside your `backend/` folder

---

### Step 4 — Google OAuth 2.0 Credentials

1. Go to **APIs & Services → Credentials → Create Credentials → OAuth 2.0 Client ID**
2. Configure the OAuth consent screen first if prompted (External, fill in app name + email)
3. Application type: **Web application**
4. Authorized redirect URIs → add: `http://localhost:5000/auth/callback`
5. Copy the **Client ID** and **Client Secret**

---

### Step 5 — Environment Variables

```bash
cd backend
cp .env.example .env
```

Fill in your `.env`:

```env
PORT=5000
NODE_ENV=development

# Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
SESSION_SECRET=your-32-char-minimum-secret-here

GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=http://localhost:5000/auth/callback

GCP_PROJECT_ID=your-gcp-project-id
GCP_KEY_FILE=./service-account-key.json
GCS_BUCKET_NAME=clouddrive-yourname-2025

CLIENT_URL=http://localhost:3000
LOG_LEVEL=info
```

Generate a secure SESSION_SECRET:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

### Step 6 — Install Dependencies

**Backend:**
```bash
cd backend
npm install
```

**Frontend:**
```bash
cd frontend
npm install
```

---

### Step 7 — Run the Project

Open **two terminals**:

**Terminal 1 — Backend:**
```bash
cd backend
npm run dev
```
Expected output:
```
🚀 CloudDrive backend running on http://localhost:5000
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm run dev
```
Expected output:
```
  VITE v5.x  ready in xxx ms
  ➜  Local:   http://localhost:3000/
```

Open **http://localhost:3000** in your browser and log in with Google!

---

## 🔌 API Reference

### Auth Endpoints
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/auth/login` | No | Redirect to Google OAuth |
| GET | `/auth/callback` | No | OAuth2 callback |
| GET | `/auth/me` | No | Get current session user |
| POST | `/auth/logout` | Yes | Destroy session |

### File Endpoints
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/files` | Yes | List all files (latest versions) |
| POST | `/api/files/upload` | Yes | Upload a new file |
| POST | `/api/files/:id/version` | Yes | Upload new version of existing file |
| GET | `/api/files/:id/versions` | Yes | Get full version history |
| GET | `/api/files/:id/download` | Yes | Get signed download URL |
| POST | `/api/files/:id/restore` | Yes | Restore an older version |
| DELETE | `/api/files/:id` | Yes | Delete file and all versions |

### Share Endpoints
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/share/create` | Yes | Create a share token |
| GET | `/api/share/mine` | Yes | List your share links |
| DELETE | `/api/share/:token` | Yes | Revoke a share link |
| GET | `/api/share/info/:token` | No | Public: get file metadata |
| GET | `/api/share/download/:token` | No | Public: get download URL |

---

## 🗄 GCS Storage Layout

```
gs://your-bucket/
├── users/{userId}/files/{fileId}/v1/filename.pdf
├── users/{userId}/files/{fileId}/v2/filename.pdf   ← new version
├── users/{userId}/files/{fileId}/v3/filename.pdf   ← restored version
└── share-index.json                                ← share token registry
```

---

## 🐛 Common Errors & Fixes

| Error | Fix |
|---|---|
| `SESSION_SECRET must be at least 32 chars` | Generate one with the crypto command above |
| `CORS blocked for origin` | Ensure `CLIENT_URL=http://localhost:3000` in `.env` |
| `Could not load default credentials` | Check `GCP_KEY_FILE` path points to your JSON key |
| `Access denied on GCS bucket` | Ensure service account has Storage Object Admin role |
| `redirect_uri_mismatch` | Add `http://localhost:5000/auth/callback` in GCP OAuth credentials |
| `JSX syntax extension not enabled` | Ensure you're using the updated `vite.config.js` |
| Port already in use | Change `PORT=5001` in `.env` |

---

## ☁ Deploying to GCP Cloud Run (Production)

**Backend:**
```bash
cd backend
gcloud run deploy clouddrive-backend \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars="NODE_ENV=production,SESSION_SECRET=xxx,..."
```

**Frontend:**
```bash
cd frontend
npm run build
# deploy the dist/ folder to Firebase Hosting or GCS static site
```

Don't forget to:
- Add your Cloud Run URL to the OAuth 2.0 authorized redirect URIs in GCP
- Update `CLIENT_URL` in backend env vars to your frontend's production URL
- Use **Workload Identity** instead of a service account key file in production

---

## 📋 Checklist

- [x] Google OAuth 2.0 login/logout
- [x] Drag & drop file upload with progress bar
- [x] Signed URL file download
- [x] File versioning — upload, view history, restore
- [x] Shareable links with configurable expiry
- [x] Share link revocation
- [x] File deletion (all versions)
- [x] File search
- [x] Toast notifications
- [x] Rate limiting on all endpoints
- [x] Secure HTTP headers (Helmet)
- [x] MIME type validation
- [x] IDOR protection
- [x] Winston request/error logging
