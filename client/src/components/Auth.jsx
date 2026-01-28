import { useState, useEffect } from 'react';
import { supabase } from '../supabase'; // Asegúrate de que el archivo src/supabase.js exista

// IMÁGENES DE FONDO
const BACKGROUND_IMAGES = [
  "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=2070&auto=format&fit=crop", 
  "https://images.unsplash.com/photo-1490645935967-10de6ba17061?q=80&w=2053&auto=format&fit=crop", 
  "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?q=80&w=2070&auto=format&fit=crop", 
  "https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?q=80&w=2070&auto=format&fit=crop",
];

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
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: fullName } },
        });
        
        if (error) throw error;

        if (data.user && !data.session) {
            setSuccessMsg("¡Cuenta creada! Revisa tu correo para confirmar tu cuenta.");
            setView('login');
            setFullName('');
            setPassword('');
        }
      
      } else if (view === 'recovery') {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: window.location.origin, 
        });
        if (error) throw error;
        setSuccessMsg("Solicitud enviada. Revisa tu bandeja de entrada.");
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
    <div className="fixed inset-0 w-screen h-screen bg-gray-900 overflow-y-auto overflow-x-hidden font-sans">
      
      {/* 1. FONDO (BACKGROUND) */}
      <div className="fixed inset-0 w-full h-full z-0 pointer-events-none">
          {BACKGROUND_IMAGES.map((img, index) => {
            const isActive = index === currentImageIndex;
            return (
              <div
                key={index}
                className={`absolute inset-0 w-full h-full transition-all duration-1000 ease-in-out transform ${
                  isActive ? 'opacity-40 scale-100' : 'opacity-0 scale-110'
                }`}
              >
                <img 
                  src={img} 
                  alt="background" 
                  className="w-full h-full object-cover grayscale brightness-75" 
                />
              </div>
            );
          })}
          <div className="absolute inset-0 bg-black/40"></div>
      </div>

      {/* 2. CONTENIDO */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center py-12 px-4">

        <div className="mb-8 animate-fade-in-down">
            <h1 className="text-5xl md:text-6xl font-black italic tracking-tighter leading-none select-none drop-shadow-2xl">
                <span className="text-white">NUTRI</span>
                <span className="text-sportRed">SPORT</span>
            </h1>
        </div>

        <div className="w-full max-w-md bg-white border border-gray-200 shadow-2xl animate-fade-in overflow-hidden rounded-sm">
            
            <div className="bg-gray-50 pt-8 pb-6 px-8 border-b border-gray-100 text-center relative">
                <h2 className="text-xl font-bold text-gray-400 uppercase tracking-widest relative z-10">
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
                    <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4 text-sm font-bold text-center">
                        {successMsg}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                    {view === 'register' && (
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Nombre Completo</label>
                            <input type="text" placeholder="Tu Nombre" value={fullName} onChange={(e) => setFullName(e.target.value)}
                                className="w-full bg-gray-50 border border-gray-300 px-4 py-3 font-bold text-gray-900 focus:border-sportRed focus:bg-white focus:outline-none transition-colors" />
                        </div>
                    )}

                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Correo Electrónico</label>
                        <input type="email" placeholder="ejemplo@correo.com" value={email} onChange={(e) => setEmail(e.target.value)}
                        className={`w-full bg-gray-50 border px-4 py-3 font-bold text-gray-900 focus:outline-none transition-colors ${
                            errors.email ? 'border-red-500 bg-red-50' : 'border-gray-300 focus:border-sportRed focus:bg-white'
                        }`} />
                        {errors.email && <p className="text-red-500 text-xs font-bold mt-1 uppercase">⚠️ {errors.email}</p>}
                    </div>

                    {view !== 'recovery' && (
                        <div>
                            <div className="flex justify-between items-center mb-1">
                                <label className="text-xs font-bold text-gray-500 uppercase">Contraseña</label>
                            </div>
                            <div className="relative">
                                <input 
                                    type={showPassword ? "text" : "password"} 
                                    placeholder="••••••••" 
                                    value={password} 
                                    onChange={(e) => setPassword(e.target.value)}
                                    className={`w-full bg-gray-50 border px-4 py-3 pr-10 font-bold text-gray-900 focus:outline-none transition-colors ${
                                        errors.password ? 'border-red-500 bg-red-50' : 'border-gray-300 focus:border-sportRed focus:bg-white'
                                    }`} />
                                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-sportRed">
                                    {showPassword ? '👁️' : '🔒'}
                                </button>
                            </div>
                            {errors.password && <p className="text-red-500 text-xs font-bold mt-1 uppercase">⚠️ {errors.password}</p>}
                        </div>
                    )}

                    <button type="submit" disabled={loading}
                        className="w-full py-3 bg-gray-900 text-white font-bold text-xl uppercase tracking-wider hover:bg-sportRed transition-colors shadow-lg disabled:opacity-50 mt-2">
                        {loading ? 'Procesando...' : (view === 'login' ? 'ENTRAR AHORA' : view === 'register' ? 'CREAR CUENTA' : 'ENVIAR ENLACE')}
                    </button>
                </form>

                <div className="mt-6 text-center border-t border-gray-100 pt-4">
                    <button onClick={() => setView(view === 'login' ? 'register' : 'login')}
                        className="text-sportRed font-bold uppercase text-xs tracking-widest hover:underline">
                        {view === 'login' ? "Regístrate Gratis" : "Inicia Sesión aquí"}
                    </button>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}