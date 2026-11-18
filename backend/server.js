// ═══════════════════════════════════════
// AI Media Detector — Express Server
// ═══════════════════════════════════════

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import path from "path";

import detectRouter from "./routes/detect.js";
import historyRouter from "./routes/history.js";
import { verifyToken } from "./middleware/auth.js";

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// ── Middleware ─────────────────────────────────────────────────
app.use(cors({
  origin: [
    "http://127.0.0.1:3000",
    "http://localhost:3000",
    "http://127.0.0.1:5500",
    "http://localhost:5500",
    "https://aimediadetector-frontend.vercel.app"
  ],
  credentials: true
}));

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files temporarily (for preview)
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ── Health Check ───────────────────────────────────────────────
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ── API Routes ─────────────────────────────────────────────────
app.use("/api", detectRouter);
app.use("/api/history", verifyToken, historyRouter);
app.get("/", (req, res) => {
  res.send("🚀 AI Media Detector API is running...");
});

// ── Error Handler ──────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error("Server error:", err);

  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(413).json({ error: "File too large. Maximum size is 50MB." });
  }

  res.status(err.status || 500).json({
    error: err.message || "Internal server error"
  });
});

// ── 404 Handler ───────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// ── Start Server ──────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🚀 AI Media Detector API running on http://localhost:${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/health\n`);
});

export default app;
