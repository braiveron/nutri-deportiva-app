// ⚠️ Ajusta el puerto si tu servidor no corre en el 5000
const API_URL = "http://localhost:5000/api";

// 👇 Función auxiliar para obtener la fecha local "YYYY-MM-DD"
// Esto evita que el día se reinicie antes de tiempo (por diferencia horaria con el servidor)
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

  // --- TRACKER DIARIO (CORREGIDO PARA USAR FECHA LOCAL) ---

  getDailyLogs: async (userId) => {
    const dateStr = getLocalDate(); // Calculamos fecha hoy local
    // Enviamos la fecha como parámetro ?date=2026-01-27
    const response = await fetch(
      `${API_URL}/tracker/${userId}?date=${dateStr}`,
    );
    return await response.json();
  },

  addDailyLog: async (logData) => {
    // Inyectamos la fecha local si no viene en el objeto logData
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
};
