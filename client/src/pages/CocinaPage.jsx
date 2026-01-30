import { useState } from "react";
import RecipeChef from "../components/RecipeChef";
import RecipeHistory from "../components/RecipeHistory";
import PremiumLock from "../components/PremiumLock";
import ProfileIncomplete from "../components/ProfileIncomplete";

export default function CocinaPage({ macros, userId, userRole, onUnlock }) {
  const [refreshHistory, setRefreshHistory] = useState(0);
  
  // 👇 1. ESTADO PARA COMUNICAR BORRADOS
  const [deletedRecipeId, setDeletedRecipeId] = useState(null);

  if (!macros) {
    return <ProfileIncomplete type="cocina" />;
  }

  const hasAccess = userRole === 'pro' || userRole === 'admin';

  return (
    <div className="flex flex-col items-center animate-fade-in w-full max-w-6xl mx-auto pt-10 pb-20 px-4">
       {hasAccess ? (
         <>
           <RecipeChef 
               macros={macros} 
               userId={userId} 
               onRecipeCreated={() => setRefreshHistory(prev => prev + 1)}
               deletedRecipeId={deletedRecipeId} // 👈 2. LE PASAMOS LA NOTICIA AL CHEF
           />
           <RecipeHistory 
                key={refreshHistory} 
                userId={userId} 
                onDeleteSuccess={(id) => setDeletedRecipeId(id)} // 👈 3. ESCUCHAMOS EL BORRADO
           />
         </>
       ) : (
         <div className="flex flex-col items-center w-full">
             <PremiumLock onUnlock={onUnlock} type="cocina"/>
         </div>
       )}
    </div>
  );
}