import { useState, useEffect, useRef } from "react"; 
import { Link, useLocation } from "react-router-dom";

export default function Navbar({ 
  onLogout, 
  userRole,
  loadingRole, 
  userName, 
  autoRenew, 
  onSubscribe, 
  onCancelSub, 
  onReactivate,
  onDeleteAccount,
  onOpenSettings,
  onOpenSupport
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const menuRef = useRef(null); // Referencia para detectar clics afuera

  // --- LÓGICA DE COLOR ADAPTATIVO ---
  // Detectamos si estamos en la página de bienvenida (fondo oscuro)
  const isWelcomePage = location.pathname === "/bienvenida";

  // --- CERRAR AL HACER CLIC AFUERA ---
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Si el menú está abierto y el clic NO es dentro del contenedor, lo cerramos
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };

    if (menuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuOpen]);

  // Estilo para links del Navbar Desktop
  const isActive = (path) => location.pathname === path 
    ? "text-sportRed font-bold border-b-2 border-sportRed pb-1" 
    : "text-gray-400 hover:text-white transition-colors pb-1 border-b-2 border-transparent hover:border-gray-700";

  // Estilo para links del Menú Móvil (Dentro del dropdown)
  const mobileLinkStyle = (path) => `
    block w-full text-left px-4 py-3 text-xs font-black uppercase tracking-widest transition-colors border-l-2
    ${location.pathname === path 
        ? "text-sportRed bg-black/20 border-sportRed" 
        : "text-gray-400 hover:text-white hover:bg-gray-800 border-transparent"}
  `;

  return (
    <nav className={`sticky top-0 z-50 transition-all duration-500 border-b ${
      isWelcomePage 
        ? "bg-gray-900/10 backdrop-blur-md border-gray-800 shadow-lg" // Estilo para fondo oscuro
        : "bg-gray-900 border-gray-700 shadow-2xl" // Estilo sólido para páginas blancas
    } px-4 py-3 md:px-6 md:py-4`}> {/* Padding reducido en movil */}
      
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        
        {/* LOGO */}
        <div className="flex items-center gap-2">
          <Link to="/bienvenida" className="flex items-center group">
            <h1 className="text-xl md:text-2xl font-black italic tracking-tighter leading-none select-none transition-transform group-hover:scale-105">
                <span className="text-white">NUTRI</span>
                <span className="text-sportRed">SPORT</span>
            </h1>
          </Link>
        </div>

        {/* MENU DESKTOP (Oculto en móvil) */}
        <div className="hidden md:flex items-center gap-8 text-sm uppercase tracking-widest font-medium">
            <Link to="/perfil" className={isActive('/perfil')}>Perfil</Link>
            <Link to="/cocina" className={isActive('/cocina')}>Cocina</Link>
            <Link to="/entrenamiento" className={isActive('/entrenamiento')}>Entrenamıento</Link>
            <Link to="/seguimiento" className={isActive('/seguimiento')}>Seguımıento</Link>
        </div>

        {/* USUARIO / DROPDOWN */}
        <div className="relative" ref={menuRef}> 
            <button 
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center gap-3 hover:opacity-80 transition-opacity group"
            >
                <div className="text-right hidden md:block">
                    <div className="text-xs font-bold text-white uppercase group-hover:text-sportRed transition-colors">{userName}</div>
                    <div className="text-[10px] text-gray-400 font-bold tracking-widest">
                        {loadingRole ? "..." : (userRole === 'pro' ? "MIEMBRO PRO" : (userRole === 'admin' ? "ADMINISTRADOR" : "PLAN GRATUITO"))}
                    </div>
                </div>
                
                <div className={`w-9 h-9 md:w-10 md:h-10 rounded-full flex items-center justify-center text-white font-bold shadow-lg ring-2 ring-transparent group-hover:ring-sportRed transition-all ${
                    userRole === 'pro' ? 'bg-gradient-to-tr from-sportRed to-red-600' : 
                    userRole === 'admin' ? 'bg-black border border-sportRed' : 'bg-gray-700' 
                }`}>
                    {userName.charAt(0).toUpperCase()}
                </div>
            </button>

            {/* MENÚ DESPLEGABLE */}
            {menuOpen && (
                <div className="absolute right-0 mt-4 w-64 bg-gray-900 rounded-xl shadow-2xl border border-gray-800 overflow-hidden animate-fade-in py-2 z-50">
                    
                    {/* 👇 SECCIÓN MÓVIL: NAVEGACIÓN (Solo visible en Mobile md:hidden) */}
                    <div className="md:hidden border-b border-gray-800 pb-2 mb-2">
                        <p className="px-4 py-2 text-[9px] font-black text-gray-600 uppercase tracking-[0.2em]">Navegación</p>
                        <Link to="/perfil" onClick={() => setMenuOpen(false)} className={mobileLinkStyle('/perfil')}>Perfil</Link>
                        <Link to="/cocina" onClick={() => setMenuOpen(false)} className={mobileLinkStyle('/cocina')}>Cocina</Link>
                        <Link to="/entrenamiento" onClick={() => setMenuOpen(false)} className={mobileLinkStyle('/entrenamiento')}>Entrenamiento</Link>
                        <Link to="/seguimiento" onClick={() => setMenuOpen(false)} className={mobileLinkStyle('/seguimiento')}>Seguimiento</Link>
                    </div>

                    {userRole === 'admin' && (
                        <>
                            <Link 
                                to="/admin"
                                onClick={() => setMenuOpen(false)}
                                className="flex items-center gap-2 w-full px-4 py-3 text-xs font-black uppercase tracking-widest text-white bg-sportRed hover:bg-red-700 transition-colors"
                            >
                                🛡️ PANEL CONTROL
                            </Link>
                            <div className="h-px bg-gray-800 my-1"></div>
                        </>
                    )}

                    <div className="px-4 py-3 bg-gray-800/50 border-b border-gray-800">
                        <p className="text-[9px] font-black text-gray-500 uppercase tracking-[0.2em] mb-2">Estado Suscripción</p>
                        {userRole === 'pro' ? (
                            <div className="space-y-1">
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-black text-sportRed uppercase italic">Activa (PRO)</span>
                                    {!autoRenew && <span className="text-[9px] text-orange-400 font-bold uppercase">Expira pronto</span>}
                                </div>
                                {autoRenew ? (
                                    <button onClick={() => { onCancelSub(); setMenuOpen(false); }} className="text-[9px] text-gray-500 font-bold uppercase hover:text-white transition-colors">
                                        Cancelar renovación
                                    </button>
                                ) : (
                                    <button onClick={() => { onReactivate(); setMenuOpen(false); }} className="text-[9px] text-green-500 font-black uppercase hover:underline">
                                        Reactivar ahora
                                    </button>
                                )}
                            </div>
                        ) : (
                            <button onClick={() => { onSubscribe(); setMenuOpen(false); }} className="w-full bg-sportRed text-white text-[10px] font-black py-2 rounded uppercase tracking-widest hover:bg-red-700 shadow-lg shadow-red-900/20 transform hover:scale-105 transition-all">
                                MEJORAR A PRO
                            </button>
                        )}
                    </div>

                    <div className="py-2 border-b border-gray-800">
                        <button 
                            onClick={() => { setMenuOpen(false); onOpenSettings(); }} 
                            className="w-full text-left px-4 py-2.5 text-[11px] font-bold text-gray-300 uppercase tracking-wider hover:bg-gray-800 hover:text-white transition-all flex items-center justify-between"
                        >
                            Configuración <span className="text-[10px] opacity-30">SET</span>
                        </button>

                        <button 
                            onClick={() => { setMenuOpen(false); onOpenSupport(); }} 
                            className="w-full text-left px-4 py-2.5 text-[11px] font-bold text-gray-300 uppercase tracking-wider hover:bg-gray-800 hover:text-white transition-all flex items-center justify-between"
                        >
                            Soporte / Ayuda <span className="text-[10px] opacity-30">HLP</span>
                        </button>
                    </div>

                    <div className="pt-2 bg-black/20">
                        <button 
                          onClick={() => { onLogout(); setMenuOpen(false); }} 
                          className="w-full text-left px-4 py-2.5 text-[11px] font-black uppercase tracking-[0.15em] text-gray-400 hover:text-white hover:bg-gray-800 transition-all"
                        >
                          Cerrar Sesión
                        </button>

                        <button 
                          onClick={() => { setMenuOpen(false); onDeleteAccount(); }} 
                          className="w-full text-left px-4 py-2 text-[9px] font-black uppercase tracking-tighter text-red-900/60 hover:text-sportRed transition-colors mt-1 pb-3"
                        >
                          Eliminar Cuenta Permanentemente
                        </button>
                    </div>
                </div>
            )}
        </div>
      </div>
    </nav>
  );
}