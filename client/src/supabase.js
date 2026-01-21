import { createClient } from "@supabase/supabase-js";

// REEMPLAZA ESTO CON TUS CLAVES DE SUPABASE (Settings -> API)
const supabaseUrl = "https://wmxfwlzbgdypyjdtffbp.supabase.co";
const supabaseKey = "sb_publishable_OTULBZFWxg-nQp1elSfpkA_b2L1RkO-";

export const supabase = createClient(supabaseUrl, supabaseKey);
