import { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";

export default function Navbar({ 
  onLogout, 
  userRole, 
  loadingRole, 
  userName, 
  autoRenew, 
  onCancelSub, 
  onSubscribe, 
  onReactivate,
  onOpenSettings,
  onDeleteAccount
}) {
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // Close menu if clicked outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuRef]);

  const isActive = (path) => location.pathname === path ? "text-sportRed" : "text-white hover:text-sportRed";

  return (
    <nav className="bg-black/90 backdrop-blur-md text-white px-6 py-4 sticky top-0 z-50 border-b border-gray-800">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        
        {/* LOGO */}
        <Link to="/" className="text-2xl font-display font-bold italic tracking-tighter flex items-center gap-1">
          NUTRI<span className="text-sportRed">SPORT</span>
        </Link>

        {/* CENTRAL LINKS */}
        <div className="hidden md:flex gap-8 font-bold text-sm tracking-wider uppercase">
          <Link to="/perfil" className={`${isActive('/perfil')} transition-colors`}>Perfil</Link>
          <Link to="/cocina" className={`${isActive('/cocina')} transition-colors`}>Chef Personal</Link>
          <Link to="/entrenamiento" className={`${isActive('/entrenamiento')} transition-colors`}>Entreno</Link>
          <Link to="/seguimiento" className={`${isActive('/seguimiento')} transition-colors`}>Seguimiento</Link>
        </div>

        {/* USER / DROPDOWN */}
        <div className="relative" ref={menuRef}>
          <button 
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center gap-3 hover:bg-gray-800 py-1 px-2 rounded-lg transition-colors group"
          >
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold leading-none group-hover:text-sportRed transition-colors">{userName}</p>
              <p className="text-[10px] text-gray-400 uppercase tracking-widest mt-0.5">
                {loadingRole ? "..." : (userRole === 'pro' ? 'Miembro PRO' : 'Plan Gratuito')}
              </p>
            </div>
            <div className={`h-10 w-10 rounded-full flex items-center justify-center font-bold text-lg border-2 transition-all ${userRole === 'pro' ? 'bg-sportRed text-white border-sportRed' : 'bg-gray-800 text-gray-400 border-gray-700'}`}>
              {userName && userName.charAt(0).toUpperCase()}
            </div>
             {/* Small Arrow */}
             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={`w-4 h-4 text-gray-500 transition-transform ${menuOpen ? 'rotate-180' : ''}`}>
               <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
             </svg>
          </button>

          {/* --- DROPDOWN MENU --- */}
          {menuOpen && (
            <div className="absolute right-0 mt-3 w-64 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden text-gray-800 animate-fade-in origin-top-right transform">
              
              {/* Menu Header */}
              <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Tu Cuenta</p>
                  <p className="text-sm font-bold text-gray-800 truncate">{userName}</p>
              </div>

              {/* Options */}
              <div className="py-2">
                  <button 
          onClick={() => {
              setMenuOpen(false); // Cerramos el menú
              onOpenSettings();   // Abrimos el modal
          }} 
          className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 hover:text-sportRed font-medium transition-colors"
      >
          ⚙️ Configuración de Cuenta
      </button>
                  {/* Subscription Logic in Menu */}
                  {userRole === 'pro' ? (
                      autoRenew ? (
                          <button onClick={() => {onCancelSub(); setMenuOpen(false)}} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 text-orange-600 font-medium transition-colors">
                              📅 Cancelar Renovación
                          </button>
                      ) : (
                          <button onClick={() => {onReactivate(); setMenuOpen(false)}} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 text-green-600 font-medium transition-colors">
                              🔄 Reactivar Suscripción
                          </button>
                      )
                  ) : (
                      <button onClick={() => {onSubscribe(); setMenuOpen(false)}} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 text-sportRed font-bold transition-colors">
                          💎 Mejorar a PRO
                      </button>
                  )}
              </div>

              <div className="border-t border-gray-100 my-1"></div>

              {/* Session Actions */}
              <div className="py-2">
                  <button 
                      onClick={onLogout}
                      className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 font-medium transition-colors text-gray-600"
                  >
                      Cerrar Sesión
                  </button>
                  
                  {/* 👇 DELETE ACCOUNT BUTTON */}
                  <button 
                      onClick={() => {setMenuOpen(false); onDeleteAccount();}}
                      className="w-full text-left px-4 py-2 text-sm hover:bg-red-50 text-red-600 font-bold transition-colors flex items-center gap-2"
                  >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                        <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.52.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 4.193V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4ZM8.58 7.72a.75.75 0 0 0-1.5.06l.3 7.5a.75.75 0 1 0 1.5-.06l-.3-7.5Zm4.34.06a.75.75 0 1 0-1.5-.06l-.3 7.5a.75.75 0 1 0 1.5.06l.3-7.5Z" clipRule="evenodd" />
                      </svg>
                      Eliminar Cuenta
                  </button>
              </div>

            </div>
          )}
        </div>

      </div>
    </nav>
  );
}