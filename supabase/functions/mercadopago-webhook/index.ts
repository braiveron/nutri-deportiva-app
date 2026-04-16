import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // LOG DE ENTRADA - Esto DEBE aparecer en Supabase
  console.log(`🔔 Petición recibida: ${req.method} a las ${new Date().toISOString()}`);
  // Manejo de seguridad (Preflight)
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  const mpAccessToken = Deno.env.get('MP_ACCESS_TOKEN') ?? ''
  const supabase = createClient(supabaseUrl, supabaseKey)

  try {
    const body = await req.json()
    console.log("📦 Body recibido:", JSON.stringify(body));

    // ACCIÓN: CREAR PREFERENCIA
    if (body.isActionCreatePreference) {
      console.log("Solicitud de pago para el usuario:", body.userId);

      const response = await fetch("https://api.mercadopago.com/checkout/preferences", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${mpAccessToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          items: [{
            title: body.planName || "NutriSport PRO",
            unit_price: 9990,
            quantity: 1,
            currency_id: "ARS"
          }],
          external_reference: body.userId,
          notification_url: "https://wmxfwlzbgdypyjdtffbp.supabase.co/functions/v1/mercadopago-webhook",
          back_urls: {
            success: "https://nutri-deportiva-app.vercel.app/perfil",
            failure: "https://nutri-deportiva-app.vercel.app/perfil"
          },
          auto_return: "approved"
        })
      })

      const preference = await response.json()
      
      return new Response(JSON.stringify({ init_point: preference.init_point }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      })
    }

    // WEBHOOK: PAGO APROBADO
    if (body.type === 'payment') {
      const paymentId = body.data.id
      const res = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
        headers: { Authorization: `Bearer ${mpAccessToken}` }
      })
      const paymentData = await res.json()

      if (paymentData.status === 'approved') {
        const userId = paymentData.external_reference 
        const expiresAt = new Date()
        expiresAt.setMonth(expiresAt.getMonth() + 1)
        
        const { error } = await supabase
          .from('profiles')
          .update({ 
            subscription_tier: 'pro',
            subscription_status: 'active',
            auto_renew: true,
            subscription_end_date: expiresAt.toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', userId)

        if (error) throw error
        console.log("Base de datos actualizada para el usuario:", userId);
      }
    }

    return new Response(JSON.stringify({ received: true }), { 
      status: 200, 
      headers: { ...corsHeaders, "Content-Type": "application/json" } 
    })

  } catch (err) {
    console.error("Error crítico:", err.message);
    return new Response(JSON.stringify({ error: err.message }), { 
      status: 400, 
      headers: { ...corsHeaders, "Content-Type": "application/json" } 
    })
  }
})