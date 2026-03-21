import React, { useState } from 'react';

// Aceptamos userId como prop para identificar quién realiza el pago
export default function PremiumLock({ onUnlock, type = "default", userId }) {
  const [loading, setLoading] = useState(false);

  const handleBtnClick = async () => {
    console.log("🖱️ Iniciando proceso de pago para el usuario:", userId);
    
    // Si no hay userId, avisamos (esto ayuda en desarrollo)
    if (!userId) {
      console.error("❌ Error: No se encontró el userId para procesar el pago");
      alert("Debes estar logueado para realizar esta acción.");
      return;
    }

    setLoading(true);

    try {
      // Llamada a la ruta de tu servidor que ya configuramos
      const response = await fetch("http://localhost:5000/api/crear-pago", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: userId,
          planPrice: 5000, // Precio base en ARS
          planName: `NutriSport PRO - ${type.toUpperCase()}`
        }),
      });

      const data = await response.json();

      if (data.init_point) {
        // Redirige al usuario a la pasarela de Mercado Pago
        window.location.href = data.init_point;
      } else {
        throw new Error("No se pudo generar el punto de inicio de pago");
      }

      if (onUnlock) onUnlock();
    } catch (error) {
      console.error("❌ Error en pasarela:", error);
      alert("No se pudo conectar con Mercado Pago. Revisa tu conexión.");
    } finally {
      setLoading(false);
    }
  };

  const content = {
    cocina: {
      icon: "👨‍🍳",
      title: "CHEF PERSONAL",
      description: "Desbloquea recetas inteligentes, adaptadas a tus macros exactos y a los ingredientes que tienes en casa.",
      benefits: ["Recetas ajustadas a tus calorías", "Generador basado en tu heladera", "Historial de platos favoritos", "Cálculo automático de macros"]
    },
    entreno: {
      icon: "💪",
      title: "ENTRENADOR",
      description: "Obtén rutinas de entrenamiento diseñadas específicamente para tu biotipo, nivel de experiencia y días disponibles.",
      benefits: ["Plan de hipertrofia o fuerza", "Rutinas de 2 a 6 días por semana", "Progresión de cargas inteligente", "Explicación técnica de ejercicios"]
    },
    tracker: {
      icon: "📊",
      title: "SEGUIMIENTO",
      description: "El control total de tu evolución. Registra tus comidas y peso para asegurar que estás avanzando hacia tu meta cada día.",
      benefits: ["Registro diario de comidas", "Conteo de macros en tiempo real", "Gráficos de evolución de peso", "Análisis de alimentos"]
    },
    default: {
      icon: "📋",
      title: "FALTA UN PASO",
      description: "Para diseñar tu plan perfecto, necesitamos conocer tus medidas y objetivos primero.",
      benefits: ["Cálculo de metabolismo basal", "Definición de objetivos claros", "Acceso a herramientas PRO", "Personalización total"]
    }
  };

  const current = content[type] || content.default;

  return (
    <div className="w-full max-w-2xl mx-auto bg-gray-900 text-white rounded-xl shadow-2xl border border-gray-800 p-8 md:p-10 flex flex-col items-center text-center relative overflow-hidden group animate-fade-in">
      
      {/* --- FONDOS DECORATIVOS --- */}
      <div className="absolute top-0 w-full h-1 bg-gradient-to-r from-transparent via-sportRed to-transparent opacity-50 pointer-events-none"></div>
      <div className="absolute -bottom-10 left-1/2 w-40 h-40 bg-sportRed/10 rounded-full blur-3xl -translate-x-1/2 pointer-events-none"></div>

      <div className="relative z-10 flex flex-col items-center w-full">

          {/* ICONO */}
          <div className="bg-gray-800 p-3 rounded-full border border-gray-700 shadow-inner mb-6 text-2xl animate-bounce-slow">
            {loading ? "⏳" : "🔒"}
          </div>

          {/* TÍTULO DINÁMICO */}
          <h3 className="text-3xl md:text-5xl font-display font-bold uppercase italic tracking-wider text-white mb-2 leading-none">
              {current.title} <span className="text-sportRed">PRO</span>
          </h3>
          
          <p className="text-gray-400 text-sm font-medium max-w-md mb-8 leading-relaxed">
              {current.description}
          </p>

          {/* LISTA DINÁMICA DE BENEFICIOS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 mb-8 text-left w-full max-w-sm">
              {current.benefits.map((benefit, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-sportRed font-bold text-lg">✓</span>
                    <span className="text-xs font-bold text-gray-300 uppercase tracking-widest">{benefit}</span>
                  </div>
              ))}
          </div>

          {/* BOTÓN */}
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