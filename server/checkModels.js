const { GoogleGenerativeAI } = require("@google/generative-ai");
const dotenv = require("dotenv");
dotenv.config();

// Script de diagnóstico
async function check() {
  console.log("🔍 Consultando modelos disponibles...");
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    console.error("❌ ERROR: No se encontró la API KEY en el archivo .env");
    return;
  }

  // Hacemos una petición directa (fetch) porque la librería a veces oculta el listado
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`,
    );
    const data = await response.json();

    if (data.error) {
      console.error("❌ Error de Google:", data.error.message);
    } else {
      console.log("✅ Modelos disponibles para ti:");
      // Filtramos solo los que sirven para generar contenido
      const models = data.models
        .filter((m) => m.supportedGenerationMethods.includes("generateContent"))
        .map((m) => m.name.replace("models/", ""));

      console.log(models);
    }
  } catch (error) {
    console.error("❌ Error de conexión:", error.message);
  }
}

check();
