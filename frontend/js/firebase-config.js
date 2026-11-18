// ═══════════════════════════════════════
// Firebase Configuration
// Replace values below with your Firebase project config
// from: Firebase Console > Project Settings > Your Apps
// ═══════════════════════════════════════

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// ⚠️ Replace these with your Firebase project credentials
const firebaseConfig = {
 apiKey: "AIzaSyD9n3f_Jwh6x8L18q2jXQ7QB-gDPIci8jM",
  authDomain: "aidetector14.firebaseapp.com",
  projectId: "aidetector14",
  storageBucket: "aidetector14.firebasestorage.app",
  messagingSenderId: "217283550721",
  appId: "1:217283550721:web:4e83b637dc93beb1c26a00",
  measurementId: "G-SXP869L5J6"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export auth and firestore instances
export const auth = getAuth(app);
export const db = getFirestore(app);

// Backend API base URL
// Local development: http://localhost:3001/api
// Production (Vercel): https://ai-media-detector-nu.vercel.app/api
export const API_BASE = "https://ai-media-detector-nu.vercel.app/api";

export default app;
