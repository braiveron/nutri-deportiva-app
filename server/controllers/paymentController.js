const { MercadoPagoConfig, Preference } = require("mercadopago");

const createPreference = async (req, res) => {
  const token = process.env.MP_ACCESS_TOKEN?.trim().replace(/['"]+/g, "");

  if (!token) {
    console.error("❌ ERROR: No se encontró el MP_ACCESS_TOKEN.");
    return res.status(500).json({ error: "Falta token de configuración." });
  }

  const client = new MercadoPagoConfig({ accessToken: token });

  const {
    userId,
    planPrice = 5000,
    planName = "Plan NutriSport Premium",
  } = req.body;

  try {
    // FORZAMOS LA URL DE VERCEL PARA LA PRUEBA DE REDIRECCIÓN
    const PRODUCTION_URL = "https://nutri-deportiva-app.vercel.app";

    const preference = new Preference(client);

    const result = await preference.create({
      body: {
        items: [
          {
            id: "membership-30",
            title: planName,
            quantity: 1,
            unit_price: Number(planPrice),
            currency_id: "ARS",
          },
        ],
        back_urls: {
          success: `${PRODUCTION_URL}/perfil`,
          failure: `${PRODUCTION_URL}/perfil`,
          pending: `${PRODUCTION_URL}/perfil`,
        },
        // Al ser una URL HTTPS (Vercel), esto NO debería dar error 400
        auto_return: "approved",
        binary_mode: true,
        metadata: {
          user_id: userId,
        },
        external_reference: userId,
      },
    });

    console.log(`✅ Preferencia Creada con éxito (Ruta Vercel): ${result.id}`);
    res.json({ init_point: result.init_point });
  } catch (error) {
    console.error("❌ Error Detallado de Mercado Pago:");
    if (error.response) {
      console.error("Data:", JSON.stringify(error.response.data, null, 2));
    } else {
      console.error(error);
    }
    res.status(500).json({ error: "Error interno en la pasarela" });
  }
};

module.exports = { createPreference };
