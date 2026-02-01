const createPreference = async (req, res) => {
  const { userId } = req.body;

  console.log(`⚡ SIMULANDO PAGO PARA USUARIO: ${userId}`);

  try {
    // IMPORTANTE: Asegúrate de que esta URL sea la correcta para tu entorno
    const CLIENT_URL =
      process.env.NODE_ENV === "production"
        ? "https://nutri-deportiva-app.vercel.app"
        : "http://localhost:5173";

    // Enviamos a /perfil con los parámetros que useAppLogic espera
    const successUrl = `${CLIENT_URL}/perfil?collection_status=approved&external_reference=${userId}&payment_type=simulated`;

    console.log(`↪️ Redirigiendo cliente a: ${successUrl}`);

    setTimeout(() => {
      res.json({ init_point: successUrl });
    }, 1000);
  } catch (error) {
    console.error("Error en simulación:", error);
    res.status(500).json({ error: "Error al simular cobro" });
  }
};

module.exports = { createPreference };
