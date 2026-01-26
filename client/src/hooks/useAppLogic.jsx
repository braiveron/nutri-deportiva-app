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
        const data = await api.getBiometrics(userId);
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
        console.error("Error biometría", error);
    }
  };

  const fetchUserProfile = async (userId) => {
    setLoadingRole(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('subscription_tier, subscription_end_date, auto_renew')
        .eq('id', userId)
        .maybeSingle(); 
      
      if (error) throw error;
      
      if (data) {
        setSubEndDate(data.subscription_end_date);
        setAutoRenew(data.auto_renew);
        const hoy = new Date();
        const vencimiento = data.subscription_end_date ? new Date(data.subscription_end_date) : null;
        
        // Lógica: Si ya venció es FREE, sino mantenemos el tier que tenga (PRO)
        if (vencimiento && vencimiento < hoy) {
            setUserRole('free');
        } else {
            setUserRole(data.subscription_tier);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.id]);


  // 👇 DETECCIÓN DE PAGO CON "CANDADO" (Evita bucles infinitos)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const status = params.get("collection_status");
    
    // Solo entramos si hay status, sesión y NO hemos procesado esto ya en esta sesión
    const yaProcesado = sessionStorage.getItem("payment_has_been_processed");

    if (status && session?.user?.id) {
        
        // 1. SIEMPRE LIMPIAMOS LA URL PRIMERO
        window.history.replaceState({}, document.title, location.pathname);

        // 2. SI YA LO PROCESAMOS ANTES, PARAMOS AQUÍ (EL FIX DEFINITIVO)
        if (yaProcesado === "true") {
            console.log("🛑 Pago ya procesado anteriormente. Omitiendo modal.");
            return; 
        }

        if (status === "approved") {
            // 👇 MARCAMOS INMEDIATAMENTE COMO PROCESADO
            sessionStorage.setItem("payment_has_been_processed", "true");

            const processPayment = async () => {
                console.log("⚡ Procesando pago...");
                
                try {
                    const response = await api.subscribeUser(session.user.id);
    
                    if (response.success) {
                        setUserRole("pro");
                        setAutoRenew(true);
                        
                        // Recargamos datos para confirmar fechas
                        const updatedProfile = await fetchUserProfile(session.user.id);
                        
                        let modalTitle = '¡Bienvenido a PRO!';
                        let modalMsg = 'Tu pago se procesó correctamente.';
                        
                        if (updatedProfile?.subscription_end_date) {
                            const hoy = new Date();
                            const vencimiento = new Date(updatedProfile.subscription_end_date);
                            const diffTime = Math.abs(vencimiento - hoy);
                            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
                            const fechaTexto = vencimiento.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' });
    
                            if (diffDays < 28) {
                                modalTitle = '¡Membresía Reactivada!';
                                modalMsg = `La renovación automática está lista. Tu próximo cobro será el ${fechaTexto} (mantienes tu fecha de corte original).`;
                            } else {
                                modalTitle = '¡Bienvenido al Equipo!';
                                modalMsg = `Tu suscripción está activa. Tienes acceso cubierto hasta el ${fechaTexto}.`;
                            }
                        }
    
                        setPaymentModal({
                            show: true,
                            type: 'success',
                            title: modalTitle,
                            message: modalMsg,
                            onConfirm: null
                        });
                    }
                } catch (err) {
                    console.error(err);
                    // Si falló, quizás querramos permitir reintentar, así que borramos el candado
                    sessionStorage.removeItem("payment_has_been_processed");
                    setPaymentModal({ show: true, type: 'error', title: 'Error', message: 'Hubo un problema, contáctanos.', onConfirm: null });
                }
            };
    
            processPayment();

        } else if (status === "failure") {
             // En fallo no ponemos candado para que pueda intentar de nuevo
             setPaymentModal({ show: true, type: 'error', title: 'Pago Rechazado', message: 'No se pudo procesar el pago.', onConfirm: null });
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
    
    const isReactivation = userRole === 'pro';
    localStorage.setItem("payment_intent", isReactivation ? "reactivation" : "new");
    
    // 👇 NUEVO: "Abrimos el candado" para permitir que el próximo pago sí muestre el modal
    sessionStorage.removeItem("payment_has_been_processed"); 

    try {
        const data = await api.createPaymentPreference(session.user.id);
        if (data.init_point) {
            window.location.href = data.init_point;
        } else {
            setPaymentModal({ show: true, type: 'error', title: 'Error', message: 'No se pudo iniciar el pago.', onConfirm: null });
        }
    } catch {
        setPaymentModal({ show: true, type: 'error', title: 'Error de Conexión', message: 'Verifica tu internet.', onConfirm: null });
    }
  };

  const proceedWithCancellation = async () => {
      // 1. ESTADO DE CARGA: No cerramos, cambiamos a loading
      setPaymentModal({
          show: true,
          type: 'loading',
          title: 'Procesando...',
          message: 'Estamos gestionando la cancelación, por favor espera un momento.',
          onConfirm: null
      });

      if (!session) return;

      try {
        const data = await api.cancelSubscription(session.user.id);
        
        if (data.success) {
            setAutoRenew(false); 
            // 2. ESTADO DE ÉXITO
            setPaymentModal({ 
                show: true, type: 'success', title: 'Suscripción Cancelada', 
                message: 'Tu suscripción seguirá activa hasta el final del periodo actual. No se te volverá a cobrar.',
                onConfirm: null 
            });
            await fetchUserProfile(session.user.id);
        } else {
            setPaymentModal({ show: true, type: 'error', title: 'Error', message: data.error, onConfirm: null });
        }
      } catch {
        setPaymentModal({ show: true, type: 'error', title: 'Error', message: 'Error de conexión.', onConfirm: null });
    }
  };

  // 👇 NUEVA FUNCIÓN: REACTIVACIÓN DIRECTA (SIN IR A MERCADOPAGO)
  const handleReactivateSubscription = async () => {
      // 1. ESTADO DE CARGA
      setPaymentModal({
          show: true,
          type: 'loading',
          title: 'Reactivando...',
          message: 'Estamos restaurando tu renovación automática.',
          onConfirm: null
      });

      if (!session) return;

      try {
        // Asumiendo que api.subscribeUser reactiva el flag si la cuenta sigue vigente
        const response = await api.subscribeUser(session.user.id);
        
        if (response.success) {
            setAutoRenew(true);
            
            // Calculamos fecha para el mensaje
            const updatedProfile = await fetchUserProfile(session.user.id);
            let fechaTexto = "el próximo vencimiento";
            
            if (updatedProfile?.subscription_end_date) {
                const dateObj = new Date(updatedProfile.subscription_end_date);
                fechaTexto = dateObj.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' });
            }

            // 2. ESTADO DE ÉXITO
            setPaymentModal({ 
                show: true, type: 'success', title: '¡Membresía Reactivada!', 
                message: `La renovación automática está activa de nuevo. Tu próximo cobro será el ${fechaTexto}.`,
                onConfirm: null 
            });
        } else {
            setPaymentModal({ show: true, type: 'error', title: 'Error', message: 'No se pudo reactivar.', onConfirm: null });
        }
      } catch {
        setPaymentModal({ show: true, type: 'error', title: 'Error', message: 'Error de conexión.', onConfirm: null });
    }
  };

  const handleCancelSubscription = async () => {
    if (!session) return;
    setPaymentModal({
        show: true,
        type: 'confirm',
        title: '¿Cancelar renovación automática?',
        message: 'Seguirás siendo PRO hasta que termine tu mes actual, pero perderás el acceso después.',
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
     setPaymentModal({ ...paymentModal, show: false });
  };

  return {
    session,
    userMacros,
    userRole,
    initialCalcData,
    autoRenew,
    subEndDate,
    loadingRole,
    checkingBiometrics,
    paymentModal,         
    closePaymentModal,    
    handleCalculationSuccess,
    handleSimulateUpgrade, 
    handleCancelSubscription,
    handleReactivateSubscription, // 👈 ¡IMPORTANTÍSIMO! AHORA ESTÁ EXPORTADA
    handleLogout,
    updateWorkoutPlan
  };
}