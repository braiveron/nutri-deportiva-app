// 1. Importamos librerías
const { createClient } = require("@supabase/supabase-js");
const Groq = require("groq-sdk");

// 2. INICIALIZACIÓN SUPABASE (Admin)
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

// 3. INICIALIZACIÓN GROQ (IA)
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// --- FUNCIONES DEL CONTROLADOR ---

// 1. OBTENER LOGS DE UN DÍA
exports.getDailyLogs = async (req, res) => {
  const { id } = req.params;
  // Si no viene fecha en la URL, generamos la de hoy automáticamente
  const today = new Date().toLocaleDateString("en-CA");
  const filterDate = req.query.date || today;

  try {
    const { data, error } = await supabase
      .from("daily_logs")
      .select("*")
      .eq("user_id", id)
      .eq("date", filterDate); // <--- Ahora SIEMPRE filtra por una fecha

    if (error) throw error;
    res.json({ success: true, logs: data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// 2. AGREGAR COMIDA (MANUAL O VIA IA)
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
          date: date || new Date().toLocaleDateString("en-CA"),
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

// 3. ANALIZAR CON IA + CACHÉ GLOBAL 🚀 (La joya de la corona)
exports.analyzeFood = async (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: "Falta el texto" });

  try {
    // A. Normalizamos la búsqueda (para que "2 Huevos" sea igual a "2 huevos")
    const queryLimpia = text.trim().toLowerCase();
    console.log(`🔍 Analizando: "${queryLimpia}"`);

    // B. BUSCAR EN CACHÉ (Base de Datos)
    const { data: cachedFood } = await supabase
      .from("food_library")
      .select("*")
      .eq("search_query", queryLimpia)
      .single();

    if (cachedFood) {
      console.log("⚡ [CACHE HIT] Encontrado en DB. Ahorrando llamada a IA.");
      // Devolvemos lo que ya sabíamos, adaptando la estructura
      return res.json({
        success: true,
        data: {
          meal_name: cachedFood.meal_name, // Usamos el nombre que guardamos
          calories: cachedFood.calories,
          protein: cachedFood.protein,
          carbs: cachedFood.carbs,
          fats: cachedFood.fats,
        },
      });
    }

    // C. SI NO ESTÁ EN CACHÉ -> CONSULTAMOS A GROQ
    console.log("🤖 [CACHE MISS] Consultando a Groq...");

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `Eres un nutricionista experto. 
          Tarea: Analiza el texto y devuelve la info nutricional aproximada.
          
          REGLAS:
          1. Responde SOLO JSON.
          2. Si es cantidad vaga ("pollo"), asume 100g o 1 unidad estándar.
          3. Estructura: {"meal_name": "Nombre Corto", "calories": 0, "protein": 0, "carbs": 0, "fats": 0}`,
        },
        { role: "user", content: text },
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.1,
      response_format: { type: "json_object" },
    });

    const aiResult = JSON.parse(completion.choices[0].message.content);

    // D. GUARDAR EN BIBLIOTECA (Para el futuro)
    // Usamos el nombre que devolvió la IA ("meal_name" o "food_name" según lo que devuelva)
    const foodName = aiResult.meal_name || aiResult.food_name || text;

    const { error: insertError } = await supabase.from("food_library").insert({
      search_query: queryLimpia,
      meal_name: foodName,
      calories: aiResult.calories,
      protein: aiResult.protein,
      carbs: aiResult.carbs,
      fats: aiResult.fats,
    });

    if (!insertError) {
      console.log("💾 [GUARDADO] Agregado a la biblioteca global.");
    }

    // E. RESPONDER AL CLIENTE
    // Normalizamos la respuesta para que el frontend siempre reciba "meal_name"
    res.json({
      success: true,
      data: { ...aiResult, meal_name: foodName },
    });
  } catch (error) {
    console.error("❌ Error Analyzer:", error);
    res
      .status(500)
      .json({ success: false, error: "No pude analizar la comida." });
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
    await supabase.from("daily_logs").delete().eq("user_id", id);
    await supabase.from("saved_recipes").delete().eq("user_id", id);
    await supabase.from("weight_logs").delete().eq("user_id", id);
    await supabase.from("saved_workouts").delete().eq("user_id", id);
    const { error } = await supabase.from("profiles").delete().eq("id", id);

    if (error) throw error;
    res.json({ success: true });
  } catch (error) {
    console.error("Error eliminando cuenta:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// 6. REGISTRAR PESO (Y BIOMETRÍA) 🚀 ACTUALIZADO
exports.addWeightLog = async (req, res) => {
  // Extraemos TODOS los campos que ahora manda el frontend
  const { userId, weight, date, waist, neck, hip, fat_percentage } = req.body;

  // Validación estricta: Si no hay peso, devolvemos 400 (que es el error que veías)
  if (!userId || weight === undefined || weight === "") {
    return res.status(400).json({
      success: false,
      error: "El peso es obligatorio para registrar cualquier métrica.",
    });
  }

  try {
    const { data, error } = await supabase
      .from("weight_logs")
      .insert([
        {
          user_id: userId,
          weight: parseFloat(weight),
          date: date || new Date().toLocaleDateString("en-CA"),
          // Guardamos las medidas solo si existen, si no, van como null
          waist: waist ? parseFloat(waist) : null,
          neck: neck ? parseFloat(neck) : null,
          hip: hip ? parseFloat(hip) : null,
          fat_percentage: fat_percentage ? parseFloat(fat_percentage) : null,
        },
      ])
      .select()
      .single();

    if (error) throw error;

    res.json({ success: true, log: data });
  } catch (error) {
    console.error("Error guardando peso y biometría:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// 7. OBTENER HISTORIAL DE PESO
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
