import { useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAppLogic } from "./hooks/useAppLogic"; 

// Componentes
import Navbar from "./components/Navbar";
import Auth from "./components/Auth";
import StatusModal from "./components/StatusModal"; 
import AccountSettingsModal from "./components/AccountSettingsModal";
import SupportModal from "./components/SupportModal";
import Footer from "./components/Footer"; // 👈 IMPORTADO

// Páginas
import PerfilPage from "./pages/PerfilPage";
import CocinaPage from "./pages/CocinaPage";
import EntrenoPage from "./pages/EntrenoPage";
import TrackerPage from "./pages/TrackerPage";
import AdminPage from "./pages/AdminPage";
import WelcomePage from "./pages/WelcomePage"; 

function App() {
  const { 
    session, 
    userMacros, 
    userRole, 
    initialCalcData, 
    autoRenew, 
    loadingRole, 
    checkingBiometrics, 
    paymentModal,       
    closePaymentModal,
    handleCalculationSuccess, 
    handleSimulateUpgrade, 
    handleCancelSubscription,
    handleReactivateSubscription,
    handleDeleteAccount,
    handleLogout,
    updateWorkoutPlan 
  } = useAppLogic();

  // Estados de Modales
  const [showSettings, setShowSettings] = useState(false);
  const [showSupport, setShowSupport] = useState(false); 

  // --- RENDERIZADO DE CARGA ---

  if (checkingBiometrics) {
     return (
        // VOLVEMOS AL FONDO BLANCO ORIGINAL
        <div className="min-h-screen flex flex-col items-center justify-center bg-white">
            <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-sportRed mb-4"></div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest animate-pulse">Cargando Sistema...</p>
        </div>
     );
  }

  if (!session) {
    return <Auth />;
  }

  // Lógica de Usuario
  const fullName = session.user.user_metadata.full_name || "Usuario";
  const firstName = fullName.split(' ')[0]; 
  const hasBiometrics = initialCalcData && initialCalcData.peso > 0;

  return (
    // RESTAURADO: bg-gray-50 y text-gray-800
    // MANTENIDO: flex flex-col (para el footer)
    <div className="min-h-screen relative bg-gray-50 text-gray-800 font-sans overflow-x-hidden selection:bg-sportRed selection:text-white flex flex-col">
      
      {/* BACKGROUND ORIGINAL (PUNTOS GRISES) */}
      <div 
        className="fixed inset-0 z-0 pointer-events-none opacity-40" 
        style={{
             backgroundImage: 'radial-gradient(#94a3b8 1px, transparent 1px)',
             backgroundSize: '24px 24px'
        }}
      ></div>

      {/* GLOW ORIGINAL */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-sportRed/10 rounded-full blur-3xl -z-10 animate-pulse"></div>

      {/* CONTENEDOR PRINCIPAL FLEXIBLE */}
      <div className="relative z-10 flex-1 flex flex-col">
        
        <Navbar 
          onLogout={handleLogout} 
          userRole={userRole} 
          loadingRole={loadingRole} 
          userName={fullName}
          autoRenew={autoRenew}
          onCancelSub={handleCancelSubscription}
          onSubscribe={handleSimulateUpgrade} 
          onReactivate={handleReactivateSubscription}
          onDeleteAccount={handleDeleteAccount}
          onOpenSettings={() => setShowSettings(true)}
          onOpenSupport={() => setShowSupport(true)} 
        />

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

        <main className="pb-10 flex-1"> {/* flex-1 para empujar el footer */}
          <Routes>
            <Route 
                path="/" 
                element={<Navigate to={hasBiometrics ? "/perfil" : "/bienvenida"} replace />} 
            />

            <Route 
                path="/bienvenida" 
                element={<WelcomePage userName={firstName} />} 
            />
            
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

            <Route path="/admin" element={
                <AdminPage userRole={userRole} />
            } />
          </Routes>
        </main>

        {/* FOOTER */}
        <Footer />
        
      </div>

      {/* MODALES DE INTERFAZ */}
      {showSettings && (
        <AccountSettingsModal 
            userId={session.user.id}
            currentName={fullName}
            onClose={() => setShowSettings(false)}
            onUpdateSuccess={() => window.location.reload()}
        />
      )}
      
      {showSupport && (
        <SupportModal 
            userId={session.user.id}
            onClose={() => setShowSupport(false)}
        />
      )}

    </div>
  );
}

export default App;