import express from "express";
import multer from "multer";
import { detectAIImage } from "../aiDetector.js";

const router = express.Router();

// multer setup
const upload = multer({ storage: multer.memoryStorage() });

// ✅ SAB KUCH IS FUNCTION KE ANDAR HONA CHAHIYE
router.post("/detect", upload.single("image"), async (req, res) => {
  try {
    console.log("🚀 Request received");

    // file check
    if (!req.file) {
      return res.status(400).json({ error: "Image file is required" });
    }

    console.log("📦 File size:", req.file.size);

    console.log("🧠 Calling AI...");
    const aiResult = await detectAIImage(req.file.buffer);
    console.log("✅ AI done");

    res.json({
      verdict: aiResult.verdict,
      result: aiResult.verdict,
      confidence: aiResult.confidence,
      signals: {
        "AI Score": aiResult.confidence / 100
      }
    });

  } catch (error) {
    console.error("❌ Detect Error:", error.message);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;