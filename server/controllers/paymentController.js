// paymentController.js - MODO SIMULACIÓN (CORREGIDO)

const createPreference = async (req, res) => {
  const { userId } = req.body;

  console.log(`⚡ SIMULANDO PAGO PARA USUARIO: ${userId}`);

  try {
    // 👇 1. LÓGICA DE URL INTELIGENTE
    // Si estamos en Producción (Render), usamos Vercel.
    // Si estamos en Desarrollo (Tu PC), usamos Localhost.

    // NOTA: Asegúrate de que esta URL sea EXACTAMENTE la de tu Vercel
    const CLIENT_URL =
      process.env.NODE_ENV === "production"
        ? "https://nutri-deportiva-app.vercel.app" // ⚠️ CONFIRMA QUE ESTE SEA TU LINK
        : "http://localhost:5173";

    // 👇 2. CONSTRUIMOS LA URL USANDO LA VARIABLE
    const successUrl = `${CLIENT_URL}/perfil?collection_status=approved&external_reference=${userId}&payment_type=simulated`;

    console.log(`↪️ Redirigiendo cliente a: ${CLIENT_URL}`);

    // Retardamos 1 segundo para que se sienta "real" el loading del botón
    setTimeout(() => {
      res.json({ init_point: successUrl });
    }, 1000);
  } catch (error) {
    console.error("Error en simulación:", error);
    res.status(500).json({ error: "Error al simular cobro" });
  }
};

module.exports = { createPreference };
