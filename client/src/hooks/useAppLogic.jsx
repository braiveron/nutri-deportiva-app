import { useState, useEffect, useCallback, useRef } from "react"; 
import { useNavigate, useLocation } from "react-router-dom"; 
import { supabase } from "../supabase";
import { api } from "../services/api";

export function useAppLogic() {
  const [session, setSession] = useState(null);
  const [userMacros, setUserMacros] = useState(null);
  const [userRole, setUserRole] = useState(null); 
  const [initialCalcData, setInitialCalcData] = useState(null);
  const [autoRenew, setAutoRenew] = useState(false);
  const [subEndDate, setSubEndDate] = useState(null);
  const [dbUserName, setDbUserName] = useState(null);
  const [loadingRole, setLoadingRole] = useState(true);
  const [checkingBiometrics, setCheckingBiometrics] = useState(true);
  const [paymentModal, setPaymentModal] = useState({ 
      show: false, type: 'success', title: '', message: '', onConfirm: null 
  });

  const navigate = useNavigate(); 
  const location = useLocation(); 
  const isProcessingPayment = useRef(false);
  const EDGE_FUNCTION_URL = "https://wmxfwlzbgdypyjdtffbp.supabase.co/functions/v1/mercadopago-webhook";

  // --- CARGA DE BIOMETRÍA ---
  const loadBiometrics = useCallback(async (userId) => {
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
    } finally {
      // Aseguramos que el estado de biometría no trabe el inicio
      setCheckingBiometrics(false);
    }
  }, []);

  // --- CARGA DE PERFIL ---
  const fetchUserProfile = useCallback(async (userId) => {
    if (!userId) {
      setLoadingRole(false);
      return null;
    }
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
        
        const nombreExistente = data.nombre || "";
        const apellidoExistente = data.apellido || "";
        const fullName = `${nombreExistente} ${apellidoExistente}`.trim();
        setDbUserName(fullName || null);

        if (data.role === 'admin') {
            setUserRole('admin');
        } else {
            const hoy = new Date();
            const vencimiento = data.subscription_end_date ? new Date(data.subscription_end_date) : null;
            setUserRole(vencimiento && vencimiento < hoy ? 'free' : (data.subscription_tier || 'free'));
        }
        return data;
      }
    } catch (error) {
      console.error("Error perfil:", error);
    } finally {
      setLoadingRole(false);
    }
    return null;
  }, []);

  // --- 1. GESTIÓN DE SESIÓN ---
 useEffect(() => {
    const initSession = async () => {
      try {
        // Pequeño margen para que el SW se asiente antes de la primera petición
        const { data: { session: activeSession }, error } = await supabase.auth.getSession();
        
        if (error) {
          if (error.message.includes("Refresh Token")) {
              await supabase.auth.signOut();
              setSession(null);
          }
          throw error;
        }
        setSession(activeSession);
      } catch (err) {
        console.error("Error inicializando sesión:", err);
      } finally {
        // Si después de 500ms no hay sesión, liberamos el spinner de biometría
        // para que el usuario pueda ver el login/bienvenida
        setTimeout(async () => {
          const { data } = await supabase.auth.getSession();
          if (!data?.session) setCheckingBiometrics(false);
        }, 500);
      }
    }

    initSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, newSession) => {
      setSession(prev => (prev?.access_token !== newSession?.access_token ? newSession : prev));
      
      if (event === 'SIGNED_OUT' || event === 'USER_DELETED') {
        setCheckingBiometrics(false); 
        setLoadingRole(false);
        setUserMacros(null); 
        setUserRole(null); 
        setInitialCalcData(null); 
        setAutoRenew(false); 
        setSubEndDate(null); 
        setDbUserName(null);
      }
    });

    return () => {
      if (subscription) subscription.unsubscribe();
    };
  }, []);

  // --- 2. CARGA DE DATOS ---
  useEffect(() => {
    const userId = session?.user?.id;
    if (userId) {
        // El finally de Promise.all asegura que el loader se apague
        Promise.all([fetchUserProfile(userId), loadBiometrics(userId)])
          .finally(() => {
            setCheckingBiometrics(false); 
            setLoadingRole(false);
          });
    } else {
      // Si no hay sesión tras el intento de init, liberamos loader
      if (session === null) {
         const timer = setTimeout(() => setCheckingBiometrics(false), 1000);
         return () => clearTimeout(timer);
      }
    }
  }, [session?.user?.id, fetchUserProfile, loadBiometrics]);

  // --- 3. GUARDIA DE EMERGENCIA (Anti-Spinner Infinito) ---
  useEffect(() => {
    const criticalTimeout = setTimeout(() => {
      if (checkingBiometrics || loadingRole) {
        console.warn("Liberando interfaz por precaución.");
        setCheckingBiometrics(false);
        setLoadingRole(false);
      }
    }, 3000); 

    return () => clearTimeout(criticalTimeout);
  }, [checkingBiometrics, loadingRole]);

  // --- 4. PROCESAR MERCADO PAGO ---
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const status = params.get("collection_status");
    const userId = session?.user?.id;
    
    if (status === "approved" && userId && !isProcessingPayment.current) {
        isProcessingPayment.current = true;

        const processPayment = async () => {
            setPaymentModal({ 
                show: true, type: 'loading', title: 'Confirmando Pago...', message: 'Estamos activando tu membresía.', onConfirm: null 
            });

            try {
                const response = await fetch(EDGE_FUNCTION_URL, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ userId: userId, isActionUpdateRole: true }),
                });
                const resData = await response.json();
                if (resData.success) {
                    await fetchUserProfile(userId);
                    setPaymentModal({
                        show: true, type: 'success', title: '¡Bienvenido a PRO!', 
                        message: `Tu suscripción está activa.`, 
                        onConfirm: () => {
                            setPaymentModal(p => ({ ...p, show: false }));
                            navigate("/perfil", { replace: true }); 
                        }
                    });
                }
            } catch (err) { 
                console.error(err);
                setPaymentModal({ show: true, type: 'error', title: 'Ups', message: 'Error al validar pago.' });
            } finally {
                isProcessingPayment.current = false;
            }
        };
        processPayment();
    }
  }, [location.search, session?.user?.id, navigate, fetchUserProfile, EDGE_FUNCTION_URL]);

  // --- HANDLERS ---
  const refreshUserStatus = useCallback(async () => {
    const userId = session?.user?.id;
    if (userId) {
        await fetchUserProfile(userId);
    }
  }, [session?.user?.id, fetchUserProfile]);

  const handleCalculationSuccess = useCallback(async (plan) => {
    setUserMacros(plan);
    const userId = session?.user?.id;
    if (userId) await loadBiometrics(userId);
  }, [session?.user?.id, loadBiometrics]);

  const handleSimulateUpgrade = useCallback(async () => {
    const userId = session?.user?.id;
    if (!userId) return;
    setPaymentModal({ show: true, type: 'loading', title: 'Generando Pago', message: 'Conectando con Mercado Pago...', onConfirm: null });
    try {
      const response = await fetch(EDGE_FUNCTION_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: userId, planPrice: 9990, planName: "Plan Premium", isActionCreatePreference: true }),
      });
      const data = await response.json();
      if (data.init_point) window.location.href = data.init_point;
    } catch { 
      setPaymentModal({ show: true, type: 'error', title: 'Error', message: 'Error al generar el link de pago.' }); 
    }
  }, [session?.user?.id, EDGE_FUNCTION_URL]);

  const handleLogout = useCallback(async () => {
    try {
      await supabase.auth.signOut({ scope: 'local' }); 
    } catch {
      console.warn("Limpieza local.");
    } finally {
      const projectHost = new URL(import.meta.env.VITE_SUPABASE_URL).hostname.split('.')[0];
      localStorage.removeItem(`sb-${projectHost}-auth-token`);
      localStorage.removeItem('nutri_temp_data');
      setSession(null); 
      navigate("/", { replace: true });
    }
  }, [navigate]);

  return {
    session, userMacros, userRole, initialCalcData, autoRenew, subEndDate,
    dbUserName, loadingRole, checkingBiometrics, paymentModal,
    setPaymentModal, refreshUserStatus, fetchUserProfile,
    handleCalculationSuccess, handleSimulateUpgrade, handleLogout, loadBiometrics
  };
}