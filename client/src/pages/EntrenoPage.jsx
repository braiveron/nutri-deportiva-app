import { useState } from "react";
import TrainingCoach from "../components/TrainingCoach";
import PremiumLock from "../components/PremiumLock";

export default function EntrenoPage({ initialData, userId, userRole, onPlanCreated, userGoal }) {
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
            if (data.init_point) window.location.href = data.init_point;
            else alert("Error al iniciar el pago.");
        } catch (error) {
            console.error(error);
            alert("No se pudo conectar con el servidor.");
        } finally {
            setLoadingPay(false);
        }
    };

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
                 <PremiumLock onUnlock={handleMercadoPago} />
                 {loadingPay && <p className="mt-4 text-xs font-bold text-gray-400 animate-pulse">Cargando Mercado Pago...</p>}
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