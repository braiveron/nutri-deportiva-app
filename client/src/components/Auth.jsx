import { useState, useEffect } from 'react';
import { supabase } from '../supabase'; 

const BACKGROUND_IMAGES = [
  "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=2070&auto=format&fit=crop", 
  "https://images.unsplash.com/photo-1490645935967-10de6ba17061?q=80&w=2053&auto=format&fit=crop", 
  "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?q=80&w=2070&auto=format&fit=crop", 
  "https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?q=80&w=2070&auto=format&fit=crop",
];

const MOTIVATIONAL_PHRASES = [
  "El único entrenamiento malo es el que no ocurrió.",
  "La disciplina le gana al talento cuando el talento no se esfuerza.",
  "Tu cuerpo puede aguantar casi cualquier cosa, es a tu mente a la que tienes que convencer.",
  "No cuentes los días, haz que los días cuenten."
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
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % BACKGROUND_IMAGES.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      // Usamos el origen actual (localhost o vercel) para la redirección
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { 
          redirectTo: window.location.origin,
          queryParams: {
            access_type: 'offline',
            prompt: 'select_account',
          }
        }
      });
      if (error) throw error;
    } catch {
      setErrors({ ...errors, general: "Error al conectar con Google." });
    } finally {
      setLoading(false);
    }
  };

  const traducirError = (errorMsg) => {
    if (errorMsg.includes("Invalid login credentials")) return "El correo o la contraseña son incorrectos.";
    if (errorMsg.includes("User already registered")) return "Este correo ya está registrado.";
    if (errorMsg.includes("Password should be at least")) return "Mínimo 6 caracteres.";
    return "Ocurrió un error inesperado.";
  };

  const validarFormulario = () => {
    let valid = true;
    let newErrors = { email: '', password: '', general: '' };
    if (!email) { newErrors.email = "El correo es obligatorio."; valid = false; }
    if (view !== 'recovery' && !password) { newErrors.password = "La contraseña es obligatoria."; valid = false; }
    setErrors(newErrors);
    return valid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({ email: '', password: '', general: '' });
    if (!validarFormulario()) return;
    setLoading(true);
    try {
      if (view === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else if (view === 'register') {
        const { data, error } = await supabase.auth.signUp({
          email, password, options: { data: { full_name: fullName } },
        });
        if (error) throw error;
        if (data.user && !data.session) {
          setSuccessMsg("¡Cuenta creada! Revisa tu correo.");
          setView('login');
        }
      }
    } catch (error) {
      setErrors(prev => ({ ...prev, general: traducirError(error.message) }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 w-screen h-screen bg-gray-900 overflow-y-auto overflow-x-hidden font-sans">
      <div className="fixed inset-0 w-full h-full z-0 pointer-events-none">
          {BACKGROUND_IMAGES.map((img, index) => (
              <div key={index} className={`absolute inset-0 w-full h-full transition-all duration-1000 ${index === currentImageIndex ? 'opacity-40 scale-100' : 'opacity-0 scale-110'}`}>
                <img src={img} className="w-full h-full object-cover grayscale brightness-75" alt="bg" />
              </div>
          ))}
          <div className="absolute inset-0 bg-black/40"></div>
      </div>

      <div className="relative z-10 min-h-screen flex flex-col md:flex-row items-center justify-around py-12 px-6 md:px-20 lg:px-32">
        
        <div className="mb-12 md:mb-0 md:text-left text-center max-w-xl flex flex-col gap-6">
            <h1 className="text-6xl md:text-7xl lg:text-8xl font-black italic tracking-tighter leading-none select-none drop-shadow-2xl">
                <span className="text-white">NUTRI</span><span className="text-sportRed">SPORT</span>
            </h1>
            
            <div className="relative h-24 md:h-28 overflow-hidden">
                {MOTIVATIONAL_PHRASES.map((phrase, index) => (
                    <p 
                        key={index}
                        className={`absolute inset-0 text-white/90 text-xl md:text-2xl font-serif font-light italic leading-tight transition-all duration-1000 transform
                        ${index === currentImageIndex ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                    >
                        “{phrase}”
                    </p>
                ))}
            </div>

            <p className="text-sportRed font-bold uppercase tracking-[0.4em] text-sm md:text-base border-l-4 border-sportRed pl-4">
              Tu rendimiento comienza aquí
            </p>
        </div>

        <div className="w-full max-w-md bg-white border border-gray-200 shadow-2xl overflow-hidden rounded-sm">
            <div className="bg-gray-50 pt-8 pb-6 px-8 border-b border-gray-100 text-center">
                <h2 className="text-xl font-bold text-gray-400 uppercase tracking-widest">
                    {view === 'login' ? 'Bienvenido' : view === 'register' ? 'Únete al Equipo' : 'Recuperar'}
                </h2>
            </div>

            <div className="p-8 pt-6">
                {successMsg && <div className="bg-green-100 text-green-700 p-3 rounded mb-4 text-xs font-bold text-center">{successMsg}</div>}
                {errors.general && <div className="bg-red-100 text-red-700 p-3 rounded mb-4 text-xs font-bold text-center uppercase">⚠️ {errors.general}</div>}

                <form onSubmit={handleSubmit} className="space-y-5">
                    {view === 'register' && (
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Nombre Completo</label>
                            <input type="text" placeholder="Tu Nombre" value={fullName} onChange={(e) => setFullName(e.target.value)}
                                className="w-full bg-gray-50 border border-gray-300 px-4 py-3 font-bold text-gray-900 focus:border-sportRed focus:outline-none transition-colors" />
                        </div>
                    )}
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Correo Electrónico</label>
                        <input type="email" placeholder="ejemplo@correo.com" value={email} onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-300 px-4 py-3 font-bold focus:border-sportRed focus:outline-none" />
                    </div>
                    {view !== 'recovery' && (
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Contraseña</label>
                            <div className="relative">
                                <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-gray-50 border border-gray-300 px-4 py-3 font-bold focus:border-sportRed focus:outline-none" />
                                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                                    {showPassword ? '👁️' : '🔒'}
                                </button>
                            </div>
                        </div>
                    )}
                    <button type="submit" disabled={loading} className="w-full py-3 bg-gray-900 text-white font-bold text-xl uppercase hover:bg-sportRed transition-colors disabled:opacity-50">
                        {loading ? '...' : (view === 'login' ? 'ENTRAR' : 'CREAR CUENTA')}
                    </button>
                </form>

                <div className="mt-8 flex flex-col items-center">
                    <div className="relative flex items-center justify-center w-full mb-6">
                        <div className="border-t border-gray-100 w-full"></div>
                        <span className="bg-white px-3 text-[10px] font-bold text-gray-400 uppercase absolute">O continúa con</span>
                    </div>

                    <button 
                        onClick={handleGoogleLogin}
                        type="button"
                        disabled={loading}
                        className="w-14 h-14 border-2 border-gray-100 rounded-full flex items-center justify-center bg-white 
                                   hover:bg-gray-900 hover:border-gray-900 hover:shadow-xl transition-all duration-300 group disabled:opacity-50"
                        title="Inicia sesión con Google"
                    >
                        <svg className="w-6 h-6" viewBox="0 0 24 24">
                          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                        </svg>
                    </button>
                </div>

                <div className="mt-8 text-center border-t border-gray-100 pt-5">
                    <button onClick={() => setView(view === 'login' ? 'register' : 'login')} className="text-sportRed font-bold uppercase text-xs hover:underline tracking-widest">
                        {view === 'login' ? "Regístrate Gratis" : "Inicia Sesión aquí"}
                    </button>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}