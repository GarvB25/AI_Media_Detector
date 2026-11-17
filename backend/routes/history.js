// ═══════════════════════════════════════
// History Route — User Detection Records
// ═══════════════════════════════════════

import express from "express";
import { admin } from "../middleware/auth.js";

const router = express.Router();
const db = admin.firestore();

// ── GET /api/history ──────────────────────────────────────────
// Returns paginated detection history for the authenticated user
router.get("/", async (req, res) => {
  try {
    const userId = req.user.uid;
    const { filter = "all", page = 1, limit = 20 } = req.query;

    let q = db.collection("detections")
      .where("userId", "==", userId)
      .orderBy("createdAt", "desc")
      .limit(parseInt(limit));

    if (filter === "ai") q = q.where("verdict", "==", "ai");
    if (filter === "real") q = q.where("verdict", "==", "real");

    const snap = await q.get();
    const records = snap.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      // Convert Firestore timestamp to ISO string
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || null
    }));

    res.json({ success: true, data: records, total: records.length });
  } catch (err) {
    console.error("History fetch error:", err);
    res.status(500).json({ error: "Failed to fetch history" });
  }
});

// ── DELETE /api/history/:id ───────────────────────────────────
router.delete("/:id", async (req, res) => {
  try {
    const userId = req.user.uid;
    const docRef = db.collection("detections").doc(req.params.id);
    const doc = await docRef.get();

    if (!doc.exists) return res.status(404).json({ error: "Record not found" });
    if (doc.data().userId !== userId) return res.status(403).json({ error: "Forbidden" });

    await docRef.delete();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Delete failed" });
  }
});

export default router;
