const { supabase } = require("../supabase");
const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config(); // 👈 Aseguramos que lea el .env aquí también

// Configuramos Gemini
// Si 'gemini-flash-latest' te funcionaba antes, puedes probar poner ese.
// Pero 'gemini-pro' es el estándar más estable para texto ahora mismo.
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });
// 1. OBTENER LOGS
exports.getDailyLogs = async (req, res) => {
  const { userId } = req.params;
  const { date } = req.query; // 👈 Leemos la fecha que manda el frontend (ej: "2026-01-27")

  if (!date) {
    return res.status(400).json({ success: false, error: "Falta la fecha" });
  }

  try {
    const { data, error } = await supabase
      .from("daily_logs")
      .select("*")
      .eq("user_id", userId)
      .eq("date", date); // Usamos esa fecha específica

    if (error) throw error;
    res.json({ success: true, logs: data });
  } catch (error) {
    console.error("Error GetLogs:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// 2. AGREGAR LOG
exports.addLog = async (req, res) => {
  // 👇 Agregamos 'date' aquí
  const { userId, date, meal_name, calories, protein, carbs, fats } = req.body;

  try {
    const { data, error } = await supabase
      .from("daily_logs")
      .insert([
        {
          user_id: userId,
          date: date, // 👈 Guardamos con la fecha exacta que mandó el usuario
          meal_name,
          calories: Number(calories),
          protein: Number(protein),
          carbs: Number(carbs),
          fats: Number(fats),
        },
      ])
      .select();

    if (error) throw error;
    res.json({ success: true, log: data[0] });
  } catch (error) {
    console.error("Error AddLog:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// 3. ANALIZAR COMIDA (Con Logs de Debug)
exports.analyzeFood = async (req, res) => {
  const { text } = req.body;

  // 👇 MIRA TU TERMINAL CUANDO LE DES AL BOTÓN
  console.log("---- INTENTO DE ANÁLISIS IA ----");
  console.log("Texto recibido:", text);
  console.log("API KEY existe:", !!process.env.GEMINI_API_KEY); // Debe decir true

  try {
    const prompt = `
      Actúa como un Nutricionista Experto.
      Analiza: "${text}".
      
      Devuelve SOLO un JSON con estimación de: calories, protein, carbs, fats.
      Si no es comida, devuelve todo en 0.
      
      Estructura JSON (sin markdown):
      { "calories": 0, "protein": 0, "carbs": 0, "fats": 0 }
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const responseText = response.text();

    console.log("Respuesta Gemini:", responseText); // 👈 Veremos qué responde la IA

    // Limpieza de JSON (Tu método infalible)
    const jsonStartIndex = responseText.indexOf("{");
    const jsonEndIndex = responseText.lastIndexOf("}") + 1;

    let nutritionalData = { calories: 0, protein: 0, carbs: 0, fats: 0 };

    if (jsonStartIndex !== -1 && jsonEndIndex !== -1) {
      const jsonString = responseText.substring(jsonStartIndex, jsonEndIndex);
      nutritionalData = JSON.parse(jsonString);
    } else {
      console.log("⚠️ No encontré JSON en la respuesta");
    }

    res.json({ success: true, data: nutritionalData });
  } catch (error) {
    console.error("❌ ERROR CRÍTICO GEMINI:", error);
    // Devolvemos success: false para que el frontend sepa que falló
    res
      .status(500)
      .json({ success: false, error: "Error en el servidor de IA" });
  }
};

// ... al final del archivo ...

// 4. BORRAR LOG
exports.deleteLog = async (req, res) => {
  const { id } = req.params;

  try {
    const { error } = await supabase.from("daily_logs").delete().eq("id", id);

    if (error) throw error;
    res.json({ success: true });
  } catch (error) {
    console.error("Error DeleteLog:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};
