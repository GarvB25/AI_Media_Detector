// ═══════════════════════════════════════
// Auth Middleware — Firebase Token Verify
// ═══════════════════════════════════════

import admin from "firebase-admin";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Firebase Admin (only once)
if (!admin.apps.length) {
  // Option 1: Use service account JSON file
  // const serviceAccount = JSON.parse(readFileSync(path.join(__dirname, "../firebase-service-account.json")));
  // admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });

  // Option 2: Use environment variables (recommended for production)
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      // Replace \n in env var with actual newlines
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n")
    })
  });
}

/**
 * Middleware to verify Firebase ID token from Authorization header
 * Attaches decoded user to req.user
 */
export async function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized: No token provided" });
  }

  const token = authHeader.split("Bearer ")[1];

  try {
    const decoded = await admin.auth().verifyIdToken(token);
    req.user = decoded;
    next();
  } catch (err) {
    console.error("Token verification failed:", err.message);
    return res.status(401).json({ error: "Unauthorized: Invalid or expired token" });
  }
}

export { admin };
