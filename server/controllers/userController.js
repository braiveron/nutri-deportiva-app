require("dotenv").config();
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

// --- LÓGICA DE CÁLCULO NUTRICIONAL (Interna) ---
const calcularMacros = (peso, altura, edad, genero, nivel_actividad) => {
  let tmb = 10 * peso + 6.25 * altura - 5 * edad;
  tmb = genero === "masculino" ? tmb + 5 : tmb - 161;
  const factores = {
    sedentario: 1.2,
    ligero: 1.375,
    moderado: 1.55,
    intenso: 1.725,
    muy_intenso: 1.9,
  };
  const mantenimiento = Math.round(tmb * (factores[nivel_actividad] || 1.2));
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

    // --- LÓGICA DE AUTO-EXPIRACIÓN ---
    // Si el usuario es PRO, chequeamos si su tiempo se terminó
    if (data.subscription_tier === "pro" && data.subscription_end_date) {
      const hoy = new Date();
      const vencimiento = new Date(data.subscription_end_date);

      if (hoy > vencimiento) {
        console.log(
          `⚠️ Suscripción expirada para el usuario ${userId}. Downgrade a 'free'.`,
        );

        // 1. Actualizamos la base de datos a 'free' o 'user'
        const { data: updatedData } = await supabase
          .from("profiles")
          .update({
            subscription_tier: "free", // o "user", según manejes el rol básico
            subscription_status: "expired",
            updated_at: new Date(),
          })
          .eq("id", userId)
          .select()
          .single();

        // 2. Devolvemos los datos ya actualizados al frontend
        return res.json({ existe: true, datos: updatedData });
      }
    }

    // Si no ha expirado o no es PRO, devolvemos los datos normales
    res.json({ existe: true, datos: data });
  } catch (error) {
    console.error("Error en obtenerPlan:", error);
    res.json({ existe: false, error: "Perfil no encontrado" });
  }
};

exports.calcularPlan = async (req, res) => {
  const { userId, peso, altura, edad, genero, nivel_actividad, objetivo } =
    req.body;
  try {
    const planCalculado = calcularMacros(
      Number(peso),
      Number(altura),
      Number(edad),
      genero,
      nivel_actividad,
    );
    const updates = {
      updated_at: new Date(),
      weight_kg: Number(peso),
      height_cm: Number(altura),
      age: Number(edad),
      gender: genero,
      activity_level: nivel_actividad,
      goal: objetivo,
      target_macros: planCalculado,
    };
    const { data, error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", userId)
      .select()
      .single();
    if (error) throw error;
    res.json({ success: true, plan: planCalculado });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// 👇 LÓGICA CRÍTICA: CALCULAR FECHA Y GUARDAR
exports.suscribirse = async (req, res) => {
  const { userId } = req.body;
  try {
    console.log(`📝 Suscribiendo usuario: ${userId}`);

    // 1. Calcular fecha de vencimiento (Hoy + 1 Mes)
    const fechaHoy = new Date();
    const fechaVencimiento = new Date(fechaHoy);
    fechaVencimiento.setMonth(fechaVencimiento.getMonth() + 1);

    // 2. Guardar en DB
    const { data, error } = await supabase
      .from("profiles")
      .update({
        subscription_tier: "pro",
        subscription_status: "active",
        auto_renew: true,
        subscription_end_date: fechaVencimiento.toISOString(), // 👈 ESTO FALTABA
        updated_at: new Date(),
      })
      .eq("id", userId)
      .select();

    if (error) throw error;
    console.log(`✅ Usuario PRO hasta: ${fechaVencimiento.toISOString()}`);
    res.json({ success: true, data });
  } catch (error) {
    console.error("Error suscripción:", error);
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

// --- ADMIN ---
exports.getAllTickets = async (req, res) => {
  try {
    // Probamos con "support_tickets" pero simplificando el select para evitar fallos de relación
    const { data, error } = await supabase
      .from("support_tickets")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error específico de Supabase:", error);
      throw error;
    }

    res.json({ success: true, tickets: data });
  } catch (error) {
    console.error("Error en getAllTickets:", error.message);
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

// 👇 PEGA ESTO EN server/controllers/userController.js 👇

exports.updateProfile = async (req, res) => {
  const { userId, nombre, apellido } = req.body;

  if (!userId) return res.status(400).json({ error: "Falta User ID" });

  try {
    // Preparamos los datos a actualizar
    const updates = {
      nombre: nombre,
      updated_at: new Date(),
    };

    // Si envías apellido, descomenta esto o asegúrate de tener la columna en Supabase
    if (apellido) updates.apellido = apellido;

    const { data, error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", userId)
      .select();

    if (error) throw error;

    res.json({ success: true, data });
  } catch (error) {
    console.error("Error actualizando perfil:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.deleteUserAccount = async (req, res) => {
  const { userId } = req.params;
  try {
    const { data, error } = await supabase.auth.admin.deleteUser(userId);
    if (error) throw error;
    res.json({ success: true, message: "Cuenta eliminada" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.claimAdminRole = async (req, res) => {
  const { userId, secretKey } = req.body;

  // 1. Validar Clave Maestra
  const MASTER_KEY = process.env.ADMIN_SECRET_KEY;
  if (!secretKey || secretKey !== MASTER_KEY) {
    return res
      .status(403)
      .json({ success: false, error: "Clave incorrecta ⛔" });
  }

  try {
    // 2. INICIALIZAR EL SÚPER ADMIN (Service Role)
    // Esto es necesario para saltarse las reglas de seguridad (RLS) y editar el rol.
    const supabaseAdmin = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      },
    );

    // 3. Actualizar el perfil usando el Súper Admin
    const { data, error } = await supabaseAdmin
      .from("profiles")
      .update({ role: "admin" })
      .eq("id", userId)
      .select()
      .single();

    if (error) {
      console.error("Error Supabase:", error);
      throw error;
    }

    res.json({
      success: true,
      message: "¡Permisos de ADMIN activados! 👑",
      user: data,
    });
  } catch (error) {
    console.error("Error CRÍTICO en claimAdminRole:", error);
    res
      .status(500)
      .json({ success: false, error: "Error interno: " + error.message });
  }
};

// 1. Para que vos crees cupones (Admin)
exports.createCoupon = async (req, res) => {
  const { code, type, value, usage_limit, expires_at } = req.body;
  try {
    const { data, error } = await supabase
      .from("coupons")
      .insert([
        {
          code: code.toUpperCase(),
          type: type || "free_days",
          value,
          usage_limit: usage_limit || 100,
          expires_at,
        },
      ])
      .select();
    if (error) throw error;
    res.json({ success: true, coupon: data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// 2. Para que el usuario canjee (User)
exports.redeemCoupon = async (req, res) => {
  const { userId, couponCode } = req.body;
  try {
    const { data: coupon, error: couponError } = await supabase
      .from("coupons")
      .select("*")
      .eq("code", couponCode.toUpperCase())
      .single();

    if (couponError || !coupon)
      return res
        .status(404)
        .json({ success: false, error: "Cupón no válido ❌" });

    // Validaciones
    if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
      return res
        .status(400)
        .json({ success: false, error: "El cupón ha expirado ⏰" });
    }
    if (coupon.usage_count >= coupon.usage_limit) {
      return res
        .status(400)
        .json({ success: false, error: "Cupón agotado 🛑" });
    }

    // Verificar si el usuario ya lo usó
    const { data: alreadyUsed } = await supabase
      .from("coupon_usage")
      .select("*")
      .eq("coupon_id", coupon.id)
      .eq("user_id", userId)
      .single();

    if (alreadyUsed)
      return res
        .status(400)
        .json({ success: false, error: "Ya usaste este cupón ✋" });

    // Aplicar beneficio (Días Gratis)
    if (coupon.type === "free_days") {
      const fechaVencimiento = new Date();
      fechaVencimiento.setDate(fechaVencimiento.getDate() + coupon.value);

      await supabase
        .from("profiles")
        .update({
          subscription_tier: "pro",
          subscription_status: "active",
          subscription_end_date: fechaVencimiento.toISOString(),
          updated_at: new Date(),
        })
        .eq("id", userId);
    }

    // Registrar uso
    await supabase
      .from("coupon_usage")
      .insert([{ coupon_id: coupon.id, user_id: userId }]);
    await supabase
      .from("coupons")
      .update({ usage_count: coupon.usage_count + 1 })
      .eq("id", coupon.id);

    res.json({
      success: true,
      message: `¡Activado! +${coupon.value} días PRO 🚀`,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
