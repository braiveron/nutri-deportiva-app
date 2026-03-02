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
  const [autoRenew, setAutoRenew] = useState(false);
  const [subEndDate, setSubEndDate] = useState(null);
  
  // 👇 NUEVO ESTADO PARA EL NOMBRE REAL DE LA BASE DE DATOS
  const [dbUserName, setDbUserName] = useState(null);

  // Estados de UI
  const [loadingRole, setLoadingRole] = useState(false);
  const [checkingBiometrics, setCheckingBiometrics] = useState(true);
  
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
      // 👇 AQUÍ AGREGAMOS 'nombre' y 'apellido' A LA CONSULTA
      const { data, error } = await supabase
        .from('profiles')
        .select('subscription_tier, subscription_end_date, auto_renew, role, nombre, apellido')
        .eq('id', userId)
        .maybeSingle(); 
      
      if (error) throw error;
      
      if (data) {
        setSubEndDate(data.subscription_end_date);
        setAutoRenew(data.auto_renew);
        
        // 👇 LÓGICA DE NOMBRE COMPLETO
        let fullNameDB = data.nombre || "";
        if (data.apellido) {
            fullNameDB += ` ${data.apellido}`;
        }
        
        if (fullNameDB.trim()) setDbUserName(fullNameDB.trim());

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
            setUserMacros(null); setUserRole(null); setInitialCalcData(null); setAutoRenew(false); setSubEndDate(null); setDbUserName(null);
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
  },
      // eslint-disable-next-line react-hooks/exhaustive-deps
  [session]); 

  // 👇 DETECCIÓN DE PAGO (CORREGIDA Y SIN BLOQUEOS)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const status = params.get("collection_status");
    
    if (status === "approved" && session?.user?.id) {
        
        if (paymentModal.show) return;

        const processPayment = async () => {
            console.log("💳 [UseAppLogic] Detectado pago aprobado. Procesando...");
            
            setPaymentModal({ 
                show: true, type: 'loading', title: 'Confirmando Pago...', message: 'Estamos activando tu membresía en el sistema.', onConfirm: null 
            });

            try {
                const response = await api.subscribeUser(session.user.id);
                
                if (response.success) {
                    console.log("✅ [UseAppLogic] Suscripción activada en DB.");
                    
                    setUserRole("pro");
                    setAutoRenew(true);
                    
                    const updatedProfile = await fetchUserProfile(session.user.id);
                    
                    let modalTitle = '¡Bienvenido a PRO!';
                    let modalMsg = 'Tu pago se procesó correctamente.';
                    
                    if (updatedProfile?.subscription_end_date) {
                        const vencimiento = new Date(updatedProfile.subscription_end_date);
                        const fechaTexto = vencimiento.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
                        modalMsg = `Tu suscripción está activa hasta el ${fechaTexto}.`;
                    }

                    setPaymentModal({
                        show: true, 
                        type: 'confirm', 
                        title: modalTitle, 
                        message: modalMsg, 
                        onConfirm: () => {
                            setPaymentModal(prev => ({ ...prev, show: false }));
                            navigate(location.pathname, { replace: true }); 
                        }
                    });
                }
            } catch (err) {
                console.error("❌ Error activando suscripción:", err);
                setPaymentModal({ show: true, type: 'error', title: 'Error', message: 'Hubo un problema activando tu cuenta.', onConfirm: null });
            }
        };
        processPayment();
    }
  },    // eslint-disable-next-line react-hooks/exhaustive-deps 
  [location, session, navigate]);

  // --- HANDLERS ---

  const handleCalculationSuccess = async (plan) => {
    setUserMacros(plan);
    if (session?.user?.id) await loadBiometrics(session.user.id);
  };

  const handleSimulateUpgrade = async () => {
    if (!session) return;
    try {
        console.log("🚀 Iniciando pago simulado...");
        const data = await api.createPaymentPreference(session.user.id); 
        if (data.init_point) window.location.href = data.init_point;
    } catch {
        setPaymentModal({ show: true, type: 'error', title: 'Error', message: 'Error de conexión.', onConfirm: null });
    }
  };

  // 👇 LÓGICA CORREGIDA: Mensaje de éxito con fecha real
  const proceedWithCancellation = async () => {
      setPaymentModal({ show: true, type: 'loading', title: 'Procesando...', message: 'Gestionando cancelación...', onConfirm: null });
      if (!session) return;
      
      try {
        const data = await api.cancelSubscription(session.user.id);
        
        if (data.success) {
            setAutoRenew(false); 
            
            // Calculamos el mensaje final
            let msgFinal = 'Acceso activo hasta fin de ciclo.';
            if (subEndDate) {
                const fecha = new Date(subEndDate);
                const fechaTexto = fecha.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
                msgFinal = `Acceso activo hasta el ${fechaTexto}.`;
            }

            setPaymentModal({ 
                show: true, 
                type: 'success', // Aquí usamos success normal, con botón "ENTENDIDO"
                title: 'Cancelada', 
                message: msgFinal, 
                onConfirm: null 
            });
            
            await fetchUserProfile(session.user.id);
        }
      } catch {
        setPaymentModal({ show: true, type: 'error', title: 'Error', message: 'Error de conexión.', onConfirm: null });
    }
  };

  const handleDeleteAccount = () => {
    setPaymentModal({
      show: true, type: "error", title: "⚠️ ¿ELIMINAR CUENTA?", message: "Esta acción es irreversible.",
      onConfirm: async () => {
        try {
          const response = await api.deleteUserAccount(session.user.id);
          if (response.success || response.message) {
            closePaymentModal();
            await supabase.auth.signOut();
            window.localStorage.clear();
            window.sessionStorage.clear();
            window.location.replace("/"); 
          } else { throw new Error("Error borrando"); }
        } catch {
          setPaymentModal({ show: true, type: 'error', title: 'Error Crítico', message: 'No pudimos eliminar la cuenta.', onConfirm: null });
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
    
    let mensaje = 'Seguirás siendo PRO hasta fin de mes.';
    if (subEndDate) {
        const fecha = new Date(subEndDate);
        const fechaTexto = fecha.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
        mensaje = `Seguirás siendo PRO hasta el ${fechaTexto}.`;
    }

    setPaymentModal({ 
        show: true, 
        type: 'confirm', 
        title: '¿Cancelar renovación?', 
        message: mensaje, 
        onConfirm: proceedWithCancellation 
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

  // 👇 IMPORTANTE: Pasamos dbUserName al return para que App.jsx lo use
  return {
    session, userMacros, userRole, initialCalcData, autoRenew, subEndDate,
    dbUserName, // 👈 NUEVO
    loadingRole, checkingBiometrics, paymentModal, updateWorkoutPlan,
    closePaymentModal, handleCalculationSuccess, handleSimulateUpgrade, 
    handleCancelSubscription, handleReactivateSubscription, handleLogout,
    handleDeleteAccount, loadBiometrics
  };
} 