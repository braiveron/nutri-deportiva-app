import { useState } from "react";
import RecipeChef from "../components/RecipeChef";
import RecipeHistory from "../components/RecipeHistory";
import PremiumLock from "../components/PremiumLock";
import ProfileIncomplete from "../components/ProfileIncomplete";

export default function CocinaPage({ macros, userId, userRole, onUnlock }) {
  const [refreshHistory, setRefreshHistory] = useState(0);
  
  // Estado para comunicar borrados entre componentes
  const [deletedRecipeId, setDeletedRecipeId] = useState(null);

  // Si no hay macros (perfil incompleto), mostramos aviso
  if (!macros || (macros.calorias === 0)) {
    return <ProfileIncomplete type="cocina" />;
  }

  // Verificación de acceso PRO o ADMIN
  const hasAccess = userRole === 'pro' || userRole === 'admin';

  return (
    <div className="flex flex-col items-center animate-fade-in w-full max-w-6xl mx-auto pt-10 pb-20 px-4">
       {hasAccess ? (
         <>
           <RecipeChef 
               macros={macros} 
               userId={userId} 
               onRecipeCreated={() => setRefreshHistory(prev => prev + 1)}
               deletedRecipeId={deletedRecipeId}
           />
           <RecipeHistory 
                key={refreshHistory} 
                userId={userId} 
                onDeleteSuccess={(id) => setDeletedRecipeId(id)}
           />
         </>
       ) : (
         <div className="flex flex-col items-center w-full">
             <PremiumLock 
                onUnlock={onUnlock} 
                type="cocina" 
                userId={userId}
             />
         </div>
       )}
    </div>
  );
}