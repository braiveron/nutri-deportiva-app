import React, { useState } from 'react';
import CouponRedeemer from "./CouponRedeemer";

export default function PremiumLock({ type = "default", userId, onUnlock }) {
  const [loading, setLoading] = useState(false);
  const [showCouponModal, setShowCouponModal] = useState(false); // 👈 Cambiado a Modal

  const handleBtnClick = async () => {
    console.log("🖱️ Iniciando proceso de pago real para el usuario:", userId);
    if (!userId) { alert("Debes estar logueado..."); return; }
    setLoading(true);
    try {
      const urlEdgeFunction = "https://wmxfwlzbgdypyjdtffbp.supabase.co/functions/v1/mercadopago-webhook";
      const response = await fetch(urlEdgeFunction, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: userId, 
          planPrice: 9990, 
          planName: `NutriSport PRO - ${type.toUpperCase()}`,
          isActionCreatePreference: true 
        }),
      });
      if (!response.ok) throw new Error("Error en el servidor");
      const data = await response.json();
      if (data.init_point) window.location.href = data.init_point;
    } catch (error) {
      console.error("❌ Error en pasarela:", error);
      alert("Hubo un problema...");
    } finally { setLoading(false); }
  };

  const content = {
    cocina: { icon: "👨‍🍳", title: "CHEF PERSONAL", description: "Desbloquea recetas inteligentes basadas en tus macros y objetivos.", benefits: ["Recetas Personalizadas", "Lista de ingredientes", "Análisis Nutricional", "Tips de Preparacion"] },
    entreno: { icon: "💪", title: "ENTRENADOR", description: "Obtén rutinas dinámicas que se adaptan a tu progreso y equipo disponible.", benefits: ["Rutinas de Fuerza", "Ajuste segun tu equipo", "Plan de Carga", "Progreso Semanal"] },
    tracker: { icon: "📊", title: "SEGUIMIENTO", description: "El control total de tu evolución con gráficos detallados y predicciones.", benefits: ["Gráficos de Progreso", "Historial Completo", "Exportar Datos", "Metas Mensuales"] },
    default: { icon: "📋", title: "FALTA UN PASO", description: "Necesitamos conocer tus medidas y objetivos para activar tu plan.", benefits: ["Evaluación Inicial", "Cálculo de Macros", "Perfil Completo", "Objetivo Fitness"] }
  };

  const current = content[type] || content.default;

  return (
    <div className="w-full max-w-2xl mx-auto bg-gray-900 text-white rounded-xl shadow-2xl border border-gray-800 p-8 md:p-10 flex flex-col items-center text-center relative overflow-hidden group animate-fade-in">
      
      <div className="absolute top-0 w-full h-1 bg-gradient-to-r from-transparent via-sportRed to-transparent opacity-50 pointer-events-none"></div>
      
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
                className={`w-full ${loading ? 'bg-gray-700 opacity-50' : 'bg-sportRed hover:bg-red-700'} text-white py-4 rounded-sm uppercase font-black text-base tracking-widest transition-all shadow-[0_0_15px_rgba(220,38,38,0.3)] active:scale-95 cursor-pointer transform ${!loading && 'hover:-translate-y-1'}`}
              >
                {loading ? "Procesando..." : "Desbloquear por $9.990"}
              </button>

              <div className="mt-4 w-full">
                <button 
                  onClick={() => setShowCouponModal(true)}
                  className="text-[10px] text-gray-500 hover:text-gray-300 uppercase font-bold tracking-[0.2em] transition-colors"
                >
                  ¿Tenés un código promocional?
                </button>
              </div>

              <span className="text-[9px] text-gray-500 uppercase font-bold tracking-[0.2em] mt-4">
                Pago único mensual • Seguro vía Mercado Pago
              </span>
          </div>
      </div>

      {/* --- MODAL DE CUPÓN --- */}
      {showCouponModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div 
            className="bg-gray-900 border border-gray-800 rounded-lg p-8 w-full max-w-md shadow-[0_0_50px_rgba(0,0,0,0.5)] relative animate-zoom-in"
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              onClick={() => setShowCouponModal(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors text-2xl"
            >
              &times;
            </button>

            <div className="text-center mb-6">
              <h4 className="text-xl font-display font-bold uppercase italic text-white tracking-widest">
                Canjear <span className="text-sportRed">Código</span>
              </h4>
              <p className="text-gray-400 text-xs mt-2 uppercase tracking-tighter">
                Ingresá tu cupón para activar el acceso PRO
              </p>
            </div>

            <CouponRedeemer 
              userId={userId} 
              onUpdate={() => {
                setShowCouponModal(false);
                onUnlock();
              }}
              variant="dark"
            />
            
            <button 
              onClick={() => setShowCouponModal(false)}
              className="w-full mt-4 text-[10px] text-gray-500 hover:text-sportRed uppercase font-bold tracking-widest transition-colors"
            >
              Volver atrás
            </button>
          </div>
        </div>
      )}
    </div>
  );
}