const { GoogleGenerativeAI } = require("@google/generative-ai");
const dotenv = require("dotenv");

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

const generarRutina = async (perfilUsuario) => {
  try {
    // 👇 ACEPTAMOS 'dias' AQUÍ
    const { edad, genero, objetivo, nivel_actividad, dias } = perfilUsuario;

    const prompt = `
      Actúa como un Entrenador Personal de élite experto en fisiología.
      Genera una rutina de entrenamiento semanal DETALLADA en formato JSON para este usuario:
      
      DATOS DEL USUARIO:
      - Edad: ${edad}
      - Género: ${genero}
      - Objetivo: ${objetivo} (CRÍTICO: Si es 'perder', prioriza circuitos/metabólico. Si es 'ganar', prioriza hipertrofia/fuerza).
      - Nivel actual: ${nivel_actividad}
      - Frecuencia disponible: ${dias} días por semana.
      
      ⚠️ REGLAS OBLIGATORIAS:
      1. Responde ÚNICAMENTE con el JSON crudo.
      2. Debes generar EXACTAMENTE ${dias} días de rutina (ni más, ni menos).
      3. Adapta la distribución muscular (Split) según la cantidad de días (ej: 3 días = Full Body, 4 días = Torso/Pierna, etc).
      4. Incluye series, repeticiones y descansos.
      
      Estructura JSON obligatoria:
      {
        "nombre_rutina": "Ej: Rutina Full Body Quemagrasa",
        "frecuencia": "${dias} días por semana",
        "enfoque": "Breve explicación del enfoque (ej: Hipertrofia)",
        "dias": [
          {
            "dia": "Día 1 - Pecho y Tríceps",
            "ejercicios": [
              { "nombre": "Press Banca", "series": "4", "reps": "10-12", "descanso": "90s" }
            ]
          }
          // ... Deben haber ${dias} elementos aquí
        ],
        "tip_extra": "Un consejo clave para este objetivo"
      }
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    const jsonStartIndex = text.indexOf("{");
    const jsonEndIndex = text.lastIndexOf("}") + 1;
    const jsonString = text.substring(jsonStartIndex, jsonEndIndex);

    return JSON.parse(jsonString);
  } catch (error) {
    console.error("❌ Error AI Trainer:", error);
    return null; // Devolvemos null para manejar el error en el backend
  }
};

module.exports = { generarRutina };
