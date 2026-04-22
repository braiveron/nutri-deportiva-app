import { useState, useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAppLogic } from "./hooks/useAppLogic"; 

// Componentes
import Navbar from "./components/Navbar";
import Auth from "./components/Auth";
import StatusModal from "./components/StatusModal"; 
import AccountSettingsModal from "./components/AccountSettingsModal";
import SupportModal from "./components/SupportModal";
import Footer from "./components/Footer"; 
import ChatBot from "./components/ChatBot"; 
import InstallPrompt from "./components/InstallPrompt"; // <-- IMPORTADO AQUÍ

// Páginas
import PerfilPage from "./pages/PerfilPage";
import CocinaPage from "./pages/CocinaPage";
import EntrenoPage from "./pages/EntrenoPage";
import TrackerPage from "./pages/TrackerPage";
import AdminPage from "./pages/AdminPage";
import WelcomePage from "./pages/WelcomePage"; 

// --- 🏋️‍♂️ NUEVO COMPONENTE DE CARGA TEMÁTICO ---
const ThematicLoader = () => {
  const [tick, setTick] = useState(0);

  const icons = [
    <path key="dumbbell" d="M6 12h12M2 9a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V9zm16 0a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1V9z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>,
    <g key="bowl" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none">
      <path d="M4 11h16a1 1 0 0 1 1 1v1a7 7 0 0 1-7 7h-4a7 7 0 0 1-7-7v-1a1 1 0 0 1 1-1Z" />
      <path d="M8 7c0-1.1.9-2 2-2" />
      <path d="M12 7V3" />
      <path d="M16 7c0-1.1.9-2 2-2" />
    </g>,
    <path key="fire" d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.1.2-2.2.6-3.3a7 7 0 0 0 2.9 2.8Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>,
    <path key="ecg" d="M22 12h-4l-3 9L9 3l-3 9H2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>,
  ];

  const phrases = [
    "Calibrando mancuernas",
    "Seleccionando ingredientes",
    "Calculando macronutrientes",
    "Optimizando tu rutina",
    "Preparando tu transformación"
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setTick((prev) => prev + 1);
    }, 800); 

    return () => clearInterval(interval);
  }, []);

  const iconIndex = tick % icons.length;
  const phraseIndex = Math.floor(tick / 2) % phrases.length;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] opacity-50"></div>
        <div className="relative z-10 flex flex-col items-center">
            <div className="w-24 h-24 rounded-full border-4 border-gray-100 flex items-center justify-center mb-6 relative shadow-xl">
                <div className="absolute inset-0 rounded-full border-4 border-t-sportRed border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
                <svg viewBox="0 0 24 24" className="w-10 h-10 text-sportRed animate-fade-in transition-all duration-300">
                  {icons[iconIndex]}
                </svg>
            </div>
            <h3 className="text-xl font-display font-bold text-sportDark italic animate-pulse">
               {phrases[phraseIndex]}
            </h3>
        </div>
    </div>
  );
};

// --- APP PRINCIPAL ---

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
    subEndDate,
    dbUserName,
    loadBiometrics,
    closePaymentModal,
    handleCalculationSuccess, 
    handleSimulateUpgrade, 
    handleCancelSubscription,
    handleReactivateSubscription,
    handleDeleteAccount,
    handleLogout,
    updateWorkoutPlan 
  } = useAppLogic();

  const [showSettings, setShowSettings] = useState(false);
  const [showSupport, setShowSupport] = useState(false); 

  if (checkingBiometrics) {
      return <ThematicLoader />;
  }

  if (!session) {
    return <Auth />;
  }

  const fullName = dbUserName || session.user.user_metadata.full_name || "Usuario";
  const firstName = fullName.split(' ')[0]; 
  const hasBiometrics = initialCalcData && initialCalcData.peso > 0;

  return (
    <div className="min-h-screen flex flex-col relative bg-gray-50 text-gray-800 font-sans overflow-x-hidden selection:bg-sportRed selection:text-white">
      
      <div 
        className="fixed inset-0 z-0 pointer-events-none opacity-40" 
        style={{
              backgroundImage: 'radial-gradient(#94a3b8 1px, transparent 1px)',
              backgroundSize: '24px 24px'
        }}
      ></div>

      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-sportRed/10 rounded-full blur-3xl -z-10 animate-pulse"></div>

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
        subEndDate={subEndDate}
      />

      <main className="flex-1 w-full flex flex-col relative z-10">
        <Routes>
          <Route path="/" element={<Navigate to={hasBiometrics ? "/perfil" : "/bienvenida"} replace />} />
          <Route path="/bienvenida" element={<WelcomePage userName={firstName} />} />
          <Route path="/perfil" element={<PerfilPage initialData={initialCalcData} userId={session.user.id} onCalcSuccess={handleCalculationSuccess} />} />
          <Route path="/cocina" element={<CocinaPage macros={userMacros} userId={session.user.id} userRole={userRole} onUnlock={handleSimulateUpgrade} />} />
          <Route path="/entrenamiento" element={<EntrenoPage initialData={initialCalcData} userId={session.user.id} userRole={userRole} userGoal={initialCalcData?.goal || 'mantener'} onPlanCreated={updateWorkoutPlan} onUnlock={handleSimulateUpgrade} />} />
          <Route path="/seguimiento" element={<TrackerPage macros={userMacros || initialCalcData} userId={session.user.id} userRole={userRole} onUnlock={handleSimulateUpgrade} onWeightChanged={() => loadBiometrics(session.user.id)} />} />
          <Route path="/admin" element={<AdminPage userRole={userRole} />} />
        </Routes>
      </main>
      
      <Footer userId={session?.user?.id}/>

      {paymentModal.show && (
        <StatusModal 
            type={paymentModal.type} 
            title={paymentModal.title} 
            message={paymentModal.message} 
            onClose={closePaymentModal} 
            onConfirm={paymentModal.onConfirm}
        />
      )}

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

      {session && session.user && <ChatBot userId={session.user.id} dbUserName={dbUserName}/>}

      {/* 🚀 COMPONENTE DE INSTALACIÓN AGREGADO AQUÍ */}
      <InstallPrompt />

    </div>
  );
}

export default App;