const supabaseAdmin = require("../config/supabaseAdmin");

// 1. CALCULAR PLAN (Genera los 3 escenarios: Perder, Mantener, Ganar)
const calcularPlan = async (req, res) => {
  const { userId, peso, altura, edad, genero, nivel_actividad, objetivo } =
    req.body;

  if (!peso || !altura || !edad) {
    return res.status(400).json({ error: "Faltan datos obligatorios" });
  }

  try {
    // --- CÁLCULO DE CALORÍAS (TMB) ---
    let tmb;
    if (genero === "masculino") {
      tmb = 10 * peso + 6.25 * altura - 5 * edad + 5;
    } else {
      tmb = 10 * peso + 6.25 * altura - 5 * edad - 161;
    }

    const factores = {
      sedentario: 1.2,
      ligero: 1.375,
      moderado: 1.55,
      intenso: 1.725,
      muy_intenso: 1.9,
    };

    const caloriasBase = Math.round(tmb * (factores[nivel_actividad] || 1.2));

    // --- GENERADOR DE MACROS ---
    const crearPlan = (tipoObjetivo) => {
      let calFinales = caloriasBase;
      let p = 1.8,
        g = 1.0;

      if (tipoObjetivo === "perder") {
        calFinales = Math.round(caloriasBase * 0.8);
        p = 2.2;
        g = 0.9;
      }
      if (tipoObjetivo === "ganar") {
        calFinales = Math.round(caloriasBase * 1.1);
        p = 2.0;
        g = 1.0;
      }

      if (calFinales < tmb) calFinales = Math.round(tmb);

      const proteina = Math.round(peso * p);
      const grasa = Math.round(peso * g);
      const calRestantes = calFinales - proteina * 4 - grasa * 9;
      let carbos = Math.round(calRestantes / 4);
      if (carbos < 50) carbos = 50;

      return {
        calorias_diarias: calFinales,
        macros: { proteinas: proteina, carbohidratos: carbos, grasas: grasa },
      };
    };

    const resultados = {
      perder: crearPlan("perder"),
      mantener: crearPlan("mantener"),
      ganar: crearPlan("ganar"),
    };

    const planSeleccionado = resultados[objetivo] || resultados.mantener;

    // --- GUARDAR EN DB ---
    const dataToSave = {
      ...planSeleccionado,
      todos_los_planes: resultados,
    };

    if (userId) {
      await supabaseAdmin.from("biometrics").insert({
        user_id: userId,
        weight_kg: peso,
        height_cm: altura,
        age: edad,
        gender: genero,
        activity_level: nivel_actividad,
        goal: objetivo,
        target_macros: dataToSave,
      });
    }

    res.json({ mensaje: "Cálculo exitoso", plan: dataToSave });
  } catch (error) {
    console.error("Error en el cálculo:", error);
    res.status(500).json({ error: "Error interno calculando macros" });
  }
};

// 2. SUSCRIBIRSE (IMPORTANTE: Esto es lo que activa el PRO) 🚀
const suscribirse = async (req, res) => {
  const { userId } = req.body;

  if (!userId) return res.status(400).json({ error: "Falta User ID" });

  try {
    const fechaVencimiento = new Date();
    // Sumar 1 mes
    fechaVencimiento.setMonth(fechaVencimiento.getMonth() + 1);

    const { error } = await supabaseAdmin
      .from("profiles")
      .update({
        subscription_tier: "pro", // <--- CAMBIA A PRO
        subscription_end_date: fechaVencimiento.toISOString(),
        auto_renew: true, // <--- ACTIVA RENOVACIÓN
      })
      .eq("id", userId);

    if (error) throw error;

    console.log(`✅ Usuario ${userId} ahora es PRO.`);
    res.json({ success: true, vence: fechaVencimiento });
  } catch (error) {
    console.error("Error suscripción:", error);
    res.status(500).json({ error: "Error al suscribir" });
  }
};

// 3. CANCELAR SUSCRIPCIÓN (Solo apaga la renovación)
const cancelarSuscripcion = async (req, res) => {
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: "Falta User ID" });

  try {
    const { error } = await supabaseAdmin
      .from("profiles")
      .update({ auto_renew: false }) // <--- SOLO APAGA EL BOOLEANO
      .eq("id", userId);

    if (error) throw error;

    console.log(`❌ Usuario ${userId} canceló renovación.`);
    res.json({ success: true });
  } catch (error) {
    console.error("Error cancelación:", error);
    res.status(500).json({ error: "Error al cancelar" });
  }
};

// 4. OBTENER PLAN
const obtenerPlan = async (req, res) => {
  const { userId } = req.params;
  try {
    const { data, error } = await supabaseAdmin
      .from("biometrics")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== "PGRST116") throw error;
    if (!data) return res.json({ existe: false });

    res.json({ existe: true, datos: data });
  } catch (error) {
    res.status(500).json({ error: "Error al recuperar datos" });
  }
};

module.exports = {
  calcularPlan,
  suscribirse,
  obtenerPlan,
  cancelarSuscripcion,
};
