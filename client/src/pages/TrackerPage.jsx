import { useState } from "react";
import MacroTracker from "../components/MacroTracker";
import WeightTracker from "../components/WeightTracker"; 
import PremiumLock from "../components/PremiumLock";
import ProfileIncomplete from "../components/ProfileIncomplete"; // 👈 IMPORTAR

export default function TrackerPage({ macros, userId, userRole, onUnlock }) {
  const [activeTab, setActiveTab] = useState('macros');

  const detectarMacrosReales = (data) => {
      if (!data) return null;
      if (data.calorias_diarias || (data.macros && data.macros.proteinas)) {
          const prot = data.macros?.proteinas || data.protein || 0;
          const carb = data.macros?.carbohidratos || data.carbs || 0;
          const gras = data.macros?.grasas || data.fats || 0;
          const cal = data.calorias_diarias || data.calories || 0;
          return { calories: Number(cal), protein: Number(prot), carbs: Number(carb), fats: Number(gras) };
      }
      if (data.calories && data.protein) {
          return { calories: Number(data.calories), protein: Number(data.protein), carbs: Number(data.carbs), fats: Number(data.fats) };
      }
      if (data.target_macros) {
          if (data.target_macros.todos_los_planes) {
               const objetivo = data.goal || 'mantener';
               const plan = data.target_macros.todos_los_planes[objetivo];
               if (plan) return detectarMacrosReales(plan);
          }
          return detectarMacrosReales(data.target_macros);
      }
      return null;
  };

  const finalMacros = detectarMacrosReales(macros);

  // 1️⃣ PRIMERO: VALIDACIÓN DE DATOS (CRÍTICO: ESTO VA ANTES QUE EL CANDADO)
  // Si intenta ver "Diario" pero no tiene macros calculados -> Perfil Incompleto
  if (activeTab === 'macros' && !finalMacros) {
      return <ProfileIncomplete type="tracker"/>;
  }

  // 2️⃣ SEGUNDO: VALIDACIÓN DE ROL
  if (userRole !== 'pro' && userRole !== 'admin') {
    return (
        <div className="flex flex-col items-center pt-10 animate-fade-in px-4 w-full">
             <PremiumLock onUnlock={onUnlock} type="tracker" />
        </div>
    );
  }

  // 3️⃣ TERCERO: CONTENIDO
  return (
    <div className="flex flex-col items-center pt-10 pb-20 px-4 animate-fade-in w-full max-w-7xl mx-auto">
        
        {/* INTERRUPTOR (TOGGLE) */}
        <div className="mb-8">
            <div className="flex bg-gray-200 p-1 rounded-full relative">
                <div 
                    className={`absolute top-1 bottom-1 w-[50%] bg-white rounded-full shadow-sm transition-all duration-300 ease-out ${
                        activeTab === 'macros' ? 'left-1' : 'left-[49%]'
                    }`}
                ></div>
                
                <button 
                    onClick={() => setActiveTab('macros')}
                    className={`relative z-10 px-6 py-2 w-32 rounded-full text-xs font-bold uppercase tracking-widest transition-colors ${
                        activeTab === 'macros' ? 'text-sportRed' : 'text-gray-500 hover:text-gray-700'
                    }`}
                >
                    Diario
                </button>
                <button 
                    onClick={() => setActiveTab('weight')}
                    className={`relative z-10 px-6 py-2 w-32 rounded-full text-xs font-bold uppercase tracking-widest transition-colors ${
                        activeTab === 'weight' ? 'text-sportRed' : 'text-gray-500 hover:text-gray-700'
                    }`}
                >
                    Peso
                </button>
            </div>
        </div>

        {/* CONTENIDO SEGÚN PESTAÑA */}
        <div className="w-full">
            {activeTab === 'macros' ? (
                <MacroTracker userId={userId} userMacros={finalMacros} />
            ) : (
                <WeightTracker userId={userId} />
            )}
        </div>

    </div>
  );
}