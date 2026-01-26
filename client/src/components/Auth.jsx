import { useState, useEffect } from 'react';
import { supabase } from '../supabase';

// IMÁGENES DE FONDO
const BACKGROUND_IMAGES = [
  "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=2070&auto=format&fit=crop", 
  "https://images.unsplash.com/photo-1490645935967-10de6ba17061?q=80&w=2053&auto=format&fit=crop", 
  "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?q=80&w=2070&auto=format&fit=crop", 
"https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?q=80&w=2070&auto=format&fit=crop",];

export default function Auth() {
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState('login'); 
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [errors, setErrors] = useState({ email: '', password: '', general: '' });
  const [successMsg, setSuccessMsg] = useState(''); 
  const [showPassword, setShowPassword] = useState(false);

  // CONTROL DEL SLIDESHOW
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % BACKGROUND_IMAGES.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const traducirError = (errorMsg) => {
    if (errorMsg.includes("Invalid login credentials")) return "El correo o la contraseña son incorrectos.";
    if (errorMsg.includes("User already registered")) return "Este correo ya está registrado. Intenta iniciar sesión.";
    if (errorMsg.includes("Password should be at least")) return "La contraseña debe tener al menos 6 caracteres.";
    if (errorMsg.includes("valid email")) return "El formato del correo no es válido.";
    if (errorMsg.includes("rate limit")) return "Demasiados intentos. Espera un momento.";
    return "Ocurrió un error inesperado. Inténtalo de nuevo.";
  };

  const validarFormulario = () => {
    let valid = true;
    let newErrors = { email: '', password: '', general: '' };
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email) {
      newErrors.email = "El correo es obligatorio.";
      valid = false;
    } else if (!emailRegex.test(email)) {
      newErrors.email = "Ingresa un correo real.";
      valid = false;
    }

    if (view !== 'recovery') {
        if (!password) {
            newErrors.password = "La contraseña es obligatoria.";
            valid = false;
        } else if (password.length < 6) {
            newErrors.password = "Mínimo 6 caracteres.";
            valid = false;
        }
    }

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
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      
      } else if (view === 'register') {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: fullName } },
        });
        if (error) throw error;
        alert("¡Registro exitoso! Revisa tu correo para confirmar."); 
      
      } else if (view === 'recovery') {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: window.location.origin, 
        });
        if (error) throw error;
        setSuccessMsg("Solicitud procesada. Si el correo está registrado, recibirás el enlace en unos momentos.");
      }

    } catch (error) {
      const mensaje = traducirError(error.message);
      if (mensaje.includes("correo")) setErrors(prev => ({ ...prev, email: mensaje }));
      else if (mensaje.includes("contraseña")) setErrors(prev => ({ ...prev, password: mensaje }));
      else setErrors(prev => ({ ...prev, general: mensaje }));
    } finally {
      setLoading(false);
    }
  };

  return (
    // CAMBIO IMPORTANTE: Usamos 'fixed inset-0' para asegurar pantalla completa real
    <div className="fixed inset-0 w-screen h-screen bg-gray-900 overflow-y-auto overflow-x-hidden">
      
      {/* 1. FONDO (BACKGROUND) - FIXED */}
      <div className="fixed inset-0 w-full h-full z-0 pointer-events-none">
          {BACKGROUND_IMAGES.map((img, index) => {
            const isActive = index === currentImageIndex;
            return (
              <div
                key={index}
                className={`absolute inset-0 w-full h-full transition-all duration-700 ease-in-out transform ${
                  isActive 
                    ? 'opacity-40 translate-x-0'   
                    : 'opacity-0 translate-x-10'   
                }`}
              >
                {/* Object-cover asegura que la imagen cubra todo sin deformarse */}
                <img 
                  src={img} 
                  alt="background" 
                  className="w-full h-full object-cover grayscale brightness-75 scale-105" 
                />
              </div>
            );
          })}
          {/* Capa oscura superpuesta */}
          <div className="absolute inset-0 bg-black/40"></div>
      </div>

      {/* 2. CONTENIDO (LOGO + FORMULARIO) - RELATIVE PARA ESTAR ENCIMA */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">

        {/* LOGO (Fuera de la tarjeta) */}
        <div className="mb-8 animate-fade-in-down">
            <h1 className="text-5xl md:text-6xl font-black italic tracking-tighter leading-none select-none drop-shadow-2xl">
                <span className="text-white">NUTRI</span>
                <span className="text-sportRed">SPORT</span>
            </h1>
        </div>

        {/* TARJETA FORMULARIO */}
        <div className="w-full max-w-md bg-white border border-gray-200 shadow-2xl animate-fade-in overflow-hidden rounded-sm">
            
            <div className="bg-gray-50 pt-8 pb-6 px-8 border-b border-gray-100 text-center relative">
                <div className="absolute top-0 right-0 w-8 h-8 bg-sportRed/10 -z-0 transform rotate-45 translate-x-4 -translate-y-4"></div>

                <h2 className="text-xl font-display font-bold text-gray-400 uppercase tracking-widest relative z-10">
                    {view === 'login' && 'Bienvenido'}
                    {view === 'register' && 'Únete al Equipo'}
                    {view === 'recovery' && 'Recuperar Cuenta'}
                </h2>
                
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-2">
                    {view === 'login' && 'Tu plan nutricional te espera'}
                    {view === 'register' && 'Comienza tu transformación hoy'}
                    {view === 'recovery' && 'No te preocupes, suele pasar'}
                </p>
            </div>

            <div className="p-8 pt-6">

                {successMsg && (
                <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4 text-sm font-bold text-center animate-pulse">
                    {successMsg}
                </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                
                {view === 'register' && (
                    <div className="animate-slide-up">
                        <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Nombre Completo</label>
                        <input type="text" placeholder="Tu Nombre" value={fullName} onChange={(e) => setFullName(e.target.value)}
                            className="w-full bg-gray-50 border border-gray-300 px-4 py-3 font-bold text-sportDark focus:border-sportRed focus:bg-white focus:outline-none transition-colors" />
                    </div>
                )}

                <div>
                    <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Correo Electrónico</label>
                    <input type="email" placeholder="ejemplo@correo.com" value={email} onChange={(e) => setEmail(e.target.value)}
                    className={`w-full bg-gray-50 border px-4 py-3 font-bold text-sportDark focus:outline-none transition-colors ${
                        errors.email ? 'border-red-500 bg-red-50' : 'border-gray-300 focus:border-sportRed focus:bg-white'
                    }`}
                    />
                    {errors.email && <p className="text-red-500 text-xs font-bold mt-1 uppercase animate-pulse">⚠️ {errors.email}</p>}
                </div>

                {view !== 'recovery' && (
                    <div className="animate-slide-up">
                        <div className="flex justify-between items-center mb-1">
                            <label className="text-xs font-bold text-gray-500 uppercase">Contraseña</label>
                            {view === 'login' && (
                                <button type="button" onClick={() => { setView('recovery'); setErrors({}); setSuccessMsg(''); }} 
                                    className="text-[10px] font-bold text-sportRed hover:underline uppercase tracking-wider">
                                    ¿Olvidaste tu clave?
                                </button>
                            )}
                        </div>

                        <div className="relative">
                            <input 
                                type={showPassword ? "text" : "password"} 
                                placeholder="••••••••" 
                                value={password} 
                                onChange={(e) => setPassword(e.target.value)}
                                className={`w-full bg-gray-50 border px-4 py-3 pr-10 font-bold text-sportDark focus:outline-none transition-colors ${
                                    errors.password ? 'border-red-500 bg-red-50' : 'border-gray-300 focus:border-sportRed focus:bg-white'
                                }`}
                            />
                            <button
                                type="button" 
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-sportRed transition-colors"
                            >
                                {showPassword ? (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                    </svg>
                                )}
                            </button>
                        </div>

                        {errors.password && <p className="text-red-500 text-xs font-bold mt-1 uppercase animate-pulse">⚠️ {errors.password}</p>}
                    </div>
                )}

                {errors.general && (
                    <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-3 text-sm font-bold" role="alert">
                        <p>{errors.general}</p>
                    </div>
                )}

                <button type="submit" disabled={loading}
                    className="w-full py-3 bg-sportDark text-white font-display font-bold text-xl uppercase tracking-wider hover:bg-sportRed transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed mt-2">
                    {loading ? 'Procesando...' : (
                        view === 'login' ? 'ENTRAR AHORA' : 
                        view === 'register' ? 'CREAR CUENTA' : 
                        'ENVIAR ENLACE'
                    )}
                </button>
                </form>

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
        </div>
      </div>
    </div>
  );
}