import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// Reutilizamos las MISMAS imágenes de Auth.jsx para mantener la identidad visual
const BACKGROUND_IMAGES = [
    // 1. FUERZA: Interior de gimnasio moderno con buena iluminación (El lugar de trabajo)
    
    "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=2070&auto=format&fit=crop",

    // 2. PREPARACIÓN ORDENADA (Flatlay): Ingredientes separados en bowls sobre fondo blanco/mármol.
  // Al tener fondo blanco y estar ordenados, el texto se lee perfecto encima. Cero caos.
  "https://images.unsplash.com/photo-1498837167922-ddd27525d352?q=80&w=2070&auto=format&fit=crop",
    
    // 3. PISTA DE ATLETISMO: Carriles rojos y líneas blancas. 
    // Geometría pura. Da sensación de velocidad y deporte sin distraer.
    "https://images.unsplash.com/photo-1532444458054-01a7dd3e9fca?q=80&w=2070&auto=format&fit=crop", 
    
    // 4. MESA DE NUTRICIÓN (Flatlay): Una mesa llena de comida saludable vista desde arriba.
    // Al ser cenital y tener muchos elementos, funciona como una textura de fondo perfecta.
    "https://images.unsplash.com/photo-1490645935967-10de6ba17061?q=80&w=2053&auto=format&fit=crop", 
];

export default function WelcomePage({ userName }) {
  const navigate = useNavigate();
  
  // --- LÓGICA DEL SLIDESHOW (Idéntica a Auth.jsx) ---
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % BACKGROUND_IMAGES.length);
    }, 5000); // Cambia cada 5 segundos
    return () => clearInterval(interval);
  }, []);
  // --------------------------------------------------

  return (
    // Contenedor pantalla completa fijo
    <div className="fixed inset-0 w-screen h-screen bg-gray-900 overflow-hidden font-sans">
      
      {/* 1. CAPA DE FONDO (SLIDESHOW) */}
      <div className="fixed inset-0 w-full h-full z-0 pointer-events-none">
          {BACKGROUND_IMAGES.map((img, index) => {
            const isActive = index === currentImageIndex;
            return (
              <div
                key={index}
                className={`absolute inset-0 w-full h-full transition-all duration-1000 ease-in-out transform ${
                  isActive 
                    ? 'opacity-40 scale-105' // Un pequeño zoom lento al entrar queda bien
                    : 'opacity-0 scale-100'   
                }`}
              >
                <img 
                  src={img} 
                  alt="gym background" 
                  className="w-full h-full object-cover grayscale brightness-75" 
                />
              </div>
            );
          })}
          {/* Capa oscura superpuesta para mejorar la lectura del texto blanco */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/70"></div>
      </div>

      {/* 2. CONTENIDO PRINCIPAL (Encima del fondo) */}
      <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-4 sm:px-6 lg:px-8">
        
        {/* LOGO GRANDE */}
        <div className="mb-8 animate-fade-in-down">
            <h1 className="text-6xl md:text-8xl font-black italic tracking-tighter leading-none select-none drop-shadow-2xl">
                <span className="text-white">NUTRI</span>
                <span className="text-sportRed">SPORT</span>
            </h1>
        </div>

        {/* SALUDO PERSONALIZADO */}
        <h2 className="text-2xl md:text-5xl font-bold text-white mb-6 animate-fade-in delay-200 drop-shadow-lg">
          Bienvenido al equipo, <br className="md:hidden"/> 
          <span className="text-sportRed inline-block ml-2 decoration-sportRed/30 underline-offset-8">
            {userName}
          </span>.
        </h2>

        {/* EXPLICACIÓN BREVE */}
        <p className="text-lg md:text-1xl text-gray-200 max-w-3xl mx-auto mb-12 leading-relaxed animate-fade-in delay-300 font-medium drop-shadow-md">
          Estás a un paso de tu mejor versión. < br /> Para que comenzar la experiencia y crear tu <span className="text-white font-black">Plan de Nutrición y Entrenamiento</span> 100% personalizado, necesitamos conocer tus medidas y objetivos actuales.
        </p>

        {/* BOTÓN CTA PRINCIPAL */}
        <div className="animate-slide-up delay-500">
            <button
            onClick={() => navigate('/perfil')}
            className="group relative inline-flex items-center justify-center px-12 py-4 text-xl font-display font-bold text-white uppercase tracking-widest bg-sportRed hover:bg-red-600 rounded-sm shadow-2xl transition-all duration-300 ease-out hover:scale-105 overflow-hidden"
            >
            {/* Efecto de brillo al pasar el mouse */}
            <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out"></span>
            
            <span>Comenzar mi Transformación</span>
            {/* Flecha animada */}
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 ml-3 group-hover:translate-x-2 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
            </button>

            <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-6 animate-pulse">
                Solo te tomará 60 segundos
            </p>
        </div>

      </div>
    </div>
  );
}