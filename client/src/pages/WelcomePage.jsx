import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import bg1 from '../assets/bg1.jpg';
import bg2 from '../assets/bg2.jpg';
import bg3 from '../assets/bg3.jpg';
import bg4 from '../assets/bg4.jpg';

const BACKGROUND_IMAGES = [bg1, bg2, bg3, bg4];

export default function WelcomePage({ userName }) {
  const navigate = useNavigate();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % BACKGROUND_IMAGES.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    /* CAMBIO: Quitamos 'fixed' y 'overflow-hidden'. Usamos 'min-h-screen' y 'relative' */
    <div className="relative min-h-screen w-full bg-gray-900 font-sans overflow-y-auto">
      
      {/* CAPA DE FONDO OPTIMIZADA - Esta sí queda fija para que no se mueva al scrollear */}
      <div className="fixed inset-0 w-full h-full z-0 pointer-events-none">
          <div className="absolute inset-0 w-full h-full transition-opacity duration-1000 ease-in-out">
            <img 
              key={BACKGROUND_IMAGES[currentImageIndex]} 
              src={BACKGROUND_IMAGES[currentImageIndex]} 
              alt="gym background" 
              loading="eager"
              className="w-full h-full object-cover grayscale brightness-[0.4] animate-fade-in scale-105" 
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80"></div>
      </div>

      {/* CONTENIDO PRINCIPAL - Añadimos padding vertical (py-12) para que no pegue a los bordes al scrollear */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center text-center px-4 py-12 sm:px-6 lg:px-8">
        
        <div className="mb-4 md:mb-8 animate-fade-in-down">
            <h1 className="text-5xl md:text-8xl font-black italic tracking-tighter leading-none select-none drop-shadow-2xl">
                <span className="text-white">NUTRI</span>
                <span className="text-sportRed">SPORT</span>
            </h1>
        </div>

        <h2 className="text-2xl md:text-5xl font-bold text-white mb-6 animate-fade-in drop-shadow-lg leading-tight">
          Bienvenido al equipo, <br className="md:hidden"/> 
          <span className="text-sportRed inline-block ml-2 uppercase">
            {userName}
          </span>.
        </h2>

        <p className="text-sm md:text-xl text-gray-200 max-w-3xl mx-auto mb-8 md:mb-12 leading-relaxed font-medium drop-shadow-md">
          Estás a un paso de tu mejor versión. <br className="hidden md:block" /> 
          Comencemos creando tu <span className="text-white font-black uppercase">Plan de Nutrición y Entrenamiento</span>.
        </p>

        <div className="w-full md:w-auto">
            <button
              onClick={() => navigate('/perfil')}
              className="group relative inline-flex items-center justify-center w-full md:w-auto px-6 py-3 md:px-12 md:py-4 text-base md:text-xl font-bold text-white uppercase tracking-widest bg-sportRed hover:bg-red-600 rounded-sm shadow-2xl transition-all duration-300 hover:scale-105 overflow-hidden"
            >
              <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out"></span>
              <span>Comenzar Transformación</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 md:h-6 md:w-6 ml-3 group-hover:translate-x-2 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </button>

            <p className="text-gray-400 text-[10px] md:text-xs font-bold uppercase tracking-widest mt-4 md:mt-6 animate-pulse">
                Solo te tomará 60 segundos
            </p>
        </div>
      </div>
    </div>
  );
}