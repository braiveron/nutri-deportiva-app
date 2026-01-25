const supabaseAdmin = require("../config/supabaseAdmin");
const { generarRutina } = require("../utils/aiTrainer");

const crearEntreno = async (req, res) => {
  const { userId, objetivo, dias } = req.body;
  if (!userId) return res.status(400).json({ error: "Falta User ID" });

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

    // 2. Datos
    const { data: bio } = await supabaseAdmin
      .from("biometrics")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (!bio) return res.status(400).json({ error: "Perfil incompleto" });

    // 3. Generar
    const objetivoFinal = objetivo || bio.goal;
    const diasFinales = dias || "4";

    const perfilParaIA = {
      edad: bio.age,
      genero: bio.gender,
      objetivo: objetivoFinal,
      nivel_actividad: bio.activity_level,
      dias: diasFinales,
    };

    const rutina = await generarRutina(perfilParaIA);
    if (!rutina) throw new Error("Fallo IA");

    rutina.objetivo_origen = objetivoFinal;
    rutina.dias_origen = diasFinales;

    // 4. Guardar
    await supabaseAdmin
      .from("biometrics")
      .update({ workout_plan: rutina })
      .eq("id", bio.id);

    res.json({ exito: true, rutina });
  } catch (error) {
    console.error("Error Trainer:", error);
    res.status(500).json({ error: "Error generando entreno" });
  }
};

module.exports = { crearEntreno };
