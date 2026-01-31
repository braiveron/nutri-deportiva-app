const supabaseAdmin = require("../config/supabaseAdmin");
const Groq = require("groq-sdk");

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const crearReceta = async (req, res) => {
  // 👇 AGREGAMOS 'recetasOmitir' AQUÍ
  const { ingredientes, tipoComida, macrosObjetivo, userId, recetasOmitir } =
    req.body;

  if (!userId)
    return res.status(401).json({ error: "Usuario no identificado" });

  try {
    // 1. Validar PRO (Si tienes la validación comentada, déjala así)
    /*
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("subscription_tier")
      .eq("id", userId)
      .single();

    if (!profile || profile.subscription_tier !== "pro") {
      return res.status(403).json({ error: "REQUIERE PLAN PRO" });
    }
    */

    // 2. Historial de DB (Lo que ya guardó)
    const { data: historial } = await supabaseAdmin
      .from("saved_recipes")
      .select("recipe_data")
      .eq("user_id", userId);

    const recetasGuardadasDB = historial
      ? historial.map((r) => r.recipe_data.nombre_receta)
      : [];

    // 👇 COMBINAMOS: Las guardadas en DB + Las que acabamos de rechazar en esta sesión
    const listaNegra = [...recetasGuardadasDB, ...(recetasOmitir || [])];

    console.log(
      `🍳 Chef cocinando ${tipoComida}... Evitando ${listaNegra.length} recetas.`,
    );

    // 3. Prompt (Usamos la lista combinada)
    const prompt = `
      Actúa como un Chef personal creativo.
      Tarea: Crea una receta deliciosa utilizando principalmente: ${ingredientes.join(", ")}.
      Contexto: Es para una comida tipo "${tipoComida}".
      
      REGLA DE ORO:
      - Crea una porción ESTÁNDAR y LÓGICA para 1 sola persona.
      - IMPORTANTE: NO repitas ninguna de estas recetas: ${listaNegra.join(", ")}. ¡Innova!

      SALIDA REQUERIDA (JSON):
      Calcula los macros REALES de la receta que acabas de inventar.
      
      {
        "nombre_receta": "Nombre atractivo",
        "tiempo": "Ej: 15 min",
        "ingredientes": [
           { "item": "Ingrediente", "cantidad": "Cantidad exacta" }
        ],
        "pasos": ["Paso 1", "Paso 2"],
        "macros": { 
            "calorias": 0, 
            "proteinas": 0, 
            "carbohidratos": 0, 
            "grasas": 0 
        },
        "tip": "Consejo breve"
      }
    `;

    // 4. Llamada a Groq
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content:
            "Eres un Chef experto. Creas recetas variadas y evitas repetir platos anteriores.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.7, // Subimos un poco la temperatura para más creatividad
      response_format: { type: "json_object" },
    });

    const receta = JSON.parse(completion.choices[0].message.content);
    res.json({ exito: true, receta });
  } catch (error) {
    console.error("❌ Error Chef:", error);
    res.status(500).json({ error: "El chef se quemó la mano." });
  }
};

module.exports = { crearReceta };
