import { useState } from "react";
import RecipeChef from "../components/RecipeChef";
import RecipeHistory from "../components/RecipeHistory";
import PremiumLock from "../components/PremiumLock";

export default function CocinaPage({ macros, userId, userRole }) {
  const [refreshHistory, setRefreshHistory] = useState(0);
  const [loadingPay, setLoadingPay] = useState(false);

  // 👇 LÓGICA MERCADO PAGO
  const handleMercadoPago = async () => {
    if (loadingPay) return;
    setLoadingPay(true);
    try {
      const response = await fetch('http://localhost:5000/api/crear-pago', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: userId }),
      });
      const data = await response.json();
      
      if (data.init_point) {
        window.location.href = data.init_point; // 🚀 Redirige a Mercado Pago
      } else {
        alert("Error al iniciar el pago.");
      }
    } catch (error) {
      console.error(error);
      alert("No se pudo conectar con el servidor.");
    } finally {
      setLoadingPay(false);
    }
  };

  if (!macros) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] animate-fade-in px-4 text-center">
        <span className="text-6xl mb-4">⚠️</span>
        <h3 className="text-2xl font-bold text-gray-400 uppercase tracking-widest">Perfil Incompleto</h3>
        <p className="text-gray-500 mt-2">Primero ve a la sección "Perfil" y calcula tu plan.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center animate-fade-in w-full max-w-6xl mx-auto pt-10 pb-20 px-4">
       {userRole === 'pro' ? (
         <>
           <RecipeChef 
               macros={macros} 
               userId={userId} 
               onRecipeCreated={() => setRefreshHistory(prev => prev + 1)}
           />
           <RecipeHistory key={refreshHistory} userId={userId} />
         </>
       ) : (
         <div className="flex flex-col items-center w-full">
             <h2 className="text-3xl font-display font-bold text-sportDark mb-8 italic">
                 CHEF PERSONAL <span className="text-sportRed">PRO</span>
             </h2>
             <PremiumLock onUnlock={handleMercadoPago} />
             {loadingPay && <p className="mt-4 text-xs font-bold text-gray-400 animate-pulse">Cargando Mercado Pago...</p>}
         </div>
       )}
    </div>
  );
}