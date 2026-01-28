// 👇 1. IMPORTANTE: Importamos el cliente de Supabase aquí
import { supabase } from "../supabase";

// ⚠️ Ajusta el puerto si tu servidor no corre en el 5000
const API_URL = "http://localhost:5000/api";

// 👇 Función auxiliar para obtener la fecha local "YYYY-MM-DD"
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
      if (!response.ok) throw new Error("Error al obtener datos");
      return await response.json();
    } catch (error) {
      console.error(error);
      return { existe: false };
    }
  },

  calculatePlan: async (formData) => {
    const response = await fetch(`${API_URL}/calcular-plan`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });
    return await response.json();
  },

  // --- PAGOS Y SUSCRIPCIÓN ---
  createPaymentPreference: async (userId) => {
    const response = await fetch(`${API_URL}/crear-pago`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    if (!response.ok) throw new Error("Error al conectar con MercadoPago");
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

  // --- IA GENERADORA (Recetas y Entrenos) ---
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
    const payload = {
      ...logData,
      date: logData.date || getLocalDate(),
    };

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

  // --- GESTIÓN DE CUENTA (Supabase Directo) ---

  // 1. Actualizar Datos Personales (Tabla profiles)
  updateUserProfile: async (userId, { nombre, apellido }) => {
    const updates = {
      nombre, // Asegúrate que tu tabla 'profiles' tenga esta columna
      apellido, // Asegúrate que tu tabla 'profiles' tenga esta columna
      updated_at: new Date(),
    };

    // Ahora 'supabase' ya está definido gracias al import del principio
    const { error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", userId);

    return { success: !error, error };
  },

  // 2. Cambiar Contraseña (Supabase Auth)
  updateUserPassword: async (newPassword) => {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });
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
