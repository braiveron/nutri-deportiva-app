import { useNavigate } from "react-router-dom";

export default function ProfileIncomplete({ type = "default" }) {
  const navigate = useNavigate();

  // Diccionario de Contenidos según la página
  const content = {
    cocina: {
      icon: "👨‍🍳",
      title: "TU CHEF PERSONAL",
      description: "Desbloquea recetas inteligentes, adaptadas a tus macros exactos y a los ingredientes que tienes en casa.",
      benefits: [
        "Recetas ajustadas a tus calorías",
        "Generador basado en tu heladera",
        "Historial de platos favoritos",
        "Cálculo automático de macros"
      ]
    },
    entreno: {
      icon: "💪",
      title: "TU ENTRENADOR PRO",
      description: "Obtén rutinas de entrenamiento diseñadas específicamente para tu biotipo, nivel de experiencia y días disponibles.",
      benefits: [
        "Plan de hipertrofia o fuerza",
        "Rutinas de 2 a 6 días por semana",
        "Progresión de cargas inteligente",
        "Explicación técnica de ejercicios"
      ]
    },
    tracker: {
      icon: "📊",
      title: "TU SEGUIMIENTO",
      description: "El control total de tu evolución. Registra tus comidas y peso para asegurar que estás avanzando hacia tu meta cada día.",
      benefits: [
        "Registro diario de comidas",
        "Conteo de macros en tiempo real",
        "Gráficos de evolución de peso",
        "Análisis de alimentos"
      ]
    },
    default: {
      icon: "📋",
      title: "FALTA UN PASO",
      description: "Para diseñar tu plan perfecto, necesitamos conocer tus medidas y objetivos primero.",
      benefits: [
        "Cálculo de metabolismo basal",
        "Definición de objetivos claros",
        "Acceso a herramientas PRO",
        "Personalización total"
      ]
    }
  };

  const current = content[type] || content.default;

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center animate-fade-in w-full max-w-2xl mx-auto">
      
      {/* ICONO */}
      <div className="relative mb-6">
        <div className="absolute inset-0 bg-sportRed/10 rounded-full blur-xl animate-pulse"></div>
        <div className="relative bg-white p-5 rounded-full shadow-lg border border-gray-100">
            <span className="text-4xl">{current.icon}</span>
        </div>
      </div>

      {/* TÍTULO */}
      <h2 className="text-2xl md:text-3xl font-display font-bold text-sportDark italic uppercase mb-3">
        ACTIVAR <span className="text-sportRed">{current.title}</span>
      </h2>
      
      <p className="text-gray-500 font-medium leading-relaxed mb-8 max-w-lg">
        {current.description}
      </p>

      {/* LISTA DE BENEFICIOS */}
      <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm w-full mb-8 text-left">
          <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 border-b border-gray-100 pb-2">
            Lo que vas a obtener:
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {current.benefits.map((benefit, i) => (
                <div key={i} className="flex items-center gap-3">
                    <div className="min-w-[20px] h-5 rounded-full bg-green-50 flex items-center justify-center border border-green-100">
                        <span className="text-green-600 text-xs font-bold">✓</span>
                    </div>
                    <span className="text-sm font-medium text-gray-700">{benefit}</span>
                </div>
            ))}
          </div>
      </div>

      {/* BOTÓN DE ACCIÓN */}
      <button 
        onClick={() => navigate("/perfil")}
        className="bg-sportRed text-white px-8 py-3 rounded-lg font-bold uppercase tracking-widest shadow-lg shadow-red-900/20 hover:bg-red-700 hover:scale-105 transition-all transform w-full md:w-auto"
      >
        Completar Mi Perfil →
      </button>

    </div>
  );
}