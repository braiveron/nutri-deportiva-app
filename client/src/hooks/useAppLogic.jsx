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
  const [dbUserName, setDbUserName] = useState(null);

  // Estados de UI
  const [loadingRole, setLoadingRole] = useState(false);
  const [checkingBiometrics, setCheckingBiometrics] = useState(true);
  
  const [paymentModal, setPaymentModal] = useState({ 
      show: false, type: 'success', title: '', message: '', onConfirm: null 
  });

  const navigate = useNavigate(); 
  const location = useLocation(); 

  // URL de tu Edge Function (Centralizada)
  const EDGE_FUNCTION_URL = "https://wmxfwlzbgdypyjdtffbp.supabase.co/functions/v1/mercadopago-webhook";

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
        .select('subscription_tier, subscription_end_date, auto_renew, role, nombre, apellido')
        .eq('id', userId)
        .maybeSingle(); 
      
      if (error) throw error;
      
      if (data) {
        setSubEndDate(data.subscription_end_date);
        setAutoRenew(data.auto_renew);
        
        let fullNameDB = data.nombre || "";
        if (data.apellido) fullNameDB += ` ${data.apellido}`;
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
  }, [session]); 

  // 👇 DETECCIÓN DE PAGO (CORREGIDA PARA USAR SUPABASE EDGE FUNCTIONS)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const status = params.get("collection_status");
    
    if (status === "approved" && session?.user?.id) {
        if (paymentModal.show) return;

        const processPayment = async () => {
            console.log("💳 [UseAppLogic] Pago aprobado. Activando en Supabase...");
            
            setPaymentModal({ 
                show: true, type: 'loading', title: 'Confirmando Pago...', message: 'Estamos activando tu membresía en el sistema.', onConfirm: null 
            });

            try {
                // ✅ Llamada a la Edge Function para actualizar el Rol del usuario
                const response = await fetch(EDGE_FUNCTION_URL, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        userId: session.user.id,
                        isActionUpdateRole: true 
                    }),
                });
                
                const resData = await response.json();
                
                if (resData.success) {
                    setUserRole("pro");
                    setAutoRenew(true);
                    
                    const updatedProfile = await fetchUserProfile(session.user.id);
                    
                    let modalMsg = 'Tu pago se procesó correctamente.';
                    if (updatedProfile?.subscription_end_date) {
                        const vencimiento = new Date(updatedProfile.subscription_end_date);
                        const fechaTexto = vencimiento.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
                        modalMsg = `Tu suscripción está activa hasta el ${fechaTexto}.`;
                    }

                    setPaymentModal({
                        show: true, 
                        type: 'confirm', 
                        title: '¡Bienvenido a PRO!', 
                        message: modalMsg, 
                        onConfirm: () => {
                            setPaymentModal(prev => ({ ...prev, show: false }));
                            navigate("/perfil", { replace: true }); 
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
  }, [location, session, navigate]);

  // --- HANDLERS ---

  const handleCalculationSuccess = async (plan) => {
    setUserMacros(plan);
    if (session?.user?.id) await loadBiometrics(session.user.id);
  };

  const handleSimulateUpgrade = async () => {
    try {
      setPaymentModal({ show: true, type: 'loading', title: 'Generando Pago', message: 'Conectando con Mercado Pago...', onConfirm: null });
      
      const response = await fetch(EDGE_FUNCTION_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: session.user.id,
          planPrice: 9990,
          planName: "Plan NutriSport Premium",
          isActionCreatePreference: true 
        }),
      });

      const data = await response.json();
      if (data.init_point) {
        window.location.href = data.init_point;
      }
    } catch (error) {
      console.error("❌ Error en upgrade:", error);
      setPaymentModal({ show: true, type: 'error', title: 'Error', message: 'No se pudo generar el link de pago.', onConfirm: null });
    }
  };

  const proceedWithCancellation = async () => {
      setPaymentModal({ show: true, type: 'loading', title: 'Procesando...', message: 'Gestionando cancelación...', onConfirm: null });
      if (!session) return;
      
      try {
        const data = await api.cancelSubscription(session.user.id);
        if (data.success) {
            setAutoRenew(false); 
            let msgFinal = 'Acceso activo hasta fin de ciclo.';
            if (subEndDate) {
                const fecha = new Date(subEndDate);
                msgFinal = `Acceso activo hasta el ${fecha.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}.`;
            }

            setPaymentModal({ 
                show: true, type: 'success', title: 'Cancelada', message: msgFinal, onConfirm: null 
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
        const response = await fetch(EDGE_FUNCTION_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId: session.user.id, isActionUpdateRole: true }),
        });
        const resData = await response.json();
        if (resData.success) {
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
        mensaje = `Seguirás siendo PRO hasta el ${fecha.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}.`;
    }
    setPaymentModal({ 
        show: true, type: 'confirm', title: '¿Cancelar renovación?', message: mensaje, onConfirm: proceedWithCancellation 
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
    dbUserName, loadingRole, checkingBiometrics, paymentModal, updateWorkoutPlan,
    closePaymentModal, handleCalculationSuccess, handleSimulateUpgrade, 
    handleCancelSubscription, handleReactivateSubscription, handleLogout,
    handleDeleteAccount, loadBiometrics
  };
}