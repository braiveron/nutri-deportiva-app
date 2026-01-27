import { useState } from "react";
import RecipeChef from "../components/RecipeChef";
import RecipeHistory from "../components/RecipeHistory";
import PremiumLock from "../components/PremiumLock";

export default function CocinaPage({ macros, userId, userRole, onUnlock }) {
  const [refreshHistory, setRefreshHistory] = useState(0);

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
             
             <PremiumLock onUnlock={onUnlock} />
         </div>
       )}
    </div>
  );
}