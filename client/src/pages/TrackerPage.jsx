import MacroTracker from "../components/MacroTracker";
import PremiumLock from "../components/PremiumLock";

export default function TrackerPage({ macros, userId, userRole, onUnlock }) {

  // 1. NORMALIZACIÓN DE DATOS
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

  // 2. RENDERIZADO

  if (userRole !== 'pro') {
    return (
        <div className="flex flex-col items-center pt-10 animate-fade-in px-4 w-full">
             <h2 className="text-3xl font-display font-bold text-sportDark mb-8 italic">
                 SEGUIMIENTO DIARIO <span className="text-sportRed">PRO</span>
             </h2>
             <PremiumLock onUnlock={onUnlock} />
        </div>
    );
  }

  if (!finalMacros) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] animate-fade-in px-4 text-center">
        <span className="text-6xl mb-4">⚠️</span>
        <h3 className="text-2xl font-bold text-gray-400 uppercase tracking-widest">Sin Datos</h3>
        <p className="text-gray-500 mt-2">Configura tu perfil para activar el diario.</p>
      </div>
    );
  }

  return (
    // 👇 CAMBIO AQUÍ: 'max-w-7xl' para que entren bien las dos columnas
    <div className="flex flex-col items-center pt-10 pb-20 px-4 animate-fade-in w-full max-w-7xl mx-auto">
        <MacroTracker userId={userId} userMacros={finalMacros} />
    </div>
  );
}