export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    // VISUALES DEL PRIMER CÓDIGO (Compacto, vidrio, borde sutil)
    <footer className="w-full mt-auto py-4 border-t border-gray-200/60 bg-white/40 backdrop-blur-sm relative z-10">
      
      {/* VISUALES DEL PRIMER CÓDIGO (Texto chico, espaciado) */}
      <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-2 text-[10px] font-bold uppercase tracking-widest text-gray-400">
        
        {/* IZQUIERDA: Marca */}
        <div className="flex items-center gap-1 hover:text-gray-600 transition-colors cursor-default">
          <span className="text-sportRed text-xs">©</span>
          <span>{currentYear} Nutri Aéreo</span>
        </div>

        {/* CENTRO: Instagram */}
        <div>
          <a 
            href="https://instagram.com/brai.veron" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 hover:text-sportRed transition-colors group"
          >
            {/* Mantenemos el icono pequeño (12px) para que combine con el estilo sutil */}
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-70 group-hover:opacity-100 transition-opacity">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
            </svg>
            <span>@brai.veron</span>
          </a>
        </div>

        {/* DERECHA: TEXTOS DEL SEGUNDO CÓDIGO (Pero con el estilo visual del primero) */}
        <div className="flex gap-1 text-right items-center opacity-60 hover:opacity-100 transition-opacity">
            <span>Desarrollado con</span>
            <span className="text-sportRed animate-pulse">❤</span>
            <span>por <span className="text-gray-600">Braian Dev</span></span>
        </div>

      </div>
    </footer>
  );
}