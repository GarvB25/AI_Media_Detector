# 🔍 AI Media Detector

A professional, full-stack web application that uses artificial intelligence to detect whether images and media are AI-generated or authentic. Built as an **MCA Semester 1 Minor Project (JIMS)**.

![Tech Stack](https://img.shields.io/badge/Frontend-HTML5%20%2F%20CSS3%20%2F%20ES6%20JS-blue)
![Backend](https://img.shields.io/badge/Backend-Node.js%20%2B%20Express-green)
![Database](https://img.shields.io/badge/Database-Firebase%20Firestore-orange)
![Auth](https://img.shields.io/badge/Auth-Firebase%20Auth-yellow)
![AI Engine](https://img.shields.io/badge/AI%20Engine-Sightengine%20GenAI-purple)

---

## 📁 Project Structure

```
ai-media-detector/
├── frontend/
│   ├── index.html              # Authentication page (Login / Signup)
│   ├── dashboard.html          # Main application dashboard
│   ├── css/
│   │   ├── auth.css            # Styles for authentication views
│   │   └── dashboard.css       # Glassmorphism dashboard styles
│   └── js/
│       ├── firebase-config.js  # Firebase client credentials & API base URL
│       ├── auth.js             # Authentication logic & session handling
│       └── dashboard.js        # Detection upload, stats, and Firestore history
│
├── backend/
│   ├── server.js               # Express API entry point & CORS configuration
│   ├── aiDetector.js           # Sightengine AI image analysis integration
│   ├── package.json            # Node.js dependencies & scripts
│   ├── .env.example            # Environment variables template
│   ├── middleware/
│   │   └── auth.js             # Firebase Admin ID token verification
│   └── routes/
│       ├── detect.js           # POST /api/detect (Image analysis)
│       └── history.js          # GET & DELETE /api/history (Detection history)
│
├── firestore.rules             # Production security rules for Firestore
└── README.md                   # Project documentation
```

---

## 🔄 System Architecture & Data Flow

```mermaid
flowchart TD
    A["User (Browser)"] -->|"Upload Image"| B["Frontend Dashboard (Vanilla JS)"]
    B -->|"POST /api/detect (multipart/form-data: image)"| C["Express Backend (Port 3001)"]
    C -->|"Buffer stream"| D["Sightengine GenAI API"]
    D -->|"AI Probability & Score"| C
    C -->|"JSON Verdict & Confidence"| B
    B -->|"Store Record (Verdict, Score, Timestamp)"| E[("Firebase Firestore")]
    B -->|"Fetch Stats & Logs"| E
```

---

## 🚀 Quick Start Guide

### Prerequisites

- **Node.js** v18+ — [Download Node.js](https://nodejs.org)
- **Python 3.x** (or VS Code Live Server) to serve frontend files
- **Firebase Account** — [Firebase Console](https://console.firebase.google.com)
- **Sightengine Account** — [Sightengine Console](https://sightengine.com) (Free 100 checks/month)

---

### Step 1: Firebase Configuration

1. Open the [Firebase Console](https://console.firebase.google.com) and create a project.
2. **Enable Authentication:**
   - Go to **Build** → **Authentication** → **Sign-in method**.
   - Enable **Email/Password** and **Google**.
3. **Enable Firestore Database:**
   - Go to **Build** → **Firestore Database** → **Create database** (start in Test mode).
4. **Register Web App:**
   - Go to **Project Settings** → **General** → **Your Apps** → click the `</>` Web icon.
   - Copy the `firebaseConfig` object.
5. **Generate Admin SDK Service Account:**
   - Go to **Project Settings** → **Service Accounts**.
   - Click **Generate new private key** and open the downloaded JSON.

---

### Step 2: Configure the Frontend

Open `frontend/js/firebase-config.js` and paste your Firebase project credentials:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.firebasestorage.app",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Backend API URL (Default local Express port)
export const API_BASE = "http://localhost:3001/api";
```

---

### Step 3: Configure the Backend

Navigate to the `backend/` directory:

```bash
cd backend
```

Create your `.env` configuration file from the template:

- **Windows (Command Prompt):**
  ```cmd
  copy .env.example .env
  ```
- **Windows (PowerShell):**
  ```powershell
  Copy-Item .env.example .env
  ```
- **macOS / Linux:**
  ```bash
  cp .env.example .env
  ```

Open `backend/.env` and fill in your values:

```env
PORT=3001
NODE_ENV=development

# Firebase Admin SDK Credentials
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project-id.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_KEY_HERE\n-----END PRIVATE KEY-----\n"

# Sightengine Detection API (https://sightengine.com)
SIGHTENGINE_API_USER=your_api_user
SIGHTENGINE_API_SECRET=your_api_secret
```

---

### Step 4: Install & Run the Backend

Inside the `backend/` folder:

```bash
npm install
npm start
```

*For live reload during development:*
```bash
npm run dev
```

The server will start at:
- **API Base:** `http://localhost:3001`
- **Health Check:** `http://localhost:3001/health`

---

### Step 5: Run the Frontend

Run a local static server to serve the `frontend/` folder on port `5500` or `3000` (allowed by CORS):

#### Option A: Python (Recommended)
From the project root:
```bash
python -m http.server 5500 -d frontend
```
*(On macOS/Linux, use `python3 -m http.server 5500 -d frontend`)*

#### Option B: VS Code Live Server
- Install the **Live Server** extension.
- Right-click `frontend/index.html` → **Open with Live Server**.

#### Option C: Node `serve`
```bash
npx serve frontend -p 5500
```

Open your browser and visit:
👉 **`http://localhost:5500`**

---

## 🛠 API Reference

### 1. Health Check
Check whether the API backend is running.

- **Method:** `GET`
- **Endpoint:** `/health`
- **Response:**
  ```json
  {
    "status": "ok",
    "timestamp": "2026-11-16T06:00:00.000Z"
  }
  ```

---

### 2. Detect Media
Upload and analyze an image file using the Sightengine GenAI engine.

- **Method:** `POST`
- **Endpoint:** `/api/detect`
- **Headers:** `Content-Type: multipart/form-data`
- **Body (`multipart/form-data`):**
  - `image` *(File, required)* — The image file to analyze (JPG, PNG, WebP)
  - `userId` *(Text, optional)* — Current user's Firebase UID

- **Sample Request (cURL):**
  ```bash
  curl -X POST http://localhost:3001/api/detect \
    -F "image=@/path/to/test.jpg" \
    -F "userId=USER_ID"
  ```

- **Response:**
  ```json
  {
    "result": "ai",
    "confidence": 94,
    "signals": {
      "AI Score": 0.94
    }
  }
  ```

---

### 3. Get Detection History
Fetch stored detection records for the authenticated user.

- **Method:** `GET`
- **Endpoint:** `/api/history`
- **Headers:** `Authorization: Bearer <firebase-id-token>`
- **Query Parameters:**
  - `filter` *(optional)* — Filter by verdict: `all` | `ai` | `real` (default: `all`)
  - `limit` *(optional)* — Maximum records to return (default: `20`)

- **Response:**
  ```json
  {
    "success": true,
    "total": 5,
    "data": [
      {
        "id": "doc123456",
        "userId": "user_uid",
        "filename": "sample.png",
        "mediaType": "image",
        "verdict": "ai",
        "confidence": 94,
        "createdAt": "2026-11-16T05:30:00.000Z"
      }
    ]
  }
  ```

---

### 4. Delete Detection Record
Delete a specific detection record from Firestore.

- **Method:** `DELETE`
- **Endpoint:** `/api/history/:id`
- **Headers:** `Authorization: Bearer <firebase-id-token>`

- **Response:**
  ```json
  {
    "success": true
  }
  ```

---

## 🔥 Firestore Security Rules

Set the following rules in **Firebase Console** → **Firestore Database** → **Rules** to ensure user data isolation:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /detections/{docId} {
      allow read, delete: if request.auth != null && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
      allow update: if false;
    }
  }
}
```

---

## 🎯 Key Features

### 🔐 Authentication
- Email & password signup and login with Firebase Auth
- One-click Google OAuth sign-in
- Real-time password strength validation
- Persistent sessions and protected routes

### 📊 Dashboard & Detection
- Drag-and-drop & file picker media upload
- Real-time image preview before scanning
- Animated multistep progress indicator
- Clear verdict banner (AI-generated vs authentic) with confidence percentage
- Dynamic counters: total scans, AI detected, real media, average confidence score

### 📜 History & Management
- Searchable and filterable history logs (All / AI Only / Real Only)
- User-scoped storage in Firestore with timestamps
- One-click record deletion

### 🎨 Design & Experience
- Modern dark-mode glassmorphism aesthetic
- Smooth CSS transitions and responsive layout across desktop and mobile
- Interactive toast notifications

---

## 🔒 Security Measures

- **In-Memory Buffering:** Files are uploaded to memory via Multer (`multer.memoryStorage()`) and never permanently saved to local server disk.
- **Data Isolation:** Firebase Firestore rules strictly enforce that users can only read, create, and delete their own detection records.
- **Protected Endpoints:** Token verification middleware (`verifyToken`) validates Firebase ID tokens via the Firebase Admin SDK.
- **Strict CORS Policy:** Restricted to approved local development and production origins.

---

## 🎓 Academic Project Information

- **Project Title:** AI Media Detector
- **Course:** Master of Computer Applications (MCA) — Semester 1
- **Project Type:** Minor Project
- **Institution:** Jagan Institute of Management Studies (JIMS)
- **Core Technologies:** Node.js, Express, Firebase (Auth & Firestore), Sightengine AI, Vanilla JavaScript (ES6+), HTML5, CSS3

---

## 📝 License

Distributed under the MIT License. Feel free to modify and use for learning purposes.
#   A I _ M e d i a _ D e t e c t o r  
 