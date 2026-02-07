import { supabase } from "../supabase";

// 🌐 LÓGICA DE DETECCIÓN DE ENTORNO
const isLocal =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1";

const API_URL = isLocal
  ? "http://localhost:5000/api"
  : "https://nutri-app-t8j9.onrender.com/api";

console.log("🌍 Entorno:", isLocal ? "LOCAL" : "PRODUCCIÓN");

// Función auxiliar para fechas (para evitar problemas de zona horaria)
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

  // --- GESTIÓN DE CUENTA ---

  // 👇 ESTA ES LA FUNCIÓN CORREGIDA
  // Se conecta al endpoint /user/update que creamos en el backend
  updateUserProfile: async (userId, userData) => {
    try {
      const response = await fetch(`${API_URL}/user/update`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          nombre: userData.nombre,
          apellido: userData.apellido,
        }),
      });
      return await response.json();
    } catch (error) {
      console.error("Error updating profile:", error);
      return { success: false, error: "Error de conexión" };
    }
  },

  updateUserPassword: async (newPassword) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    return { success: !error, error };
  },

  deleteUserAccount: async (userId) => {
    const url = `${API_URL}/user/delete/${userId}`;
    try {
      const response = await fetch(url, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error server: ${response.status} - ${errorText}`);
      }
      return await response.json();
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // --- IA GENERADORA (RECETAS Y ENTRENO) ---
  createRecipe: async (userParams) => {
    try {
      const response = await fetch(`${API_URL}/crear-receta`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userParams),
      });
      return await response.json();
    } catch (error) {
      console.error("Error creating recipe:", error);
      return { receta: null };
    }
  },

  createWorkout: async (userParams) => {
    // 1. Limpieza de datos
    const diasNumber = parseInt(userParams.dias || userParams.days || 4);

    // 2. UNIFICACIÓN: Enviamos en ESPAÑOL
    const payload = {
      userId: userParams.userId,
      objetivo: userParams.objetivo || userParams.goal,
      dias: diasNumber,
      nivel: userParams.nivel || "intermedio",
      peso: userParams.peso ? Number(userParams.peso) : undefined,
      altura: userParams.altura ? Number(userParams.altura) : undefined,
      edad: userParams.edad ? Number(userParams.edad) : undefined,
    };

    console.log("🚀 [API] Enviando datos al Backend:", payload);

    try {
      const response = await fetch(`${API_URL}/crear-entreno`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        const errorMessage = errorData?.error || `Error ${response.status}`;
        console.error("❌ [API] Error del Backend:", errorMessage);
        return { exito: false, error: errorMessage };
      }

      const data = await response.json();
      return { exito: true, rutina: data.rutina || data };
    } catch (error) {
      console.error("❌ Error de Red:", error);
      return { exito: false, error: "Error de conexión." };
    }
  },

  // --- PAGOS ---
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

  // --- TRACKER & OTROS ---
  getDailyLogs: async (userId) => {
    const dateStr = getLocalDate();
    const response = await fetch(
      `${API_URL}/tracker/${userId}?date=${dateStr}`,
    );
    return await response.json();
  },

  // 👇 ESTA ES LA FUNCIÓN ORIGINAL (La usa tu Tracker Diario)
  addDailyLog: async (logData) => {
    const payload = { ...logData, date: logData.date || getLocalDate() };
    const response = await fetch(`${API_URL}/tracker/add`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return await response.json();
  },

  // 👇 ESTA ES LA NUEVA FUNCIÓN (La usa el Chef para agregar recetas)
  addLog: async (logData) => {
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

  sendChatMessage: async (userId, message) => {
    try {
      const response = await fetch(`${API_URL}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, message }),
      });
      return await response.json();
    } catch (error) {
      console.error("Error en Chatbot:", error);
      return { success: false, reply: "Error de conexión. Intenta luego." };
    }
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
