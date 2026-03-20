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
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin }
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
      {/* FONDO ORIGINAL */}
      <div className="fixed inset-0 w-full h-full z-0 pointer-events-none">
          {BACKGROUND_IMAGES.map((img, index) => (
              <div key={index} className={`absolute inset-0 w-full h-full transition-all duration-1000 ${index === currentImageIndex ? 'opacity-40 scale-100' : 'opacity-0 scale-110'}`}>
                <img src={img} className="w-full h-full object-cover grayscale brightness-75" alt="bg" />
              </div>
          ))}
          <div className="absolute inset-0 bg-black/40"></div>
      </div>

      <div className="relative z-10 min-h-screen flex flex-col md:flex-row items-center justify-around py-12 px-6 md:px-20 lg:px-32">
        
        {/* COLUMNA IZQUIERDA */}
        <div className="mb-12 md:mb-0 md:text-left text-center max-w-xl flex flex-col gap-6">
            <h1 className="text-6xl md:text-7xl lg:text-8xl font-black italic tracking-tighter leading-none select-none drop-shadow-2xl">
                <span className="text-white">NUTRI</span><span className="text-sportRed">SPORT</span>
            </h1>
            
            {/* CAMBIO DE FUENTE EN FRASES: Serif, Medium, con tracking estrecho */}
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

        {/* COLUMNA DERECHA */}
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
                    {/* ... campos de formulario ... */}
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

                    {/* HOVER DE BOTÓN GOOGLE CON MÁS CONTRASTE */}
                    <button 
                        onClick={handleGoogleLogin}
                        type="button"
                        disabled={loading}
                        className="w-14 h-14 border-2 border-gray-100 rounded-full flex items-center justify-center bg-white 
                                   hover:bg-gray-900 hover:border-gray-900 hover:shadow-xl transition-all duration-300 group disabled:opacity-50"
                        title="Inicia sesión con Google"
                    >
                        <svg className="w-6 h-6 transition-transform group-hover:scale-110" viewBox="0 0 24 24">
                            {/* He modificado el path para que sea blanco en hover usando una clase de Tailwind o simplemente cambiando el fill en el icono si fuera necesario, pero aquí usaremos un filtro de brillo para mantener los colores de Google vivos o contrastados */}
                            <path className="group-hover:fill-white transition-colors" fill="#EA4335" d="M12.48 10.92v3.28h7.84c-.24 1.84-.9 3.47-1.93 4.67-1.12 1.3-2.85 2.1-5.91 2.1-4.82 0-8.76-3.94-8.76-8.76S7.66 3.45 12.48 3.45c2.6 0 4.61.94 6.07 2.36l2.32-2.32C18.66 1.44 15.89 0 12.48 0 5.58 0 0 5.58 0 12.48s5.58 12.48 12.48 12.48c3.7 0 6.48-1.21 8.67-3.48 2.26-2.26 2.97-5.44 2.97-8.08 0-.77-.07-1.5-.21-2.21h-11.42z"/>
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