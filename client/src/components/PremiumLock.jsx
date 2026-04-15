import React, { useState } from 'react';

export default function PremiumLock({ type = "default", userId }) {
  const [loading, setLoading] = useState(false);

  const handleBtnClick = async () => {
    console.log("🖱️ Iniciando proceso de pago real para el usuario:", userId);
    
    if (!userId) {
      alert("Debes estar logueado para realizar esta acción.");
      return;
    }

    setLoading(true);

    try {
      // CORRECCIÓN 1: URL exacta de la Edge Function (v1/nombre-funcion)
      const urlEdgeFunction = "https://wmxfwlzbgdypyjdtffbp.supabase.co/functions/v1/mercadopago-webhook";
      
      const response = await fetch(urlEdgeFunction, {
        method: "POST",
        // CORRECCIÓN 2: No incluimos 'Authorization' aquí para evitar errores de CORS 
        // a menos que sea estrictamente necesario.
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: userId, 
          planPrice: 100, // Se envía 100 para la prueba
          planName: `NutriSport PRO - ${type.toUpperCase()}`,
          isActionCreatePreference: true 
        }),
      });

      // CORRECCIÓN 3: Validamos que la respuesta sea OK antes de parsear
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error en el servidor: ${errorText}`);
      }

      const data = await response.json();

      if (data.init_point) {
        window.location.href = data.init_point;
      } else {
        throw new Error("No se pudo generar el punto de inicio de pago");
      }

    } catch (error) {
      console.error("❌ Error en pasarela:", error);
      alert("Hubo un problema al conectar con la pasarela de pagos. Revisa la consola.");
    } finally {
      setLoading(false);
    }
  };

  // ... (El resto del código de contenido y renderizado se mantiene IGUAL)
  const content = {
    cocina: { icon: "👨‍🍳", title: "CHEF PERSONAL", description: "Desbloquea recetas inteligentes...", benefits: ["..."] },
    entreno: { icon: "💪", title: "ENTRENADOR", description: "Obtén rutinas...", benefits: ["..."] },
    tracker: { icon: "📊", title: "SEGUIMIENTO", description: "El control total...", benefits: ["..."] },
    default: { icon: "📋", title: "FALTA UN PASO", description: "Necesitamos conocer tus medidas...", benefits: ["..."] }
  };

  const current = content[type] || content.default;

  return (
    <div className="w-full max-w-2xl mx-auto bg-gray-900 text-white rounded-xl shadow-2xl border border-gray-800 p-8 md:p-10 flex flex-col items-center text-center relative overflow-hidden group animate-fade-in">
      <div className="absolute top-0 w-full h-1 bg-gradient-to-r from-transparent via-sportRed to-transparent opacity-50 pointer-events-none"></div>
      <div className="absolute -bottom-10 left-1/2 w-40 h-40 bg-sportRed/10 rounded-full blur-3xl -translate-x-1/2 pointer-events-none"></div>
      <div className="relative z-10 flex flex-col items-center w-full">
          <div className="bg-gray-800 p-3 rounded-full border border-gray-700 shadow-inner mb-6 text-2xl animate-bounce-slow">
            {loading ? "⏳" : "🔒"}
          </div>
          <h3 className="text-3xl md:text-5xl font-display font-bold uppercase italic tracking-wider text-white mb-2 leading-none">
              {current.title} <span className="text-sportRed">PRO</span>
          </h3>
          <p className="text-gray-400 text-sm font-medium max-w-md mb-8 leading-relaxed">
              {current.description}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 mb-8 text-left w-full max-w-sm">
              {current.benefits.map((benefit, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-sportRed font-bold text-lg">✓</span>
                    <span className="text-xs font-bold text-gray-300 uppercase tracking-widest">{benefit}</span>
                  </div>
              ))}
          </div>
          <div className="flex flex-col gap-2 w-full max-w-xs">
              <button 
                onClick={handleBtnClick}
                disabled={loading}
                className={`w-full ${loading ? 'bg-gray-700 opacity-50' : 'bg-sportRed hover:bg-red-700'} text-white py-3 rounded-sm uppercase font-bold text-base tracking-widest transition-all shadow-[0_0_15px_rgba(220,38,38,0.3)] active:scale-95 cursor-pointer transform ${!loading && 'hover:-translate-y-1'}`}
              >
                {loading ? "Procesando..." : "Desbloquear Ahora"}
              </button>
              <span className="text-[9px] text-gray-500 uppercase font-bold tracking-widest mt-1">
                Pago seguro vía Mercado Pago
              </span>
          </div>
      </div>
    </div>
  );
}