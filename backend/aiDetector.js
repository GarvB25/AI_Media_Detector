import axios from "axios";
import FormData from "form-data";
import dotenv from "dotenv";

dotenv.config();

export async function detectAIImage(fileBuffer) {
  try {
    const formData = new FormData();

    formData.append("models", "genai");
    formData.append("api_user", process.env.SIGHTENGINE_API_USER);
    formData.append("api_secret", process.env.SIGHTENGINE_API_SECRET);

    // ✅ IMPORTANT: file buffer send kar
    formData.append("media", fileBuffer, {
      filename: "image.jpg"
    });

    const response = await axios.post(
      "https://api.sightengine.com/1.0/check.json",
      formData,
      {
        headers: formData.getHeaders()
      }
    );

    const result = response.data;

    console.log("🔍 Sightengine response:", result);

    const aiScore = result.type?.ai_generated || 0;

    return {
      verdict: aiScore > 0.5 ? "ai" : "real",
      confidence: Math.round(aiScore * 100)
    };

  } catch (error) {
    console.error("❌ Sightengine Error:", error.response?.data || error.message);

    return {
      verdict: "unknown",
      confidence: 0
    };
  }
}