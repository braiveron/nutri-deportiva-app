const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const supabase = require("./config/supabaseClient"); // Conexión a Supabase
const { calcularMacros } = require("./utils/formulas"); // Tu cerebro matemático
const { generarReceta } = require("./utils/aiChef");

// Configuración de variables de entorno
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware (Puentes de comunicación)
app.use(cors()); // Permite que React hable con el servidor
app.use(express.json()); // Permite entender datos JSON entrantes

// --- RUTAS (ENDPOINTS) ---

// 1. Ruta de Salud (Para ver si el servidor vive)
app.get("/", (req, res) => {
  res.json({ mensaje: "¡Servidor Nutri Aéreo Activo y listo! 🚀" });
});

// 2. Ruta de Prueba de Base de Datos
app.get("/test-db", async (req, res) => {
  const { data, error } = await supabase.from("users").select("*");

  if (error) {
    return res.json({
      status: "Error de conexión o tabla no encontrada",
      detalle: error.message,
    });
  }

  res.json({ status: "Conexión perfecta a Supabase", data });
});

// 3. Ruta Principal: CALCULAR PLAN NUTRICIONAL
// Recibe: { peso, altura, edad, genero, nivel_actividad, user_email (opcional) }
app.post("/api/calcular-plan", async (req, res) => {
  const { user_email, peso, altura, edad, genero, nivel_actividad } = req.body;

  // Validación básica: Si faltan datos clave, devolvemos error
  if (!peso || !altura || !edad) {
    return res
      .status(400)
      .json({ error: "Faltan datos obligatorios (peso, altura o edad)" });
  }

  try {
    // A. Ejecutamos la fórmula matemática
    const resultadoNutricional = calcularMacros({
      peso,
      altura,
      edad,
      genero,
      nivel_actividad,
    });

    // B. (Opcional) Si nos mandan un email, guardamos el resultado en la BD
    if (user_email) {
      // 1. Buscamos si el usuario existe
      const { data: userData } = await supabase
        .from("users")
        .select("id")
        .eq("email", user_email)
        .single();

      if (userData) {
        // 2. Si existe, guardamos sus biométricos y el resultado
        await supabase.from("biometrics").insert({
          user_id: userData.id,
          weight_kg: peso,
          height_cm: altura,
          gender: genero,
          activity_level: nivel_actividad,
          target_macros: resultadoNutricional, // Guardamos el JSON completo del plan
        });
      }
    }

    // C. Respondemos al Frontend con el plan calculado
    res.json({
      mensaje: "Cálculo exitoso",
      plan: resultadoNutricional,
    });
  } catch (error) {
    console.error("Error en el cálculo:", error);
    res
      .status(500)
      .json({ error: "Hubo un error interno calculando los macros" });
  }
});

// RUTA NUEVA: Generador de Recetas con IA
app.post("/api/crear-receta", async (req, res) => {
  const { ingredientes, tipoComida, macrosObjetivo } = req.body;

  if (!ingredientes || ingredientes.length === 0) {
    return res.status(400).json({ error: "¡Faltan los ingredientes!" });
  }

  try {
    console.log("👨‍🍳 El Chef está cocinando con:", ingredientes);

    // Llamamos a Gemini
    const receta = await generarReceta(
      ingredientes,
      tipoComida,
      macrosObjetivo,
    );

    res.json({ exito: true, receta: receta });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Error generando la receta", detalle: error.message });
  }
});

// --- ARRANCAR SERVIDOR ---
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});
