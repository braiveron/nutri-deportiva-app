import { Routes, Route, Navigate } from "react-router-dom";
import { useAppLogic } from "./hooks/useAppLogic"; 

// Componentes
import Navbar from "./components/Navbar"; 
import Auth from "./components/Auth";

// Páginas
import PerfilPage from "./pages/PerfilPage";
import CocinaPage from "./pages/CocinaPage";
import EntrenoPage from "./pages/EntrenoPage";

function App() {
  const { 
    session, 
    userMacros, 
    userRole, 
    initialCalcData, 
    autoRenew, 
    subEndDate, 
    loadingRole, 
    checkingBiometrics, 
    handleCalculationSuccess, 
    handleSimulateUpgrade, 
    handleCancelSubscription, 
    handleLogout,
    updateWorkoutPlan 
  } = useAppLogic();

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
    return <Auth />;
  }

  const userName = session.user.user_metadata.full_name || "Usuario";

  return (
    // 👇 1. CONTENEDOR PRINCIPAL CON FONDO "TECH"
    <div className="min-h-screen relative bg-gray-50 text-gray-800 font-sans overflow-hidden selection:bg-sportRed selection:text-white">
      
      {/* 2. PATRÓN DE PUNTOS (GRID) */}
      <div 
        className="absolute inset-0 z-0 pointer-events-none opacity-40" 
        style={{
             backgroundImage: 'radial-gradient(#94a3b8 1px, transparent 1px)',
             backgroundSize: '24px 24px'
        }}
      ></div>

      {/* 3. ORBE DE ENERGÍA (Mancha roja suave detrás) */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-sportRed/10 rounded-full blur-3xl -z-10 animate-pulse"></div>

      {/* 4. CONTENIDO (Navbar y Páginas) con z-10 para estar encima del fondo */}
      <div className="relative z-10">
        
        <Navbar 
          onLogout={handleLogout} 
          userRole={userRole} 
          loadingRole={loadingRole} 
          userName={userName}
          userId={session.user.id}
          subscriptionEnd={subEndDate}
          autoRenew={autoRenew}
          onCancelSub={handleCancelSubscription}
          onSubscribe={handleSimulateUpgrade} 
        />

        <div className="pb-10">
          <Routes>
            <Route path="/" element={<Navigate to="/perfil" />} />
            
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
                />
            } />

            <Route path="/entrenamiento" element={
                <EntrenoPage 
                    initialData={initialCalcData}
                    userId={session.user.id}
                    userRole={userRole}
                    userGoal={initialCalcData?.goal || 'mantener'}
                    onPlanCreated={updateWorkoutPlan}
                />
            } />
          </Routes>
        </div>
      </div>
    </div>
  );
}

export default App;