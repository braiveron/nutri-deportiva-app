const Groq = require("groq-sdk");
const supabaseAdmin = require("../config/supabaseAdmin");

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

exports.chatWithAI = async (req, res) => {
  const { userId, message } = req.body;

  if (!userId || !message) {
    return res.status(400).json({ error: "Faltan datos" });
  }

  try {
    // 1. OBTENER PERFIL
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("nombre, weight_kg, height_cm, subscription_tier")
      .eq("id", userId)
      .single();

    // 2. OBTENER BIOMETRÍA
    const { data: bio } = await supabaseAdmin
      .from("biometrics")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const pesoFinal = bio?.weight_kg || profile?.weight_kg || "No especificado";
    const alturaFinal =
      bio?.height_cm || profile?.height_cm || "No especificada";
    const objetivoFinal = bio?.goal || "Estar saludable";

    // 👇 DETERMINAR SI ES PRO
    const esPro =
      profile?.subscription_tier === "pro" ||
      profile?.subscription_tier === "admin";
    const tipoUsuario = esPro ? "MIEMBRO PRO (VIP)" : "USUARIO GRATUITO";

    const userContext = `
      DATOS: Nombre: ${profile?.nombre || "Atleta"}, Tipo: ${tipoUsuario}, Objetivo: ${objetivoFinal}, Peso: ${pesoFinal}kg.
    `;

    // 👇 ESTA ES LA REGLA DE ORO PARA TODOS (PRO Y FREE)
    // El Chatbot NUNCA debe generar la rutina en texto, siempre debe mandar el link.
    const protocoloRedireccion = `
        PROTOCOLO DE REDIRECCIÓN (OBLIGATORIO PARA TODOS):
        1. Si el usuario pide una RUTINA, PLAN DE ENTRENAMIENTO o EJERCICIOS (completo):
           NO generes la rutina en el chat. Dile con entusiasmo que vaya a la sección de Entrenamiento de la app y añade EXACTAMENTE al final: "[[LINK:/entrenamiento]]".
           
        2. Si el usuario pide una DIETA, MENÚ SEMANAL o RECETAS (completo):
           NO generes el menú en el chat. Dile que use nuestra Cocina Inteligente y añade EXACTAMENTE al final: "[[LINK:/cocina]]".

        Ejemplo respuesta: "¡Excelente iniciativa! Para eso tenemos nuestro generador especializado. Ve a la sección de entrenamiento: [[LINK:/entrenamiento]]"
    `;

    // 5. INSTRUCCIONES SEGÚN EL ROL
    let reglasDeNegocio = "";

    if (esPro) {
      // --- PRO: Respuestas detalladas a dudas, pero redirige planes ---
      reglasDeNegocio = `
        - Eres un entrenador personal de ÉLITE hablando con un cliente VIP.
        - ${protocoloRedireccion}
        - Si el usuario hace preguntas puntuales (ej: "¿Cómo hacer sentadilla?", "¿Qué es el ayuno?"), responde con MÁXIMO detalle técnico y profesionalismo.
        `;
    } else {
      // --- FREE: Respuestas básicas a dudas y redirige planes ---
      reglasDeNegocio = `
        - Eres un asistente básico hablando con un usuario gratuito.
        - ${protocoloRedireccion}
        - Si el usuario hace preguntas puntuales, responde de forma breve y educativa.
        `;
    }

    const systemPrompt = `
      Eres "Nutri-Coach", IA de NutriApp.
      ${userContext}
      
      INSTRUCCIONES:
      ${reglasDeNegocio}

      REGLAS GLOBALES:
      1. Solo temas de fitness/nutrición.
      2. Sé amable, motivador y usa emojis 🍎💪.
      3. Responde siempre en Español.
    `;

    const completion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message },
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.5,
      max_tokens: 600,
    });

    res.json({ success: true, reply: completion.choices[0].message.content });
  } catch (error) {
    console.error("❌ Error Chatbot:", error);
    res.status(500).json({ error: "Error interno." });
  }
};
