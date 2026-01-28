// server/config/supabaseClient.js
const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ ERROR: Faltan variables de Supabase en el Backend.");
}

const supabase = createClient(supabaseUrl, supabaseKey);
module.exports = supabase;
