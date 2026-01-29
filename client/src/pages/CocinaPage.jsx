import { useState } from "react";
import RecipeChef from "../components/RecipeChef";
import RecipeHistory from "../components/RecipeHistory";
import PremiumLock from "../components/PremiumLock";
import ProfileIncomplete from "../components/ProfileIncomplete"; // 👈 IMPORTAR

export default function CocinaPage({ macros, userId, userRole, onUnlock }) {
  const [refreshHistory, setRefreshHistory] = useState(0);

  // 1️⃣ PRIMERO: ¿TIENE DATOS?
  // Si no hay macros, mostramos la pantalla de "Perfil Incompleto"
  if (!macros) {
    return <ProfileIncomplete type="cocina" />;
  }

  // 2️⃣ SEGUNDO: ¿ES PRO O ADMIN?
  const hasAccess = userRole === 'pro' || userRole === 'admin';

  return (
    <div className="flex flex-col items-center animate-fade-in w-full max-w-6xl mx-auto pt-10 pb-20 px-4">
       {hasAccess ? (
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
             
             <PremiumLock onUnlock={onUnlock} type="cocina"/>
         </div>
       )}
    </div>
  );
}