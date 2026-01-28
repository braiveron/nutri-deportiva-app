import { supabase } from "../supabase";

// 1. Configuración de URL inteligente (Ya confirmamos que Vercel las lee bien)
const RAW_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const API_URL = RAW_URL.endsWith("/") ? RAW_URL.slice(0, -1) : RAW_URL;

// Debug para confirmar en consola
console.log("🚀 API conectada a:", API_URL);

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
      // Retornamos una estructura segura para evitar errores de 'undefined'
      return {
        existe: res.existe || false,
        datos: res.datos || null,
      };
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

  // --- IA GENERADORA ---
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

  deleteUserAccount: async (userId) => {
    const response = await fetch(`${API_URL}/user/delete/${userId}`, {
      method: "DELETE",
    });
    return await response.json();
  },

  // --- GESTIÓN DE CUENTA ---
  updateUserProfile: async (userId, { nombre, apellido }) => {
    const { error } = await supabase
      .from("profiles")
      .update({ nombre, apellido, updated_at: new Date() })
      .eq("id", userId);
    return { success: !error, error };
  },

  updateUserPassword: async (newPassword) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    return { success: !error, error };
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

  createSupportTicket: async (userId, subject, message) => {
    const response = await fetch(`${API_URL}/support/create`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, subject, message }),
    });
    return await response.json();
  },

  // --- ADMIN ---
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
