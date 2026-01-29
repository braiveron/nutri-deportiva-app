import TrainingCoach from "../components/TrainingCoach";
import PremiumLock from "../components/PremiumLock";
import ProfileIncomplete from "../components/ProfileIncomplete"; // 👈 IMPORTAR

export default function EntrenoPage({ initialData, userId, userRole, onPlanCreated, userGoal, onUnlock }) {
    
    // 1️⃣ PRIMERO: ¿TIENE DATOS?
    if (!initialData) {
        return <ProfileIncomplete type="entreno"/>;
    }

    // 2️⃣ SEGUNDO: ¿TIENE PERMISO?
    // Si NO es pro Y TAMPOCO es admin, mostramos el candado
    if (userRole !== 'pro' && userRole !== 'admin') {
        return (
            <div className="flex flex-col items-center pt-10 animate-fade-in px-4 w-full">
                 <PremiumLock onUnlock={onUnlock} type="entreno"/>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center pt-10 pb-20 px-4 animate-fade-in w-full">
             <TrainingCoach 
                plan={initialData.workout_plan} 
                userId={userId}
                onPlanCreated={onPlanCreated}
                currentGoal={userGoal}
             />
        </div>
    );
}