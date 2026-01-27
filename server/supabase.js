// 📂 Archivo: server/supabase.js
require("dotenv").config();
const { createClient } = require("@supabase/supabase-js");

// Buscamos las credenciales en tu archivo .env
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY; // O SUPABASE_ANON_KEY, según como lo hayas llamado

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    "❌ Faltan las variables SUPABASE_URL o SUPABASE_KEY en el archivo .env",
  );
}

// Creamos el cliente
const supabase = createClient(supabaseUrl, supabaseKey);

// Lo exportamos para usarlo en los controladores
module.exports = { supabase };
