// 1. Importamos la librería
const { createClient } = require("@supabase/supabase-js");

// 2. INICIALIZACIÓN PROFESIONAL
// Usamos SUPABASE_SERVICE_ROLE_KEY para permisos de Admin (saltar RLS)
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

// --- FUNCIONES DEL CONTROLADOR ---

// 1. OBTENER LOGS DE UN DÍA
exports.getDailyLogs = async (req, res) => {
  const { id } = req.params; // Esto espera que la ruta sea /tracker/:id
  const { date } = req.query;

  try {
    let query = supabase.from("daily_logs").select("*").eq("user_id", id);

    if (date) {
      query = query.eq("date", date);
    }

    const { data, error } = await query;

    if (error) throw error;
    res.json({ success: true, logs: data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// 2. AGREGAR COMIDA
exports.addDailyLog = async (req, res) => {
  const { userId, meal_name, calories, protein, carbs, fats, date } = req.body;

  try {
    const { data, error } = await supabase
      .from("daily_logs")
      .insert([
        {
          user_id: userId,
          meal_name,
          calories,
          protein,
          carbs,
          fats,
          date: date || new Date().toISOString().split("T")[0],
        },
      ])
      .select()
      .single();

    if (error) throw error;
    res.json({ success: true, log: data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// 3. ANALIZAR CON IA (Gemini)
const { GoogleGenerativeAI } = require("@google/generative-ai");
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

exports.analyzeFood = async (req, res) => {
  const { text } = req.body;
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const prompt = `Analiza este alimento: "${text}". Devuelve SOLO un objeto JSON (sin markdown, sin texto extra) con estimaciones de: calories, protein, carbs, fats. Ejemplo: {"calories": 200, "protein": 10, "carbs": 20, "fats": 5}. Si no es alimento, devuelve campos en 0.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const textResponse = response.text();

    // Limpieza para asegurar JSON válido
    const jsonString = textResponse.replace(/```json|```/g, "").trim();
    const nutrientData = JSON.parse(jsonString);

    res.json({ success: true, data: nutrientData });
  } catch (error) {
    console.error("Error Gemini:", error);
    res.status(500).json({ success: false, error: "Error al analizar" });
  }
};

// 4. BORRAR COMIDA
exports.deleteLog = async (req, res) => {
  const { id } = req.params;
  try {
    const { error } = await supabase.from("daily_logs").delete().eq("id", id);

    if (error) throw error;
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// 5. BORRAR CUENTA COMPLETA
exports.deleteUserAccount = async (req, res) => {
  const { id } = req.params;

  try {
    // Borramos logs diarios
    await supabase.from("daily_logs").delete().eq("user_id", id);
    // Borramos recetas guardadas
    await supabase.from("saved_recipes").delete().eq("user_id", id);
    // Borramos historial de peso
    await supabase.from("weight_logs").delete().eq("user_id", id);
    // Borramos el perfil
    const { error } = await supabase.from("profiles").delete().eq("id", id);

    if (error) throw error;

    res.json({ success: true });
  } catch (error) {
    console.error("Error eliminando cuenta:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// 6. REGISTRAR PESO (NUEVO)
exports.addWeightLog = async (req, res) => {
  const { userId, weight, date } = req.body;

  // Validación básica
  if (!userId || !weight) {
    return res
      .status(400)
      .json({ success: false, error: "Faltan datos (userId o weight)" });
  }

  try {
    const { data, error } = await supabase
      .from("weight_logs")
      .insert([{ user_id: userId, weight, date }])
      .select()
      .single();

    if (error) throw error;
    res.json({ success: true, log: data });
  } catch (error) {
    console.error("Error guardando peso:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// 7. OBTENER HISTORIAL DE PESO (NUEVO)
exports.getWeightHistory = async (req, res) => {
  const { id } = req.params;
  try {
    const { data, error } = await supabase
      .from("weight_logs")
      .select("*")
      .eq("user_id", id)
      .order("date", { ascending: true });

    if (error) throw error;
    res.json({ success: true, history: data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
