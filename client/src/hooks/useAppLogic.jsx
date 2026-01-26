import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
  
  const navigate = useNavigate(); 

  // --- FUNCIONES INTERNAS (Helpers) ---

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
        .single();
      
      if (error) throw error;
      
      if (data) {
        setSubEndDate(data.subscription_end_date);
        setAutoRenew(data.auto_renew);
        const hoy = new Date();
        const vencimiento = data.subscription_end_date ? new Date(data.subscription_end_date) : null;
        
        if (vencimiento && vencimiento < hoy) {
            setUserRole('free');
        } else {
            setUserRole(data.subscription_tier);
        }
      }
    } catch (error) {
      console.error("Error perfil:", error);
    } finally {
      setLoadingRole(false);
    }
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
            setUserMacros(null);
            setUserRole(null);
            setInitialCalcData(null);
            setAutoRenew(false);
            setSubEndDate(null);
        }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session?.user?.id) {
       if (!userMacros && !initialCalcData) setCheckingBiometrics(true);
       
       Promise.all([
           fetchUserProfile(session.user.id),
           loadBiometrics(session.user.id)
       ]).finally(() => {
           setCheckingBiometrics(false);
       });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.id]);

  // --- HANDLERS PÚBLICOS (Los que usará la App) ---

  const handleCalculationSuccess = async (plan) => {
    setUserMacros(plan);
    if (session?.user?.id) await loadBiometrics(session.user.id);
  };

  const handleSimulateUpgrade = async () => {
    if (!session) return;
    const confirm = window.confirm("¿Simular pago de 1 mes ($4.99)?");
    if (!confirm) return;

    try {
        const data = await api.subscribeUser(session.user.id);
        if (data.success) {
            setUserRole('pro');
            setAutoRenew(true);
            const visualDate = new Date();
            visualDate.setMonth(visualDate.getMonth() + 1);
            setSubEndDate(visualDate.toISOString());
            alert(`¡Suscripción activa! Bienvenido a PRO.`);
            await fetchUserProfile(session.user.id);
        } else {
            alert("Error: " + (data.error || "No se pudo procesar"));
        }
    } catch {
        alert("Error de conexión");
    }
  };

  const handleCancelSubscription = async () => {
    if (!session) return;
    try {
        const data = await api.cancelSubscription(session.user.id);
        if (data.success) {
            setAutoRenew(false);
            alert("Suscripción cancelada. Seguirás siendo PRO hasta que venza el periodo actual.");
            await fetchUserProfile(session.user.id);
        } else {
            alert("Error: " + data.error);
        }
    } catch {
        alert("Error de conexión al cancelar.");
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  // Función extra para actualizar el plan desde EntrenoPage
  const updateWorkoutPlan = (nuevoPlan) => {
    setInitialCalcData(prev => ({ ...prev, workout_plan: nuevoPlan }));
  };

  // RETORNAMOS SOLO LO QUE LA VISTA NECESITA
  return {
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
  };
}