import { useState } from 'react';
import { supabase } from '../supabase';

export default function Auth() {
  const [loading, setLoading] = useState(false);
  
  // MODOS: 'login' | 'register' | 'recovery'
  const [view, setView] = useState('login'); 
  
  // Datos del formulario
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');

  // Estados de Error
  const [errors, setErrors] = useState({ email: '', password: '', general: '' });
  const [successMsg, setSuccessMsg] = useState(''); // Para avisar que se envió el correo

  // 1. TRADUCTOR DE ERRORES
  const traducirError = (errorMsg) => {
    if (errorMsg.includes("Invalid login credentials")) return "El correo o la contraseña son incorrectos.";
    if (errorMsg.includes("User already registered")) return "Este correo ya está registrado. Intenta iniciar sesión.";
    if (errorMsg.includes("Password should be at least")) return "La contraseña debe tener al menos 6 caracteres.";
    if (errorMsg.includes("valid email")) return "El formato del correo no es válido.";
    if (errorMsg.includes("rate limit")) return "Demasiados intentos. Espera un momento.";
    return "Ocurrió un error inesperado. Inténtalo de nuevo.";
  };

  // 2. VALIDACIONES
  const validarFormulario = () => {
    let valid = true;
    let newErrors = { email: '', password: '', general: '' };
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    // Email siempre obligatorio
    if (!email) {
      newErrors.email = "El correo es obligatorio.";
      valid = false;
    } else if (!emailRegex.test(email)) {
      newErrors.email = "Ingresa un correo real.";
      valid = false;
    }

    // Password obligatorio SOLO si NO estamos recuperando contraseña
    if (view !== 'recovery') {
        if (!password) {
            newErrors.password = "La contraseña es obligatoria.";
            valid = false;
        } else if (password.length < 6) {
            newErrors.password = "Mínimo 6 caracteres.";
            valid = false;
        }
    }

    // Nombre obligatorio SOLO en registro
    if (view === 'register' && !fullName.trim()) {
        newErrors.general = "Por favor dinos tu nombre."; 
        valid = false;
    }

    setErrors(newErrors);
    return valid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({ email: '', password: '', general: '' });
    setSuccessMsg('');

    if (!validarFormulario()) return;

    setLoading(true);

    try {
      if (view === 'login') {
        // --- LOGIN ---
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      
      } else if (view === 'register') {
        // --- REGISTRO ---
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: fullName } },
        });
        if (error) throw error;
        alert("¡Registro exitoso! Revisa tu correo para confirmar."); // En local a veces no pide confirmar, pero en prod sí.
      
      } else if (view === 'recovery') {
        // --- RECUPERAR CONTRASEÑA 🚑 ---
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            // Redirige al usuario a la app ya logueado cuando haga click en el email
            redirectTo: window.location.origin, 
        });
        if (error) throw error;
        setSuccessMsg("Solicitud procesada. Si el correo está registrado, recibirás el enlace en unos momentos.");
      }

    } catch (error) {
      const mensaje = traducirError(error.message);
      // Asignar error al campo correcto
      if (mensaje.includes("correo")) setErrors(prev => ({ ...prev, email: mensaje }));
      else if (mensaje.includes("contraseña")) setErrors(prev => ({ ...prev, password: mensaje }));
      else setErrors(prev => ({ ...prev, general: mensaje }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-white border-2 border-gray-200 p-8 shadow-2xl relative animate-fade-in">
      <div className="absolute top-0 right-0 w-10 h-10 bg-gray-100 -z-10 transform rotate-45 translate-x-5 -translate-y-5"></div>

      <h2 className="text-2xl font-display font-bold text-sportDark mb-2 uppercase tracking-wider text-center">
        {view === 'login' && 'Iniciar Sesión'}
        {view === 'register' && 'Crear Cuenta'}
        {view === 'recovery' && 'Recuperar Acceso'}
      </h2>
      
      {/* Subtítulo explicativo para Recuperación */}
      {view === 'recovery' && (
          <p className="text-xs text-gray-500 text-center mb-6 px-4">
              Ingresa tu correo y te enviaremos un enlace mágico para entrar sin contraseña.
          </p>
      )}

      {/* Mensaje de Éxito (Solo recuperación) */}
      {successMsg && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4 text-sm font-bold text-center animate-pulse">
            {successMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5 mt-4">
        
        {/* NOMBRE (Solo Registro) */}
        {view === 'register' && (
            <div className="animate-slide-up">
                <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Nombre Completo</label>
                <input type="text" placeholder="Tu Nombre" value={fullName} onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-300 px-4 py-3 font-bold text-sportDark focus:border-sportRed focus:bg-white focus:outline-none transition-colors" />
            </div>
        )}

        {/* EMAIL (Siempre visible) */}
        <div>
          <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Correo Electrónico</label>
          <input type="email" placeholder="ejemplo@correo.com" value={email} onChange={(e) => setEmail(e.target.value)}
            className={`w-full bg-gray-50 border px-4 py-3 font-bold text-sportDark focus:outline-none transition-colors ${
                errors.email ? 'border-red-500 bg-red-50' : 'border-gray-300 focus:border-sportRed focus:bg-white'
            }`}
          />
          {errors.email && <p className="text-red-500 text-xs font-bold mt-1 uppercase animate-pulse">⚠️ {errors.email}</p>}
        </div>

        {/* PASSWORD (Oculto en Recuperación) */}
        {view !== 'recovery' && (
            <div className="animate-slide-up">
                <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-bold text-gray-500 uppercase">Contraseña</label>
                    {/* Botón Olvidé mi contraseña (Solo en Login) */}
                    {view === 'login' && (
                        <button type="button" onClick={() => { setView('recovery'); setErrors({}); setSuccessMsg(''); }} 
                            className="text-[10px] font-bold text-sportRed hover:underline uppercase tracking-wider">
                            ¿Olvidaste tu clave?
                        </button>
                    )}
                </div>
                <input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)}
                    className={`w-full bg-gray-50 border px-4 py-3 font-bold text-sportDark focus:outline-none transition-colors ${
                        errors.password ? 'border-red-500 bg-red-50' : 'border-gray-300 focus:border-sportRed focus:bg-white'
                    }`}
                />
                {errors.password && <p className="text-red-500 text-xs font-bold mt-1 uppercase animate-pulse">⚠️ {errors.password}</p>}
            </div>
        )}

        {/* ERROR GENERAL */}
        {errors.general && (
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-3 text-sm font-bold" role="alert">
                <p>{errors.general}</p>
            </div>
        )}

        {/* BOTÓN SUBMIT */}
        <button type="submit" disabled={loading}
          className="w-full py-3 bg-sportDark text-white font-display font-bold text-xl uppercase tracking-wider hover:bg-sportRed transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed">
          {loading ? 'Procesando...' : (
              view === 'login' ? 'ENTRAR AHORA' : 
              view === 'register' ? 'CREAR CUENTA' : 
              'ENVIAR ENLACE DE RECUPERACIÓN'
          )}
        </button>
      </form>

      {/* TOGGLE MODOS */}
      <div className="mt-6 text-center border-t border-gray-100 pt-4">
        {view === 'recovery' ? (
             <button onClick={() => { setView('login'); setErrors({}); setSuccessMsg(''); }}
                className="text-gray-500 font-bold uppercase text-xs tracking-widest hover:text-sportDark">
                ← Volver a Iniciar Sesión
             </button>
        ) : (
            <>
                <p className="text-sm text-gray-500 font-bold">
                  {view === 'login' ? "¿No tienes cuenta?" : "¿Ya eres miembro?"}
                </p>
                <button
                  onClick={() => {
                    setView(view === 'login' ? 'register' : 'login');
                    setErrors({});
                  }}
                  className="text-sportRed font-bold uppercase text-xs tracking-widest hover:underline mt-1"
                >
                  {view === 'login' ? "Regístrate Gratis" : "Inicia Sesión aquí"}
                </button>
            </>
        )}
      </div>
    </div>
  );
}