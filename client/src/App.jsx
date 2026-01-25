import { useState, useEffect } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { supabase } from "./supabase"; 

// Componentes
import TrainingCoach from "./components/TrainingCoach"; 
import Navbar from "./components/NavBar"; // Asegúrate que el nombre del archivo coincida (NavBar.jsx o Navbar.jsx)
import Auth from "./components/Auth";
import Calculator from "./components/Calculator";
import RecipeChef from "./components/RecipeChef";
import RecipeHistory from "./components/RecipeHistory";
import PremiumLock from "./components/PremiumLock";

// --- PÁGINAS ---

const PerfilPage = ({ initialData, onCalcSuccess, userId }) => (
  <div className="flex flex-col items-center animate-fade-in pt-10 px-4">
    <div className="text-center mb-8">
        <h2 className="text-4xl font-display font-bold text-sportDark italic">
          TU <span className="text-sportRed">OBJETIVO</span>
        </h2>
        <p className="text-gray-400 text-xs font-bold tracking-widest uppercase mt-2">
          Configura tus datos biométricos
        </p>
    </div>
    <Calculator initialData={initialData} onCalculationSuccess={onCalcSuccess} userId={userId} />
  </div>
);

const CocinaPage = ({ macros, userId, userRole, onUpgrade }) => {
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
              <PremiumLock onUnlock={onUpgrade} />
          </div>
       )}
    </div>
  );
};

const EntrenoPage = ({ initialData, userId, userRole, onUpgrade, onPlanCreated, userGoal }) => {
    
    // Si no hay datos, pedimos perfil
    if (!initialData) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] animate-fade-in px-4 text-center">
                <span className="text-6xl mb-4">⚠️</span>
                <h3 className="text-2xl font-bold text-gray-400 uppercase tracking-widest">Perfil Incompleto</h3>
                <p className="text-gray-500 mt-2">Configura tu perfil para generar un entrenamiento.</p>
            </div>
        );
    }

    // Si es Free, mostramos candado
    if (userRole !== 'pro') {
        return (
            <div className="flex flex-col items-center pt-10 animate-fade-in px-4 w-full">
                 <h2 className="text-3xl font-display font-bold text-sportDark mb-8 italic">ENTRENAMIENTO <span className="text-sportRed">PRO</span></h2>
                 <PremiumLock onUnlock={onUpgrade} />
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
};

// --- APP PRINCIPAL ---

function App() {
  const [session, setSession] = useState(null);
  
  // Estados de Datos
  const [userMacros, setUserMacros] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [initialCalcData, setInitialCalcData] = useState(null);
  
  // Estados de Suscripción
  const [autoRenew, setAutoRenew] = useState(false);
  const [subEndDate, setSubEndDate] = useState(null);

  // Estados de UI
  const [loadingRole, setLoadingRole] = useState(false);
  const [checkingBiometrics, setCheckingBiometrics] = useState(true);
  
  const navigate = useNavigate(); 

  // 1. EFECTO DE SESIÓN
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
        setSession(session);
        if(!session) setCheckingBiometrics(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        setSession(session);
        if(!session) { 
            setCheckingBiometrics(false);
            setUserMacros(null);
            setUserRole(null);
            setInitialCalcData(null);
            setAutoRenew(false);
            setSubEndDate(null);
        }
    });

    return () => subscription.unsubscribe();
  }, []);

  // 2. EFECTO DE DATOS
  useEffect(() => {
    if (session?.user?.id) {
       if (!userMacros && !initialCalcData) {
           setCheckingBiometrics(true);
       }
       Promise.all([
           fetchUserProfile(session.user.id),
           fetchUserBiometrics(session.user.id)
       ]).finally(() => {
           setCheckingBiometrics(false);
       });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.id]);

  // --- FUNCIONES DE CARGA ---

  const fetchUserBiometrics = async (userId) => {
    try {
        const response = await fetch(`http://localhost:5000/api/mi-plan/${userId}`);
        const data = await response.json();

        if (data.existe) {
            if (data.datos.target_macros.todos_los_planes) {
                const objetivo = data.datos.goal || 'mantener';
                setUserMacros(data.datos.target_macros.todos_los_planes[objetivo]);
            } else {
                setUserMacros(data.datos.target_macros);
            }
            setInitialCalcData(data.datos);
        }
    } catch (error) {
        console.error("Error cargando biometría:", error);
    }
  };

  const fetchUserProfile = async (userId) => {
    setLoadingRole(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('subscription_tier, subscription_end_date, auto_renew')
        .eq('id', userId)
        .single();
      
      if (error) throw error;
      
      if (data) {
        setSubEndDate(data.subscription_end_date);
        setAutoRenew(data.auto_renew);

        const hoy = new Date();
        const vencimiento = data.subscription_end_date ? new Date(data.subscription_end_date) : null;
        
        // Si venció HOY (y no es null), es free. Si no, es lo que diga la base.
        if (vencimiento && vencimiento < hoy) {
            setUserRole('free');
        } else {
            setUserRole(data.subscription_tier);
        }
      }
    } catch (error) {
      console.error("Error cargando perfil:", error);
    } finally {
      setLoadingRole(false);
    }
  };

  const handleCalculationSuccess = async (plan) => {
    setUserMacros(plan);
    // Forzamos la recarga de los datos biométricos globales
    if (session?.user?.id) {
        await fetchUserBiometrics(session.user.id);
    }
  };

 const handleSimulateUpgrade = async () => {
    if (!session) return;
    const confirm = window.confirm("¿Simular pago de 1 mes ($4.99)?");
    if (!confirm) return;

    try {
        const response = await fetch('http://localhost:5000/api/suscribirse', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: session.user.id })
        });
        const data = await response.json();
        
        if (data.success) {
            // 🚀 ACTUALIZACIÓN OPTIMISTA (Feedback Instantáneo)
            // No esperamos al fetch para cambiar la UI. Asumimos éxito.
            setUserRole('pro');
            setAutoRenew(true);
            
            // Calculamos la fecha visualmente para mostrarla ya mismo
            const visualDate = new Date();
            visualDate.setMonth(visualDate.getMonth() + 1);
            setSubEndDate(visualDate.toISOString());

            alert(`¡Suscripción activa! Bienvenido a PRO.`);

            // Sincronización real en segundo plano (para asegurar)
            await fetchUserProfile(session.user.id);
        } else {
            alert("Error: " + (data.error || "No se pudo procesar"));
        }
    } catch (error) {
        console.error("Error conexión:", error);
    }
  };

const handleCancelSubscription = async () => {
    if (!session) return;
    try {
        const response = await fetch('http://localhost:5000/api/cancelar-suscripcion', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: session.user.id })
        });
        const data = await response.json();
        
        if (data.success) {
            // 🚀 ACTUALIZACIÓN OPTIMISTA (El truco mágico)
            // Forzamos el estado a 'false' inmediatamente para que el botón cambie YA.
            setAutoRenew(false); 
            
            alert("Suscripción cancelada. Seguirás siendo PRO hasta que venza el periodo actual.");
            
            // Re-confirmamos con la base de datos en segundo plano
            await fetchUserProfile(session.user.id); 
        } else {
            alert("Error: " + data.error);
        }
    } catch (error) {
        console.error(error);
        alert("Error de conexión al cancelar.");
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  // --- RENDERIZADO ---

  if (checkingBiometrics) {
     return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-white">
            <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-sportRed mb-4"></div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest animate-pulse">Cargando...</p>
        </div>
     );
  }

  if (!session) {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4">
            <div className="text-center mb-8">
                <h1 className="text-6xl font-display font-bold text-sportDark tracking-tighter italic">
                NUTRI<span className="text-sportRed">SPORT</span>
                </h1>
            </div>
            <Auth />
        </div>
    );
  }

  const userName = session.user.user_metadata.full_name || "Usuario";

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      
      {/* NAVBAR: Recibe todas las props de gestión de suscripción */}
      <Navbar 
        onLogout={handleLogout} 
        userRole={userRole} 
        loadingRole={loadingRole} 
        userName={userName}
        subscriptionEnd={subEndDate}
        autoRenew={autoRenew}
        onCancelSub={handleCancelSubscription}
        onSubscribe={handleSimulateUpgrade}
      />

      <Routes>
        <Route path="/" element={<Navigate to="/perfil" />} />
        
        {/* RUTA PERFIL: Limpia, solo calculadora */}
        <Route path="/perfil" element={
            <PerfilPage 
                initialData={initialCalcData}
                userId={session.user.id}
                onCalcSuccess={handleCalculationSuccess}
            />
        } />

        <Route path="/cocina" element={
            <CocinaPage 
                macros={userMacros} 
                userId={session.user.id} 
                userRole={userRole}
                onUpgrade={handleSimulateUpgrade}
            />
        } />

        <Route path="/entrenamiento" element={
            <EntrenoPage 
                initialData={initialCalcData}
                userId={session.user.id}
                userRole={userRole}
                onUpgrade={handleSimulateUpgrade}
                userGoal={initialCalcData?.goal || 'mantener'}
                onPlanCreated={(nuevoPlan) => {
                    setInitialCalcData(prev => ({
                        ...prev,
                        workout_plan: nuevoPlan
                    }));
                }}
            />
        } />
      </Routes>
    </div>
  );
}

export default App;