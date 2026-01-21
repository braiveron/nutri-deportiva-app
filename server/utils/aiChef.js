const { GoogleGenerativeAI } = require("@google/generative-ai");
const dotenv = require("dotenv");

dotenv.config();

// Usamos el modelo rápido y gratuito
const modelName = "gemini-flash-latest";
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: modelName });

// --- FUNCIÓN DE LIMPIEZA INTELIGENTE ---
function limpiarYParsearJSON(textoSucio) {
  try {
    // 1. Quitar bloques de código Markdown (```json ... ```)
    let textoLimpio = textoSucio
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    // 2. BUSQUEDA QUIRÚRGICA: Encontrar el primer '{' y el último '}'
    const inicio = textoLimpio.indexOf("{");
    const fin = textoLimpio.lastIndexOf("}");

    if (inicio === -1 || fin === -1) {
      throw new Error("No se encontró un objeto JSON válido en la respuesta.");
    }

    // 3. Cortamos solo lo que está entre llaves (incluyéndolas)
    const jsonString = textoLimpio.substring(inicio, fin + 1);

    // 4. Intentamos convertir a objeto real
    return JSON.parse(jsonString);
  } catch (error) {
    console.error("❌ Falló el parseo del JSON:", error.message);
    console.error("Texto recibido de la IA:", textoSucio); // Para depurar
    throw new Error("La IA cocinó algo que no se pudo leer. Intenta de nuevo.");
  }
}

async function generarReceta(ingredientes, tipoComida, macrosObjetivo) {
  try {
    // Prompt optimizado para ser estricto
    const prompt = `
      ERES UN CHEF EXPERTO Y UN PROGRAMADOR.
      
      TAREA: Crea una receta ${tipoComida} usando: ${ingredientes.join(", ")}.
      OBJETIVO NUTRICIONAL: Aprox ${macrosObjetivo.calorias} kcal (Prioriza Proteína).

      REGLAS CRÍTICAS DE FORMATO:
      1. RESPONDE SOLAMENTE CON UN JSON VÁLIDO.
      2. NO escribas introducciones, ni conclusiones, ni markdown.
      3. NO uses comentarios // dentro del JSON.

      ESTRUCTURA JSON OBLIGATORIA:
      {
        "nombre_receta": "Título corto y épico",
        "tiempo": "Ej: 15 min",
        "ingredientes": [ 
           {"item": "Nombre exacto", "cantidad": "Cantidad estimada"} 
        ],
        "macros": { "calorias": 0, "proteinas": 0, "carbos": 0, "grasas": 0 },
        "pasos": ["Paso 1 corto", "Paso 2 corto", "Paso 3 corto"],
        "tip": "Un consejo breve de experto"
      }
    `;

    console.log("👨‍🍳 Chef cocinando...");
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Usamos nuestra función de limpieza
    const receta = limpiarYParsearJSON(text);
    return receta;
  } catch (error) {
    // Si algo falla, lanzamos el error para que lo vea el usuario
    throw error;
  }
}

module.exports = { generarReceta };
