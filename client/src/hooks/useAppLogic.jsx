import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom"; 
import { supabase } from "../supabase";
import { api } from "../services/api";

export function useAppLogic() {
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
  
  // Modal State
  const [paymentModal, setPaymentModal] = useState({ 
      show: false, type: 'success', title: '', message: '', onConfirm: null 
  });

  const navigate = useNavigate(); 
  const location = useLocation(); 

  // --- FUNCIONES INTERNAS ---

  const loadBiometrics = async (userId) => {
    try {
      const res = await api.getBiometrics(userId);
      if (res?.existe && res?.datos?.target_macros) {
          const macros = res.datos.target_macros;
          if (macros.todos_los_planes) {
              const objetivo = res.datos.goal || 'mantener';
              setUserMacros(macros.todos_los_planes[objetivo]);
          } else {
              setUserMacros(macros);
          }
          setInitialCalcData(res.datos);
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
        .select('subscription_tier, subscription_end_date, auto_renew, role')
        .eq('id', userId)
        .maybeSingle(); 
      
      if (error) throw error;
      
      if (data) {
        setSubEndDate(data.subscription_end_date);
        setAutoRenew(data.auto_renew);
        
        if (data.role === 'admin') {
            setUserRole('admin');
        } else {
            const hoy = new Date();
            const vencimiento = data.subscription_end_date ? new Date(data.subscription_end_date) : null;
            
            if (vencimiento && vencimiento < hoy) {
                setUserRole('free');
            } else {
                setUserRole(data.subscription_tier || 'free');
            }
        }
        return data;
      }
    } catch (error) {
      console.error("Error perfil:", error);
    } finally {
      setLoadingRole(false);
    }
    return null;
  };

  // --- EFECTOS ---
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
        setSession(session);
        if(!session) setCheckingBiometrics(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        setSession(session);
        if(!session) { 
            setCheckingBiometrics(false);
            setUserMacros(null); setUserRole(null); setInitialCalcData(null); setAutoRenew(false); setSubEndDate(null);
        }
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session?.user?.id) {
       if (!userMacros && !initialCalcData) setCheckingBiometrics(true);
       Promise.all([fetchUserProfile(session.user.id), loadBiometrics(session.user.id)])
         .finally(() => setCheckingBiometrics(false));
    }
  },    // eslint-disable-next-line react-hooks/exhaustive-deps
 [session?.user?.id]);


  // DETECCIÓN DE PAGO
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const status = params.get("collection_status");
    const yaProcesado = sessionStorage.getItem("payment_has_been_processed");

    if (status && session?.user?.id) {
        window.history.replaceState({}, document.title, location.pathname);

        if (yaProcesado === "true") return; 

        if (status === "approved") {
            sessionStorage.setItem("payment_has_been_processed", "true");

            const processPayment = async () => {
                try {
                    const response = await api.subscribeUser(session.user.id);
                    if (response.success) {
                        setUserRole("pro");
                        setAutoRenew(true);
                        const updatedProfile = await fetchUserProfile(session.user.id);
                        
                        let modalTitle = '¡Bienvenido a PRO!';
                        let modalMsg = 'Tu pago se procesó correctamente.';
                        
                        if (updatedProfile?.subscription_end_date) {
                            const vencimiento = new Date(updatedProfile.subscription_end_date);
                            const fechaTexto = vencimiento.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' });
                            modalMsg = `Tu suscripción está activa hasta el ${fechaTexto}.`;
                        }
    
                        setPaymentModal({
                            show: true, type: 'success', title: modalTitle, message: modalMsg, onConfirm: null
                        });
                    }
                } catch (err) {
                    console.error(err);
                    sessionStorage.removeItem("payment_has_been_processed");
                    setPaymentModal({ show: true, type: 'error', title: 'Error', message: 'Hubo un problema.', onConfirm: null });
                }
            };
            processPayment();
        }
    }
  }, [location, session]);

  // --- HANDLERS ---

  const handleCalculationSuccess = async (plan) => {
    setUserMacros(plan);
    if (session?.user?.id) await loadBiometrics(session.user.id);
  };

  const handleSimulateUpgrade = async () => {
    if (!session) return;
    try {
        const data = await api.createPaymentPreference(session.user.id);
        if (data.init_point) window.location.href = data.init_point;
    } catch {
        setPaymentModal({ show: true, type: 'error', title: 'Error', message: 'Error de conexión.', onConfirm: null });
    }
  };

  const proceedWithCancellation = async () => {
      setPaymentModal({ show: true, type: 'loading', title: 'Procesando...', message: 'Gestionando cancelación...', onConfirm: null });
      if (!session) return;
      try {
        const data = await api.cancelSubscription(session.user.id);
        if (data.success) {
            setAutoRenew(false); 
            setPaymentModal({ show: true, type: 'success', title: 'Cancelada', message: 'Acceso activo hasta fin de ciclo.', onConfirm: null });
            await fetchUserProfile(session.user.id);
        }
      } catch {
        setPaymentModal({ show: true, type: 'error', title: 'Error', message: 'Error de conexión.', onConfirm: null });
    }
  };

// 🔥 CORRECCIÓN: ELIMINACIÓN DE CUENTA EN useAppLogic.js
  const handleDeleteAccount = () => {
    setPaymentModal({
      show: true,
      type: "error",
      title: "⚠️ ¿ELIMINAR CUENTA?",
      message: "Esta acción es irreversible. Se borrarán todos tus progresos y planes.",
      onConfirm: async () => {
        try {
          // 1. Llamada a la API para borrar datos
          const response = await api.deleteUserAccount(session.user.id);
          
          if (response.success || response.message) {
            // 2. Cerramos modal PRIMERO para evitar bloqueos visuales
            closePaymentModal();

            // 3. Forzamos el SignOut de Supabase
            await supabase.auth.signOut();
            
            // 4. Limpieza total de almacenamiento
            window.localStorage.clear();
            window.sessionStorage.clear();
            
            // 5. Redirección forzada al login
            window.location.replace("/"); 
          } else {
            throw new Error("El servidor no confirmó el borrado");
          }
        } catch (err) {
          console.error("Error al eliminar cuenta:", err);
          setPaymentModal({ 
            show: true, 
            type: 'error', 
            title: 'Error Crítico', 
            message: 'No pudimos eliminar la cuenta. Intenta cerrar sesión manualmente.', 
            onConfirm: null 
          });
        }
      }
    });
  };

  const handleReactivateSubscription = async () => {
      setPaymentModal({ show: true, type: 'loading', title: 'Reactivando...', message: 'Restaurando renovación...', onConfirm: null });
      if (!session) return;
      try {
        const response = await api.subscribeUser(session.user.id);
        if (response.success) {
            setAutoRenew(true);
            setPaymentModal({ show: true, type: 'success', title: '¡Reactivada!', message: `Renovación activa nuevamente.`, onConfirm: null });
            await fetchUserProfile(session.user.id);
        }
      } catch {
        setPaymentModal({ show: true, type: 'error', title: 'Error', message: 'Error de conexión.', onConfirm: null });
    }
  };

  const handleCancelSubscription = async () => {
    if (!session) return;
    setPaymentModal({
        show: true, type: 'confirm', title: '¿Cancelar renovación?', message: 'Seguirás siendo PRO hasta fin de mes.', onConfirm: proceedWithCancellation 
    });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const updateWorkoutPlan = (nuevoPlan) => {
    setInitialCalcData(prev => ({ ...prev, workout_plan: nuevoPlan }));
  };

  const closePaymentModal = () => {
    setPaymentModal(prev => ({ ...prev, show: false }));
  };

  return {
    session, userMacros, userRole, initialCalcData, autoRenew, subEndDate,
    loadingRole, checkingBiometrics, paymentModal, updateWorkoutPlan,
    closePaymentModal, handleCalculationSuccess, handleSimulateUpgrade, 
    handleCancelSubscription, handleReactivateSubscription, handleLogout,
    handleDeleteAccount
  };
}