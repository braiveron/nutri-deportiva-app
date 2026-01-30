import { useState, useEffect } from "react";
import { api } from "../services/api"; 
import TrainingCoach from "../components/TrainingCoach";
import WorkoutHistory from "../components/WorkoutHistory"; 
import PremiumLock from "../components/PremiumLock";
import ProfileIncomplete from "../components/ProfileIncomplete";

export default function EntrenoPage({ initialData, userId, userRole, onPlanCreated, userGoal, onUnlock }) {
    
    // 1️⃣ Estado para recargar el historial cuando se crea algo nuevo
    const [refreshHistory, setRefreshHistory] = useState(0);
    // (Borramos deletedWorkoutId porque no lo estábamos usando)

    // 2️⃣ Estados de la Rutina Actual
    const [currentPlan, setCurrentPlan] = useState(initialData?.workout_plan);
    const [localProfile, setLocalProfile] = useState(initialData);

    // 3️⃣ Sincronizar con DB al cargar
    useEffect(() => {
        const fetchFreshData = async () => {
            if (!userId) return;
            try {
                const { datos } = await api.getBiometrics(userId);
                if (datos) {
                    setLocalProfile(prev => ({ ...prev, ...datos }));
                    if (datos.workout_plan) setCurrentPlan(datos.workout_plan);
                }
            } catch (error) { console.error(error); }
        };
        fetchFreshData();
    }, [userId]);

    // 4️⃣ MANEJADOR: Cuando se crea una nueva rutina
    const handlePlanCreatedLocal = (nuevoPlan) => {
        setCurrentPlan(nuevoPlan);           // 1. Mostrarla arriba
        setRefreshHistory(prev => prev + 1); // 2. Recargar la lista de abajo
        if (onPlanCreated) onPlanCreated(nuevoPlan);
    };

    // 5️⃣ MANEJADOR: Cuando se borra una rutina del historial
    const handleWorkoutDeleted = () => {
        // Solo necesitamos recargar la lista para que desaparezca
        setRefreshHistory(prev => prev + 1);
    };

    // --- VALIDACIONES ---
    if (userRole !== 'pro' && userRole !== 'admin') {
        return <div className="flex flex-col items-center pt-10 px-4 w-full"><PremiumLock onUnlock={onUnlock} type="entreno"/></div>;
    }

    if (!localProfile) return <ProfileIncomplete type="entreno"/>;

    return (
        <div className="flex flex-col items-center pt-10 pb-20 px-4 animate-fade-in w-full">
             
             {/* 1. EL ENTRENADOR (GENERADOR) */}
             <TrainingCoach 
                plan={currentPlan} 
                userId={userId}
                onPlanCreated={handlePlanCreatedLocal} 
                currentGoal={userGoal}
                initialData={localProfile} 
             />

             {/* 2. EL HISTORIAL (BIBLIOTECA) */}
             <WorkoutHistory 
                key={refreshHistory} 
                userId={userId}
                onDeleteSuccess={handleWorkoutDeleted} // 👈 Simplemente recargamos la lista
             />

        </div>
    );
}