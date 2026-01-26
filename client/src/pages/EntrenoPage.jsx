import TrainingCoach from "../components/TrainingCoach";
import PremiumLock from "../components/PremiumLock";

// 👇 Recibimos onUnlock
export default function EntrenoPage({ initialData, userId, userRole, onPlanCreated, userGoal, onUnlock }) {
    
    // 🛑 Eliminamos loadingPay y handleMercadoPago manual.

    if (!initialData) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] animate-fade-in px-4 text-center">
                <span className="text-6xl mb-4">⚠️</span>
                <h3 className="text-2xl font-bold text-gray-400 uppercase tracking-widest">Perfil Incompleto</h3>
                <p className="text-gray-500 mt-2">Configura tu perfil para generar un entrenamiento.</p>
            </div>
        );
    }

    if (userRole !== 'pro') {
        return (
            <div className="flex flex-col items-center pt-10 animate-fade-in px-4 w-full">
                 <h2 className="text-3xl font-display font-bold text-sportDark mb-8 italic">ENTRENAMIENTO <span className="text-sportRed">PRO</span></h2>
                 
                 {/* 👇 Usamos onUnlock directamente */}
                 <PremiumLock onUnlock={onUnlock} />
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