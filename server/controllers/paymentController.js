const { MercadoPagoConfig, Preference } = require("mercadopago");

// 👇 CONFIGURA TU ACCESS TOKEN AQUÍ (o mejor, usa process.env.MP_ACCESS_TOKEN)
// Este token lo sacas de: https://www.mercadopago.com.ar/developers/panel
const client = new MercadoPagoConfig({
  accessToken: "TEST-TU_ACCESS_TOKEN_AQUI",
});

const createPreference = async (req, res) => {
  const { userId } = req.body;

  try {
    const preference = new Preference(client);

    const result = await preference.create({
      body: {
        items: [
          {
            id: "plan-pro-mensual",
            title: "Suscripción PRO - NutriSport",
            description: "Acceso total a recetas y entrenamientos ilimitados",
            quantity: 1,
            unit_price: 4990, // Precio en Pesos Argentinos (ARS)
            currency_id: "ARS",
          },
        ],
        // 👇 IMPORTANTE: MercadoPago necesita saber a dónde volver
        back_urls: {
          success: "http://localhost:5173/perfil", // Cambia al puerto de tu frontend
          failure: "http://localhost:5173/",
          pending: "http://localhost:5173/",
        },
        auto_return: "approved",
        external_reference: userId, // Guardamos el ID del usuario para saber quién pagó
        statement_descriptor: "NUTRISPORT PRO",
      },
    });

    // Devolvemos el init_point (el link de pago)
    res.json({ init_point: result.init_point });
  } catch (error) {
    console.error("Error Mercado Pago:", error);
    res.status(500).json({ error: "Error al crear preferencia de pago" });
  }
};

module.exports = { createPreference };
