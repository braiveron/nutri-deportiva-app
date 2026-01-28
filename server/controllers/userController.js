require("dotenv").config();

const { createClient } = require("@supabase/supabase-js");

// INICIALIZACIÓN CON PERMISOS DE ADMIN (Service Role)
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

// --- FUNCIONES DEL USUARIO ---

// 1. OBTENER PLAN / PERFIL
exports.obtenerPlan = async (req, res) => {
  const { userId } = req.params;

  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) throw error;
    const datos = data.datos_biometricos || data.user_metadata || {};
    res.json({ existe: true, datos: { ...datos, ...data } });
  } catch (error) {
    res.json({ existe: false, error: "Perfil no encontrado" });
  }
};

// 2. GUARDAR / CALCULAR PLAN
exports.calcularPlan = async (req, res) => {
  const { userId, ...formData } = req.body;
  try {
    const updates = { updated_at: new Date(), datos_biometricos: formData };
    const { data, error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", userId)
      .select();
    if (error) throw error;
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// 3. SUSCRIBIRSE
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

// 4. CANCELAR SUSCRIPCIÓN
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

// 5. CREAR TICKET DE SOPORTE
exports.createSupportTicket = async (req, res) => {
  const { userId, subject, message } = req.body;
  if (!userId || !message)
    return res.status(400).json({ success: false, error: "Datos incompletos" });
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

// 6. ADMIN: OBTENER TODOS LOS TICKETS
exports.getAllTickets = async (req, res) => {
  try {
    // Usamos el comodín (*) para traer todo del perfil y evitar errores de nombres de columna
    const { data, error } = await supabase
      .from("support_tickets")
      .select(`*, profiles (*)`)
      .order("created_at", { ascending: false });

    if (error) throw error;

    const ticketsLimpios = data.map((ticket) => {
      const p = ticket.profiles || {};
      // Buscamos cualquier variante de nombre que exista
      const nombreReal =
        p.nombre || p.first_name || p.full_name || p.name || "Usuario";
      const apellidoReal = p.apellido || p.last_name || "";
      const emailReal = p.email || "Email oculto";

      return {
        ...ticket,
        profiles: {
          email: emailReal,
          nombre: nombreReal,
          apellido: apellidoReal,
        },
      };
    });

    res.json({ success: true, tickets: ticketsLimpios });
  } catch (error) {
    console.error("Error Admin:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// 7. ADMIN: RESOLVER TICKET
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

// 👇👇 8. ELIMINAR CUENTA (LA SOLUCIÓN DEFINITIVA) 👇👇
exports.deleteUserAccount = async (req, res) => {
  const { userId } = req.body;

  try {
    console.log(`🗑️ Eliminando usuario definitivamente: ${userId}`);

    // 1. Borrar del sistema de Autenticación (Esto es lo que faltaba)
    // Al usar service_role, tenemos permiso para borrar usuarios de Auth.
    const { error: authError } = await supabase.auth.admin.deleteUser(userId);

    if (authError) throw authError;

    // 2. (Opcional) Borrar perfil manualmente si no tienes CASCADE en SQL
    // Pero el paso 1 es el más importante.
    await supabase.from("profiles").delete().eq("id", userId);

    res.json({
      success: true,
      message: "Cuenta eliminada de la faz de la tierra.",
    });
  } catch (error) {
    console.error("Error eliminando cuenta:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};
