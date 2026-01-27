import { useState } from "react"; // 👈 Importamos useState
import { Routes, Route, Navigate } from "react-router-dom";
import { useAppLogic } from "./hooks/useAppLogic"; 

// Componentes
import Navbar from "./components/NavBar";
import Auth from "./components/Auth";
import StatusModal from "./components/StatusModal"; 
import AccountSettingsModal from "./components/AccountSettingsModal"; // 👈 Importamos el Modal

// Páginas
import PerfilPage from "./pages/PerfilPage";
import CocinaPage from "./pages/CocinaPage";
import EntrenoPage from "./pages/EntrenoPage";
import TrackerPage from "./pages/TrackerPage";

function App() {
  const { 
    session, 
    userMacros, 
    userRole, 
    initialCalcData, 
    autoRenew, 
    // subEndDate, // Ya no lo usamos en UI directa
    loadingRole, 
    checkingBiometrics, 
    // Variables del Modal
    paymentModal,       
    closePaymentModal,
    // Funciones
    handleCalculationSuccess, 
    handleSimulateUpgrade, 
    handleCancelSubscription,
    handleReactivateSubscription,
    handleDeleteAccount,
    handleLogout,
    updateWorkoutPlan 
  } = useAppLogic();

  // 👇 ESTADO PARA EL MODAL DE CONFIGURACIÓN
  const [showSettings, setShowSettings] = useState(false);

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
    <div className="min-h-screen relative bg-gray-50 text-gray-800 font-sans overflow-hidden selection:bg-sportRed selection:text-white">
      
      {/* BACKGROUND */}
      <div 
        className="absolute inset-0 z-0 pointer-events-none opacity-40" 
        style={{
             backgroundImage: 'radial-gradient(#94a3b8 1px, transparent 1px)',
             backgroundSize: '24px 24px'
        }}
      ></div>
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-sportRed/10 rounded-full blur-3xl -z-10 animate-pulse"></div>

      {/* MODAL GLOBAL (Pagos/Alertas) */}
      {paymentModal.show && (
        <StatusModal 
            type={paymentModal.type} 
            title={paymentModal.title} 
            message={paymentModal.message} 
            onClose={closePaymentModal} 
            onConfirm={paymentModal.onConfirm}
        />
      )}

      <div className="relative z-10">
        
        <Navbar 
          onLogout={handleLogout} 
          userRole={userRole} 
          loadingRole={loadingRole} 
          userName={userName}
          // userId y subscriptionEnd quitados porque Navbar ya no los usa
          autoRenew={autoRenew}
          onCancelSub={handleCancelSubscription}
          onSubscribe={handleSimulateUpgrade} 
          onReactivate={handleReactivateSubscription}
          onDeleteAccount={handleDeleteAccount}
          
          // 👇 PASAMOS LA FUNCIÓN PARA ABRIR EL MODAL DE SETTINGS
          onOpenSettings={() => setShowSettings(true)}
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
                    onUnlock={handleSimulateUpgrade}
                />
            } />

            <Route path="/entrenamiento" element={
                <EntrenoPage 
                    initialData={initialCalcData}
                    userId={session.user.id}
                    userRole={userRole}
                    userGoal={initialCalcData?.goal || 'mantener'}
                    onPlanCreated={updateWorkoutPlan}
                    onUnlock={handleSimulateUpgrade}
                />
            } />

            <Route path="/seguimiento" element={
                <TrackerPage 
                    macros={userMacros || initialCalcData}
                    userId={session.user.id}
                    userRole={userRole}
                    onUnlock={handleSimulateUpgrade}
                />
            } />
          </Routes>
        </div>
      </div>

      {/* 👇 MODAL DE CONFIGURACIÓN DE CUENTA */}
      {showSettings && (
        <AccountSettingsModal 
            userId={session.user.id}
            currentName={userName}
            onClose={() => setShowSettings(false)}
            onUpdateSuccess={() => {
                // Si cambiaron el nombre, recargamos para que se vea en el Navbar
                window.location.reload(); 
            }}
        />
      )}

    </div>
  );
}

export default App;