const { GoogleGenerativeAI } = require("@google/generative-ai");
const dotenv = require("dotenv");

dotenv.config();

// ⚠️ MANTÉN ESTA PARTE EXACTAMENTE COMO LA TIENES QUE TE FUNCIONA ⚠️
// Si usas "gemini-flash-latest" o "gemini-pro", déjalo así.
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

// 👇 AQUÍ EMPIEZA LO NUEVO 👇
// Aceptamos un 4to parámetro: 'recetasEvitar' (que es un array de nombres)
const generarReceta = async (
  ingredientes,
  tipoComida,
  macrosObjetivo,
  recetasEvitar = [],
) => {
  try {
    // Convertimos la lista de recetas prohibidas en texto para el prompt
    const listaProhibida =
      recetasEvitar.length > 0
        ? `⛔ NO GENERES ESTOS PLATOS (ya los tiene): ${recetasEvitar.join(", ")}. ¡Sé creativo y varía!`
        : "";

    const prompt = `
      Actúa como nutricionista experto.
      Genera una receta JSON basada en:
      - Ingredientes: ${ingredientes.join(", ")}
      - Comida: ${tipoComida}
      - Objetivo: ${macrosObjetivo.calorias || "Balanceado"} kcal, ${macrosObjetivo.proteinas || "Alto en proteina"}g prot.

      ${listaProhibida}

      ⚠️ IMPORTANTE: Responde ÚNICAMENTE con un objeto JSON crudo.
      Debes incluir EXPLICITAMENTE el campo "carbohidratos" en los macros.

      Estructura obligatoria:
      {
        "nombre_receta": "Nombre",
        "tiempo": "ej: 15 min",
        "ingredientes": [{ "item": "Nombre", "cantidad": "Cant" }],
        "macros": {
            "calorias": 0,
            "proteinas": 0,
            "carbohidratos": 0,
            "grasas": 0
        },
        "pasos": ["Paso 1", "Paso 2"],
        "tip": "Tip breve"
      }
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Limpieza de JSON
    const jsonStartIndex = text.indexOf("{");
    const jsonEndIndex = text.lastIndexOf("}") + 1;

    if (jsonStartIndex === -1) throw new Error("No se encontró JSON válido");

    const jsonString = text.substring(jsonStartIndex, jsonEndIndex);

    return JSON.parse(jsonString);
  } catch (error) {
    console.error("❌ Error en AI Chef:", error.message);
    // Fallback por si explota
    return {
      nombre_receta: "Receta Offline",
      tiempo: "5 min",
      ingredientes: [{ item: "Error", cantidad: "-" }],
      macros: { calorias: 0, proteinas: 0, carbohidratos: 0, grasas: 0 },
      pasos: ["Hubo un error de conexión.", "Intenta de nuevo."],
      tip: "Verifica tu conexión a Gemini.",
    };
  }
};

module.exports = { generarReceta };
