import { useState, useEffect } from "react";
import { api } from "../services/api"; 
import TrainingCoach from "../components/TrainingCoach";
import WorkoutHistory from "../components/WorkoutHistory"; 
import PremiumLock from "../components/PremiumLock";
import ProfileIncomplete from "../components/ProfileIncomplete";
import ExerciseLogger from "../components/ExerciseLogger"; 

export default function EntrenoPage({ initialData, userId, userRole, onPlanCreated, userGoal, onUnlock }) {
    
    // 0️⃣ ESTADO DE PESTAÑAS
    const [activeTab, setActiveTab] = useState('rutina');

    // 🆕 ESTADO PARA TARJETAS DESPLEGABLES (Todos cerrados por defecto)
    const [expandedDays, setExpandedDays] = useState({}); // 👈 CAMBIO AQUÍ: Objeto vacío

    // 1️⃣ Estado para recargar el historial
    const [refreshHistory, setRefreshHistory] = useState(0);

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
                }
            } catch (error) { console.error(error); }
        };
        fetchFreshData();
    }, [userId]);

    // 4️⃣ MANEJADORES
    const handlePlanCreatedLocal = (nuevoPlan) => {
        setCurrentPlan(nuevoPlan);           
        setRefreshHistory(prev => prev + 1); 
        if (onPlanCreated) onPlanCreated(nuevoPlan);
    };

    const handleWorkoutDeleted = () => {
        setRefreshHistory(prev => prev + 1);
        setCurrentPlan(null);
    };

    // 🆕 Recibe la última rutina desde el Historial
    const handleHistoryLoaded = (latestPlan) => {
        if (latestPlan) {
            console.log("🔄 Sincronizando Registro con última rutina del historial...");
            setCurrentPlan(latestPlan);
        }
    };

    const toggleDay = (index) => {
        setExpandedDays(prev => ({ ...prev, [index]: !prev[index] }));
    };

    // --- VALIDACIONES ---
    if (userRole !== 'pro' && userRole !== 'admin') {
        return <div className="flex flex-col items-center pt-10 px-4 w-full"><PremiumLock onUnlock={onUnlock} type="entreno" userId={userId}/></div>;
    }

    if (!localProfile) return <ProfileIncomplete type="entreno"/>;

    return (
        <div className="flex flex-col items-center pt-10 pb-20 px-4 animate-fade-in w-full max-w-7xl mx-auto">
             
            {/* --- INTERRUPTOR (TOGGLE) --- */}
            <div className="mb-8">
                <div className="flex bg-gray-200 p-1 rounded-full relative">
                    <div 
                        className={`absolute top-1 bottom-1 w-[50%] bg-white rounded-full shadow-sm transition-all duration-300 ease-out ${
                            activeTab === 'rutina' ? 'left-1' : 'left-[49%]'
                        }`}
                    ></div>
                    
                    <button onClick={() => setActiveTab('rutina')} className={`relative z-10 px-6 py-2 w-32 rounded-full text-xs font-bold uppercase tracking-widest transition-colors ${activeTab === 'rutina' ? 'text-sportRed' : 'text-gray-500 hover:text-gray-700'}`}>
                        RUTINA
                    </button>
                    <button onClick={() => setActiveTab('registro')} className={`relative z-10 px-6 py-2 w-32 rounded-full text-xs font-bold uppercase tracking-widest transition-colors ${activeTab === 'registro' ? 'text-sportRed' : 'text-gray-500 hover:text-gray-700'}`}>
                        REGISTRO
                    </button>
                </div>
            </div>

            {/* --- PESTAÑA 1: RUTINA (TrainingCoach + WorkoutHistory) --- */}
            {activeTab === 'rutina' && (
                <div className="w-full flex flex-col items-center animate-fade-in space-y-10">
                    <TrainingCoach 
                        plan={currentPlan} 
                        userId={userId}
                        onPlanCreated={handlePlanCreatedLocal} 
                        currentGoal={userGoal}
                        initialData={localProfile} 
                    />
                    
                    <WorkoutHistory 
                        key={refreshHistory} 
                        userId={userId}
                        onDeleteSuccess={handleWorkoutDeleted}
                        onHistoryLoad={handleHistoryLoaded}
                    />
                </div>
            )}

            {/* --- PESTAÑA 2: REGISTRO (Cards Desplegables) --- */}
            {activeTab === 'registro' && (
                <div className="w-full animate-fade-in flex flex-col items-center">
                    
                    {currentPlan && currentPlan.dias ? (
                        <div className="w-full max-w-6xl mt-2">
                            <div className="flex items-center gap-3 mb-6 px-2">
                                <div className="h-10 w-1.5 bg-sportRed rounded-full"></div>
                                <div>
                                    <h3 className="text-2xl font-black text-gray-800 uppercase italic">Registro de Cargas</h3>
                                    <p className="text-xs text-gray-500 font-medium">Toca un día para ver y registrar tus ejercicios ▼</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {currentPlan.dias.map((diaPlan, index) => (
                                    <div key={index} className="bg-white rounded-2xl shadow-lg transition-all duration-300 overflow-hidden border border-gray-100 flex flex-col h-fit">
                                        
                                        {/* CABECERA CLICKABLE */}
                                        <div 
                                            onClick={() => toggleDay(index)}
                                            className="bg-gray-900 p-4 border-l-8 border-sportRed flex justify-between items-center relative overflow-hidden cursor-pointer hover:bg-gray-800 transition-colors"
                                        >
                                            <div className="absolute top-0 right-0 opacity-10 transform translate-x-4 -translate-y-2">
                                                <span className="text-6xl font-black text-white">{index + 1}</span>
                                            </div>
                                            <div className="relative z-10 flex items-center gap-4">
                                                <div>
                                                    <h3 className="text-white font-black text-lg uppercase tracking-wider">{diaPlan.dia}</h3>
                                                    <span className="text-[10px] text-gray-300 font-mono uppercase tracking-widest">{diaPlan.ejercicios.length} EJERCICIOS</span>
                                                </div>
                                            </div>
                                            <div className={`relative z-10 text-white transform transition-transform duration-300 ${expandedDays[index] ? 'rotate-180' : ''}`}>
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>
                                            </div>
                                        </div>

                                        {/* DETALLE EJERCICIOS */}
                                        {expandedDays[index] && (
                                            <div className="p-5 space-y-6 bg-gray-50/50 animate-fade-in-down">
                                                {diaPlan.ejercicios.map((ejercicio, idx) => (
                                                    <div key={idx} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                                                        <div className="flex justify-between items-start mb-3 border-b border-gray-100 pb-2">
                                                            <h4 className="font-bold text-gray-800 text-sm leading-tight pr-2">{ejercicio.nombre}</h4>
                                                            <span className="text-[10px] font-bold bg-red-50 text-sportRed px-2 py-1 rounded-full whitespace-nowrap">{ejercicio.series} x {ejercicio.reps}</span>
                                                        </div>
                                                        <div className="mt-1">
                                                            <ExerciseLogger userId={userId} exerciseName={ejercicio.nombre} />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-20 text-gray-500 bg-gray-50 rounded-xl w-full max-w-lg border border-gray-200 shadow-sm p-8">
                            <span className="text-4xl block mb-4">📂</span>
                            <h3 className="font-bold text-gray-700">No hay rutina activa</h3>
                            <p className="text-sm text-gray-500 mt-2">La pestaña de registro se alimenta de tu última rutina guardada. Ve a la pestaña <span className="font-bold text-sportRed">RUTINA</span> y asegúrate de que cargue tu historial.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}