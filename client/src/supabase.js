import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

// ESCUCHA DE EVENTOS DE AUTH (Crucial para evitar el error 400 persistente)
supabase.auth.onAuthStateChange((event) => {
  if (event === "TOKEN_REFRESHED") {
    console.log("Sesión renovada correctamente");
  }

  if (event === "SIGNED_OUT") {
    // Limpia cualquier residuo en caso de error crítico de token
    localStorage.removeItem(
      "sb-" + new URL(supabaseUrl).hostname.split(".")[0] + "-auth-token",
    );
  }
});
