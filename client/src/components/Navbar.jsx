import { useState } from "react";
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

  // Lógica de estilos: Si está activo es ROJO, si no es GRIS CLARO (hover BLANCO)
  const isActive = (path) => location.pathname === path 
    ? "text-sportRed font-bold border-b-2 border-sportRed pb-1" 
    : "text-gray-400 hover:text-white transition-colors pb-1 border-b-2 border-transparent hover:border-gray-700";

  return (
    // CAMBIO PRINCIPAL: bg-gray-900/90 (Oscuro transparente) + backdrop-blur + sombra
    <nav className="sticky top-0 z-50 bg-gray-900/10 backdrop-blur-md border-b border-gray-800 shadow-lg px-6 py-4">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        
        {/* LOGO */}
        <div className="flex items-center gap-2">
          <Link to="/bienvenida" className="flex items-center group">
            <h1 className="text-2xl font-black italic tracking-tighter leading-none select-none transition-transform group-hover:scale-105">
                {/* Texto NUTRI en blanco para fondo oscuro */}
                <span className="text-white">NUTRI</span>
                <span className="text-sportRed">SPORT</span>
            </h1>
          </Link>
        </div>

        {/* MENU DESKTOP */}
        <div className="hidden md:flex items-center gap-8 text-sm uppercase tracking-widest font-medium">
            <Link to="/perfil" className={isActive('/perfil')}>Perfil</Link>
            <Link to="/cocina" className={isActive('/cocina')}>Cocina</Link>
            <Link to="/entrenamiento" className={isActive('/entrenamiento')}>Entreno</Link>
            <Link to="/seguimiento" className={isActive('/seguimiento')}>Diario</Link>
        </div>

        {/* USUARIO / DROPDOWN */}
        <div className="relative">
            <button 
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center gap-3 hover:opacity-80 transition-opacity group"
            >
                <div className="text-right hidden md:block">
                    {/* Nombre en blanco */}
                    <div className="text-xs font-bold text-white uppercase group-hover:text-sportRed transition-colors">{userName}</div>
                    <div className="text-[10px] text-gray-400 font-bold tracking-widest">
                        {loadingRole ? "..." : (userRole === 'pro' ? "MIEMBRO PRO" : (userRole === 'admin' ? "ADMINISTRADOR" : "PLAN GRATUITO"))}
                    </div>
                </div>
                
                {/* Avatar */}
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shadow-lg ring-2 ring-transparent group-hover:ring-sportRed transition-all ${
                    userRole === 'pro' ? 'bg-gradient-to-tr from-sportRed to-red-600' : 
                    userRole === 'admin' ? 'bg-black border border-sportRed' : 'bg-gray-700' 
                }`}>
                    {userName.charAt(0).toUpperCase()}
                </div>
            </button>

            {/* MENÚ DESPLEGABLE (Este lo mantenemos en BLANCO para legibilidad, o podemos hacerlo oscuro también) */}
            {menuOpen && (
                <div className="absolute right-0 mt-4 w-64 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden animate-fade-in py-2 z-50">
                    
                    {/* 👇 ADMIN ZONE */}
                    {userRole === 'admin' && (
                        <>
                            <Link 
                                to="/admin"
                                onClick={() => setMenuOpen(false)}
                                className="flex items-center gap-2 w-full px-4 py-3 text-sm font-bold text-white bg-black hover:bg-gray-800 transition-colors"
                            >
                                🛡️ Panel de Control
                            </Link>
                            <div className="h-px bg-gray-100 my-1"></div>
                        </>
                    )}

                    {/* OPCIONES DE SUSCRIPCIÓN */}
                    <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Suscripción</p>
                        {userRole === 'pro' ? (
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs font-bold text-sportRed">Activa (PRO)</span>
                                    {!autoRenew && <span className="text-[10px] text-orange-500">Cancela al fin</span>}
                                </div>
                                {autoRenew ? (
                                    <button onClick={onCancelSub} className="text-[10px] text-gray-500 underline hover:text-red-500 w-full text-left">
                                        Cancelar renovación
                                    </button>
                                ) : (
                                    <button onClick={onReactivate} className="text-[10px] text-green-600 font-bold hover:underline w-full text-left">
                                        Reactivar suscripción
                                    </button>
                                )}
                            </div>
                        ) : (
                            <button onClick={onSubscribe} className="w-full bg-sportRed text-white text-xs font-bold py-2 rounded uppercase tracking-widest hover:bg-red-700 shadow-md transform hover:scale-105 transition-all">
                                Mejorar a PRO
                            </button>
                        )}
                    </div>

                    {/* OPCIONES DE CUENTA */}
                    <div className="py-2">
                        <button 
                            onClick={() => {
                                setMenuOpen(false);
                                onOpenSettings();
                            }} 
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-sportRed font-medium transition-colors flex items-center gap-2"
                        >
                            <span>⚙️</span> Configuración
                        </button>

                        <button 
                            onClick={() => {
                                setMenuOpen(false);
                                onOpenSupport();
                            }} 
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-sportRed font-medium transition-colors flex items-center gap-2"
                        >
                            <span>🛠️</span> Soporte / Ayuda
                        </button>
                    </div>

                    <div className="h-px bg-gray-100 my-1"></div>

                    {/* ZONA DE PELIGRO */}
                    <div className="py-2">
                        <button onClick={onLogout} className="w-full text-left px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 hover:text-black font-medium transition-colors">
                            Cerrar Sesión
                        </button>
                        <button onClick={onDeleteAccount} className="w-full text-left px-4 py-2 text-xs text-red-300 hover:text-red-600 hover:bg-red-50 transition-colors mt-1">
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