import { useLocation } from "react-router-dom";

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const location = useLocation();
  const isWelcomePage = location.pathname === "/bienvenida";

  return (
    <footer 
      className={`
        w-full py-4 border-t backdrop-blur-md z-40
        ${isWelcomePage 
            ? "fixed bottom-0 left-0 bg-black/80 border-white/10 text-gray-400" // Solo en Bienvenida lo fijamos
            : "relative bg-white/40 border-gray-200/60 text-gray-500" // En el resto es RELATIVE (el App.jsx lo empujará al fondo)
        }
      `}
    >
      <div className="w-full max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-2 text-[10px] font-bold uppercase tracking-widest">
        
        {/* IZQUIERDA */}
        <div className={`flex items-center gap-1 transition-colors cursor-default ${isWelcomePage ? "hover:text-gray-200" : "hover:text-gray-800"}`}>
          <span className="text-sportRed text-xs">©</span>
          <span>{currentYear} NutriSport App</span>
        </div>

        {/* CENTRO */}
        <div>
          <a href="https://instagram.com/brai.veron" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:text-sportRed transition-colors group">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-70 group-hover:opacity-100 transition-opacity"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
            <span>@brai.veron</span>
          </a>
        </div>

        {/* DERECHA */}
        <div className="flex gap-1 text-right items-center opacity-60 hover:opacity-100 transition-opacity">
            <span>Dev by</span>
            <span className="text-sportRed animate-pulse">❤</span>
            <span className={isWelcomePage ? "text-gray-300" : "text-gray-700"}>Braian Dev</span>
        </div>
      </div>
    </footer>
  );
}