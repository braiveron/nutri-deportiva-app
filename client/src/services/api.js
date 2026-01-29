import { supabase } from "../supabase";

// 1. LÓGICA DE URL INTELIGENTE
// Detecta si estamos en producción (Vercel) o desarrollo (Localhost)
const API_URL =
  import.meta.env.MODE === "production"
    ? "https://nutri-app-t8j9.onrender.com/api"
    : "http://localhost:5000/api";

// Log para confirmar la conexión en la consola (F12)
console.log("🌐 API activa en:", API_URL);

const getLocalDate = () => {
  const date = new Date();
  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offset * 60 * 1000);
  return localDate.toISOString().split("T")[0];
};

export const api = {
  // --- BIOMETRÍA ---
  getBiometrics: async (userId) => {
    try {
      const response = await fetch(`${API_URL}/mi-plan/${userId}`);
      if (!response.ok) return { existe: false, datos: null };
      const res = await response.json();
      return { existe: res.existe || false, datos: res.datos || null };
    } catch (error) {
      console.error("Error en getBiometrics:", error);
      return { existe: false, datos: null };
    }
  },

  calculatePlan: async (formData) => {
    try {
      const response = await fetch(`${API_URL}/calcular-plan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (!response.ok) throw new Error("Error en el servidor");
      return await response.json();
    } catch (error) {
      console.error("Error en calculatePlan:", error);
      throw error;
    }
  },

  // --- PAGOS Y SUSCRIPCIÓN ---
  createPaymentPreference: async (userId) => {
    const response = await fetch(`${API_URL}/crear-pago`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    if (!response.ok) throw new Error("Error en MercadoPago");
    return await response.json();
  },

  subscribeUser: async (userId) => {
    const response = await fetch(`${API_URL}/suscribirse`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    return await response.json();
  },

  cancelSubscription: async (userId) => {
    const response = await fetch(`${API_URL}/cancelar-suscripcion`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    return await response.json();
  },

  // --- IA GENERADORA (Chef y Entrenador) ---
  createRecipe: async (userParams) => {
    const response = await fetch(`${API_URL}/crear-receta`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userParams),
    });
    return await response.json();
  },

  createWorkout: async (userParams) => {
    const response = await fetch(`${API_URL}/crear-entreno`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userParams),
    });
    return await response.json();
  },

  // --- TRACKER DIARIO ---
  getDailyLogs: async (userId) => {
    const dateStr = getLocalDate();
    const response = await fetch(
      `${API_URL}/tracker/${userId}?date=${dateStr}`,
    );
    return await response.json();
  },

  addDailyLog: async (logData) => {
    const payload = { ...logData, date: logData.date || getLocalDate() };
    const response = await fetch(`${API_URL}/tracker/add`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return await response.json();
  },

  analyzeFood: async (text) => {
    const response = await fetch(`${API_URL}/tracker/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    return await response.json();
  },

  deleteDailyLog: async (logId) => {
    const response = await fetch(`${API_URL}/tracker/${logId}`, {
      method: "DELETE",
    });
    return await response.json();
  },

  // --- GESTIÓN DE CUENTA ---
  updateUserProfile: async (userId, { nombre, apellido }) => {
    const fullName = `${nombre} ${apellido}`.trim();

    // 1. Actualizamos la tabla de base de datos
    const { error: dbError } = await supabase
      .from("profiles")
      .update({ nombre, apellido, updated_at: new Date() })
      .eq("id", userId);

    if (dbError) return { success: false, error: dbError };

    // 2. Actualizamos los metadatos de la sesión
    const { error: authError } = await supabase.auth.updateUser({
      data: { full_name: fullName },
    });

    return { success: !authError, error: authError };
  },

  updateUserPassword: async (newPassword) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    return { success: !error, error };
  },

  deleteUserAccount: async (userId) => {
    // 🔥 CORREGIDO: Usamos la variable API_URL en lugar de localhost fijo
    const url = `${API_URL}/user/delete/${userId}`;
    console.log("🛠️ Intentando borrar en:", url);

    try {
      const response = await fetch(url, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error server: ${response.status} - ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error("❌ El error está acá:", error.message);
      return { success: false, error: error.message };
    }
  },

  // --- PESO CORPORAL ---
  addWeightLog: async (userId, weight, date) => {
    const response = await fetch(`${API_URL}/weight/add`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, weight, date }),
    });
    return await response.json();
  },

  getWeightHistory: async (userId) => {
    const response = await fetch(`${API_URL}/weight/${userId}`);
    return await response.json();
  },

  // --- SOPORTE Y ADMIN ---
  createSupportTicket: async (userId, subject, message) => {
    const response = await fetch(`${API_URL}/support/create`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, subject, message }),
    });
    return await response.json();
  },

  getAllTickets: async () => {
    const response = await fetch(`${API_URL}/admin/tickets`);
    return await response.json();
  },

  resolveTicket: async (ticketId) => {
    const response = await fetch(`${API_URL}/admin/resolve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ticketId }),
    });
    return await response.json();
  },
};
