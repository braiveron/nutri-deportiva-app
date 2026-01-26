// 📂 Archivo: src/services/api.js (FRONTEND - REACT)

// Ajusta esto si tu servidor corre en otro puerto, pero suele ser 5000 o 3000
const API_URL = "http://localhost:5000/api";

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

  // --- IA ---
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
};
