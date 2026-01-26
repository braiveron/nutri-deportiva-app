// paymentController.js - MODO SIMULACIÓN (DEV)

const createPreference = async (req, res) => {
  const { userId } = req.body;

  console.log(`⚡ SIMULANDO PAGO PARA USUARIO: ${userId}`);

  try {
    // En lugar de llamar a una API real, construimos la URL de "Éxito" directamente.
    // Esto simula lo que haría MercadoPago/Ualá al terminar de cobrar.

    // 👇 Esta URL hace que tu Frontend crea que el pago fue "approved"
    const successUrl = `http://localhost:5173/perfil?collection_status=approved&external_reference=${userId}&payment_type=simulated`;

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
