const supabaseAdmin = require("../config/supabaseAdmin");
const { generarRutina } = require("../utils/aiTrainer");

// 1. GENERAR (SOLO CREA EL JSON, NO GUARDA EN DB)
const crearEntreno = async (req, res) => {
  console.log("🧠 [IA] Generando rutina (Borrador)...");

  // Recibimos datos en español (coherencia con Frontend)
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

    // B. Buscar datos base en DB (para completar lo que falte)
    const { data: bio } = await supabaseAdmin
      .from("biometrics")
      .select("*")
      .eq("user_id", userId)
      .limit(1)
      .single();

    // C. Consolidar Datos (Prioridad: Frontend > DB)
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

    // D. Generar con IA
    const perfilParaIA = {
      edad: datos.edad,
      genero: datos.genero,
      objetivo: datos.objetivo,
      nivel_actividad: datos.nivel,
      dias: datos.dias,
      peso: datos.peso,
      altura: datos.altura,
    };

    const rutina = await generarRutina(perfilParaIA);
    if (!rutina) throw new Error("Fallo IA al generar JSON");

    // E. Agregamos metadatos útiles
    rutina.objetivo_origen = datos.objetivo;
    rutina.dias_origen = datos.dias;
    rutina.fecha_creacion = new Date().toISOString();

    // 🛑 RESPONDEMOS CON EL JSON (SIN GUARDAR)
    res.json({ exito: true, rutina });
  } catch (error) {
    console.error("Error Trainer:", error);
    res.status(500).json({ error: "Error generando entreno" });
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
    // A. Insertamos en la tabla 'saved_workouts' (Historial)
    // Asegúrate de haber creado esta tabla en Supabase SQL
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

    // B. Actualizamos también el perfil 'biometrics'
    // Para que esta sea la rutina que aparece "Activa" al entrar a la app
    await supabaseAdmin
      .from("biometrics")
      .update({
        workout_plan: rutina,
        updated_at: new Date(),
      })
      .eq("user_id", userId);

    console.log("✅ Rutina guardada con ID:", data.id);
    res.json({
      exito: true,
      message: "Rutina guardada correctamente",
      id: data.id,
    });
  } catch (error) {
    console.error("❌ Error guardando rutina:", error);
    res
      .status(500)
      .json({ error: "No se pudo guardar la rutina en la base de datos" });
  }
};

module.exports = { crearEntreno, guardarEntreno };
