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
    }
  }, []);

  // --- CARGA DE PERFIL (nombre, apellido en minúsculas como en tu BD) ---
  const fetchUserProfile = useCallback(async (userId) => {
    if (!userId) return null;
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
        
        // CORRECCIÓN: Nombres de columnas según tu BD (nombre, apellido)
        const nombreExistente = data.nombre || "";
        const apellidoExistente = data.apellido || "";
        const fullName = `${nombreExistente} ${apellidoExistente}`.trim();
        
        // Seteamos el nombre completo o null si está vacío
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

  // --- 1. GESTIÓN DE SESIÓN ESTABLE (Evita refrescos al cambiar de pestaña) ---
  useEffect(() => {
  // Dentro de useAppLogic.js -> initSession
const initSession = async () => {
  try {
    const { data: { session: activeSession }, error } = await supabase.auth.getSession();
    
    if (error) {
      // Si hay error de refresh token, forzamos el cierre para limpiar el storage
      if (error.message.includes("Refresh Token")) {
          await supabase.auth.signOut();
          setSession(null);
      }
      throw error;
    }

    setSession(activeSession);
    if (!activeSession) setCheckingBiometrics(false);
  } catch (err) {
    console.error("Error inicializando sesión:", err);
    setCheckingBiometrics(false);
  }
};

    initSession();

   // Dentro del useEffect de la sesión
const { data: { subscription } } = supabase.auth.onAuthStateChange((event, newSession) => {
  // Solo actualiza si realmente hay un cambio de token
  setSession(prev => (prev?.access_token !== newSession?.access_token ? newSession : prev));
  
  if (event === 'SIGNED_OUT' || event === 'USER_DELETED') {
    setCheckingBiometrics(false); // <--- Crucial para que no se trabe el loader
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

// --- 2. CARGA DE DATOS OPTIMIZADA ---
  useEffect(() => {
    const userId = session?.user?.id;
    if (userId) {
        // Quitamos el setCheckingBiometrics(true) de aquí para que no bloquee.
        // Solo bloquearemos si es ESTRICTAMENTE necesario (ej: primera vez).
        
        Promise.all([fetchUserProfile(userId), loadBiometrics(userId)])
          .finally(() => {
            // Solo apagamos el loader inicial si estaba encendido
            setCheckingBiometrics(false); 
          });
    } else {
      // Si no hay sesión, nos aseguramos de apagar el loader para mostrar Auth
      setCheckingBiometrics(false);
    }
  }, [session?.user?.id, fetchUserProfile, loadBiometrics]);

  // --- 3. PROCESAR MERCADO PAGO ---
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
        await fetchUserProfile(userId); // Esto actualizará userRole, subEndDate, etc.
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
    // Forzamos el logout con scope 'local' para evitar el 403 del servidor
    // Esto borra la sesión del cliente actual sin pelearse con el servidor por tokens globales
    await supabase.auth.signOut({ scope: 'local' }); 
  } catch {
    console.warn("Aviso: El servidor no pudo procesar el cierre, procediendo a limpieza local.");
  } finally {
    // ... (Tu lógica de limpieza de localStorage y navegación que ya armamos)
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