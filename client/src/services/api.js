const API_URL = "http://localhost:5000/api";

// ⚠️ Asegúrate de que diga "export const api" (NO export default)
export const api = {
  // 1. Obtener Datos Biométricos
  getBiometrics: async (userId) => {
    try {
      const response = await fetch(`${API_URL}/mi-plan/${userId}`);
      return await response.json();
    } catch (error) {
      console.error("Error API getBiometrics:", error);
      throw error;
    }
  },

  // 2. Calcular Plan (ESTA NOS FALTABA)
  calculatePlan: async (data) => {
    try {
      const response = await fetch(`${API_URL}/calcular-plan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      return await response.json();
    } catch (error) {
      console.error("Error API calculatePlan:", error);
      throw error;
    }
  },

  // 3. Suscribirse
  subscribeUser: async (userId) => {
    try {
      const response = await fetch(`${API_URL}/suscribirse`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      return await response.json();
    } catch (error) {
      console.error("Error API subscribeUser:", error);
      throw error;
    }
  },

  // 4. Cancelar Suscripción
  cancelSubscription: async (userId) => {
    try {
      const response = await fetch(`${API_URL}/cancelar-suscripcion`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      return await response.json();
    } catch (error) {
      console.error("Error API cancelSubscription:", error);
      throw error;
    }
  },
};
