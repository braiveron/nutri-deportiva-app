const supabaseAdmin = require("../config/supabaseAdmin");
const { generarReceta } = require("../utils/aiChef"); // Asegúrate de que la ruta sea correcta

const crearReceta = async (req, res) => {
  const { ingredientes, tipoComida, macrosObjetivo, userId } = req.body;

  if (!userId)
    return res.status(401).json({ error: "Usuario no identificado" });

  try {
    // 1. Validar PRO
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("subscription_tier")
      .eq("id", userId)
      .single();

    if (!profile || profile.subscription_tier !== "pro") {
      return res.status(403).json({ error: "REQUIERE PLAN PRO" });
    }

    // 2. Historial
    const { data: historial } = await supabaseAdmin
      .from("saved_recipes")
      .select("recipe_data")
      .eq("user_id", userId);

    const recetasEvitar = historial
      ? historial.map((r) => r.recipe_data.nombre_receta)
      : [];

    // 3. Generar
    const receta = await generarReceta(
      ingredientes,
      tipoComida,
      macrosObjetivo,
      recetasEvitar,
    );

    res.json({ exito: true, receta });
  } catch (error) {
    console.error("Error Chef:", error);
    res.status(500).json({ error: "Error generando receta" });
  }
};

module.exports = { crearReceta };
