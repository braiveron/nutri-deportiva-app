require("dotenv").config();
const { createClient } = require("@supabase/supabase-js");

// Inicialización con permisos de Admin
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

// --- LÓGICA DE CÁLCULO NUTRICIONAL (Interna) ---
const calcularMacros = (peso, altura, edad, genero, nivel_actividad) => {
  // 1. TMB (Mifflin-St Jeor)
  let tmb = 10 * peso + 6.25 * altura - 5 * edad;
  tmb = genero === "masculino" ? tmb + 5 : tmb - 161;

  // 2. Factores de Actividad
  const factores = {
    sedentario: 1.2,
    ligero: 1.375,
    moderado: 1.55,
    intenso: 1.725,
    muy_intenso: 1.9,
  };
  const mantenimiento = Math.round(tmb * (factores[nivel_actividad] || 1.2));

  // 3. Crear variantes según objetivo
  const generarPlan = (kcal, pMult, gMult) => {
    const proteinas = Math.round(peso * pMult);
    const grasas = Math.round(peso * gMult);
    const carbohidratos = Math.round((kcal - proteinas * 4 - grasas * 9) / 4);
    return {
      calorias_diarias: kcal,
      macros: { proteinas, carbohidratos, grasas },
    };
  };

  return {
    todos_los_planes: {
      perder: generarPlan(mantenimiento - 500, 2.2, 0.8),
      mantener: generarPlan(mantenimiento, 2.0, 0.9),
      ganar: generarPlan(mantenimiento + 300, 2.0, 1.0),
    },
  };
};

// --- FUNCIONES DEL USUARIO ---

exports.obtenerPlan = async (req, res) => {
  const { userId } = req.params;
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) throw error;
    res.json({ existe: true, datos: data });
  } catch (error) {
    res.json({ existe: false, error: "Perfil no encontrado" });
  }
};

exports.calcularPlan = async (req, res) => {
  const { userId, peso, altura, edad, genero, nivel_actividad, objetivo } =
    req.body;

  try {
    // Generamos el cálculo matemático
    const planCalculado = calcularMacros(
      Number(peso),
      Number(altura),
      Number(edad),
      genero,
      nivel_actividad,
    );

    // Preparamos los datos para guardar en Supabase
    const updates = {
      updated_at: new Date(),
      weight_kg: Number(peso),
      height_cm: Number(altura),
      age: Number(edad),
      gender: genero,
      activity_level: nivel_actividad,
      goal: objetivo,
      target_macros: planCalculado, // Guardamos todos los planes calculados
    };

    const { data, error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", userId)
      .select()
      .single();

    if (error) throw error;

    // Respondemos al frontend con el plan listo para usar
    res.json({ success: true, plan: planCalculado });
  } catch (error) {
    console.error("Error en calcularPlan:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.suscribirse = async (req, res) => {
  const { userId } = req.body;
  try {
    const { data, error } = await supabase
      .from("profiles")
      .update({
        subscription_tier: "pro",
        subscription_status: "active",
        auto_renew: true,
        updated_at: new Date(),
      })
      .eq("id", userId)
      .select();
    if (error) throw error;
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.cancelarSuscripcion = async (req, res) => {
  const { userId } = req.body;
  try {
    const { data, error } = await supabase
      .from("profiles")
      .update({ auto_renew: false, updated_at: new Date() })
      .eq("id", userId)
      .select();
    if (error) throw error;
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.createSupportTicket = async (req, res) => {
  const { userId, subject, message } = req.body;
  try {
    const { data, error } = await supabase
      .from("support_tickets")
      .insert([{ user_id: userId, subject: subject || "Sin Asunto", message }])
      .select()
      .single();
    if (error) throw error;
    res.json({ success: true, ticket: data });
  } catch (error) {
    res.status(500).json({ success: false, error: "Error al crear ticket" });
  }
};

// --- FUNCIONES DE ADMINISTRADOR ---

exports.getAllTickets = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("support_tickets")
      .select(`*, profiles (*)`)
      .order("created_at", { ascending: false });

    if (error) throw error;
    res.json({ success: true, tickets: data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.resolveTicket = async (req, res) => {
  const { ticketId } = req.body;
  try {
    const { data, error } = await supabase
      .from("support_tickets")
      .update({ status: "closed" })
      .eq("id", ticketId)
      .select();
    if (error) throw error;
    res.json({ success: true, ticket: data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.deleteUserAccount = async (req, res) => {
  const { userId } = req.body;
  try {
    const { error: authError } = await supabase.auth.admin.deleteUser(userId);
    if (authError) throw authError;
    await supabase.from("profiles").delete().eq("id", userId);
    res.json({ success: true, message: "Cuenta eliminada." });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
