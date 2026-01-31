const supabaseAdmin = require("../config/supabaseAdmin");
const Groq = require("groq-sdk");

// Inicializamos Groq
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// 1. GENERAR (SOLO CREA EL JSON, NO GUARDA EN DB)
const crearEntreno = async (req, res) => {
  console.log("🧠 [Groq] Generando rutina...");

  const { userId, objetivo, dias, peso, altura, edad, genero, nivel } =
    req.body;

  if (!userId) return res.status(400).json({ error: "Falta User ID" });

  try {
    // A. Validar Suscripción PRO
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("subscription_tier")
      .eq("id", userId)
      .single();

    if (!profile || profile.subscription_tier !== "pro") {
      return res.status(403).json({ error: "REQUIERE PLAN PRO" });
    }

    // B. Buscar datos base en DB
    const { data: bio } = await supabaseAdmin
      .from("biometrics")
      .select("*")
      .eq("user_id", userId)
      .limit(1)
      .single();

    // C. Consolidar Datos
    const datos = {
      peso: peso ? Number(peso) : bio?.weight_kg,
      altura: altura ? Number(altura) : bio?.height_cm,
      edad: edad ? Number(edad) : bio?.age,
      genero: genero || bio?.gender || "masculino",
      nivel: nivel || bio?.activity_level || "moderado",
      objetivo: objetivo || bio?.goal || "mantener",
      dias: dias || "4",
    };

    if (!datos.peso || !datos.altura || !datos.edad) {
      return res
        .status(400)
        .json({ error: "Faltan datos de perfil (Peso/Altura/Edad)." });
    }

    // D. Generar Prompt para Groq (AJUSTADO PARA RUTINAS COMPLETAS)
    const prompt = `
      Genera una rutina de entrenamiento personalizada, PROFESIONAL y COMPLETA.
      
      PERFIL USUARIO:
      - Edad: ${datos.edad}, Género: ${datos.genero}
      - Nivel: ${datos.nivel}
      - Objetivo: ${datos.objetivo}
      - Disponibilidad: ${datos.dias} días por semana

      ESTRUCTURA OBLIGATORIA POR DÍA (NO RECORTAR):
      1. Calentamiento específico o movilidad (opcional en lista, pero implícito).
      2. Ejercicios Principales (Compuestos): 1 o 2 ejercicios pesados.
      3. Ejercicios Accesorios (Hipertrofia): 3 a 5 ejercicios complementarios.
      
      REGLAS DE CALIDAD:
      - Genera entre 5 y 7 ejercicios REALES por sesión. (3 ejercicios es insuficiente).
      - Si el objetivo es fuerza/hipertrofia, asegura volumen suficiente.
      - Duración objetivo: 45-60 min (Logra esto ajustando descansos, NO quitando ejercicios).

      ESTRUCTURA JSON OBLIGATORIA (Responde SOLO con este JSON):
      {
        "nombre_rutina": "Nombre atractivo (ej: PowerBuilding Fase 1)",
        "frecuencia": "${datos.dias} días por semana",
        "enfoque": "Ej: Fuerza / Hipertrofia",
        "dias": [
          {
            "dia": "Día 1 - Grupo Muscular (ej: Pectoral + Tríceps)",
            "ejercicios": [
              { "nombre": "Nombre Ejercicio", "series": "4", "reps": "8-10", "descanso": "90s" },
              { "nombre": "Nombre Ejercicio", "series": "3", "reps": "12-15", "descanso": "60s" }
            ]
          }
        ],
        "tip_extra": "Consejo técnico avanzado"
      }
      
      Nota: Asegúrate de generar exactamente ${datos.dias} días distintos.
    `;

    // E. Llamada a la IA (Groq)
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content:
            "Eres un Entrenador de Alto Rendimiento. Diseñas programas serios, con volumen adecuado y selección de ejercicios biomecánicamente correcta.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.5,
      response_format: { type: "json_object" },
    });

    // F. Procesar respuesta
    const rutina = JSON.parse(completion.choices[0].message.content);

    // Agregamos metadatos útiles
    rutina.objetivo_origen = datos.objetivo;
    rutina.dias_origen = datos.dias;
    rutina.fecha_creacion = new Date().toISOString();

    res.json({ exito: true, rutina });
  } catch (error) {
    console.error("❌ Error Trainer (Groq):", error);
    res.status(500).json({ error: "Error generando entreno con IA" });
  }
};

// 2. GUARDAR (INSERTA EN HISTORIAL Y ACTUALIZA PERFIL ACTIVO)
const guardarEntreno = async (req, res) => {
  console.log("💾 [DB] Guardando rutina en historial...");
  const { userId, rutina } = req.body;

  if (!userId || !rutina) {
    return res.status(400).json({ error: "Faltan datos (userId o rutina)" });
  }

  try {
    const { data, error } = await supabaseAdmin
      .from("saved_workouts")
      .insert({
        user_id: userId,
        plan_data: rutina,
        created_at: new Date(),
      })
      .select()
      .single();

    if (error) throw error;

    await supabaseAdmin
      .from("biometrics")
      .update({
        workout_plan: rutina,
        updated_at: new Date(),
      })
      .eq("user_id", userId);

    res.json({ exito: true, message: "Rutina guardada", id: data.id });
  } catch (error) {
    console.error("Error guardando rutina:", error);
    res.status(500).json({ error: "No se pudo guardar la rutina" });
  }
};

module.exports = { crearEntreno, guardarEntreno };
