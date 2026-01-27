import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

// He añadido userId a los props. Asegúrate de pasárselo desde el padre (App.jsx)
export default function Navbar({ onLogout, userRole, loadingRole, userName, userId, subscriptionEnd, autoRenew, onCancelSub, onReactivate }) {
  const location = useLocation();
  const [showSubModal, setShowSubModal] = useState(false);
  const [loadingPay, setLoadingPay] = useState(false);

  // 👇 LÓGICA MERCADO PAGO EN EL NAVBAR
  const handleMercadoPago = async () => {
    if (loadingPay) return;
    setLoadingPay(true);
    try {
      const response = await fetch('http://localhost:5000/api/crear-pago', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: userId }), // IMPORTANTE: Necesitamos el ID real
      });
      const data = await response.json();
      if (data.init_point) window.location.href = data.init_point;
      else alert("Error al iniciar el pago.");
    } catch (error) {
      console.error(error);
      alert("No se pudo conectar con el servidor.");
    } finally {
      setLoadingPay(false);
      setShowSubModal(false);
    }
  };

  const isActive = (path) => location.pathname === path 
    ? "text-sportRed border-b-2 border-sportRed" 
    : "text-gray-400 hover:text-white";

  const formatearFecha = (fechaISO) => {
    if (!fechaISO) return "---";
    return new Date(fechaISO).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <>
      <nav className="w-full bg-sportDark p-4 flex flex-col md:flex-row justify-between items-center shadow-lg sticky top-0 z-40 gap-4 md:gap-0 border-b border-gray-800">
        
        {/* LOGO */}
        <div className="flex items-center gap-4">
          <div className="font-display font-bold italic text-xl text-white tracking-tighter">
              NUTRI<span className="text-sportRed">SPORT</span>
          </div>
          
          {/* BADGE SUSCRIPCIÓN */}
          <div className="hidden md:block">
              {loadingRole ? (
                  <span className="text-[10px] text-gray-500 animate-pulse">Cargando...</span>
              ) : userRole === 'pro' ? (
                  <button 
                    onClick={() => setShowSubModal(true)}
                    className={`text-[10px] px-3 py-1 font-bold uppercase tracking-widest transition-all rounded-sm flex items-center gap-2 border ${
                        autoRenew 
                        ? "bg-white/10 hover:bg-white/20 text-sportRed border-sportRed/50" 
                        : "bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 border-orange-400/50"
                    }`}
                  >
                    <span>{autoRenew ? '★ Miembro PRO' : '⚠ Cancelado'}</span>
                    <span className="text-[8px] opacity-50">▼</span>
                  </button>
              ) : (
                  <button 
                    onClick={handleMercadoPago} // 👈 USAMOS LA NUEVA LÓGICA
                    disabled={loadingPay}
                    className="text-[10px] bg-sportRed hover:bg-red-700 text-white px-3 py-1 font-bold uppercase tracking-widest transition-all rounded-sm shadow-[0_0_10px_rgba(220,38,38,0.5)] animate-pulse disabled:opacity-50"
                  >
                    {loadingPay ? 'Procesando...' : 'Mejorar Plan'}
                  </button>
              )}
          </div>
        </div>

        {/* MENÚ */}
        <div className="flex gap-6 text-xs font-bold uppercase tracking-widest">
          <Link to="/perfil" className={`pb-1 transition-colors ${isActive('/perfil')}`}>Perfil</Link>
          <Link to="/cocina" className={`pb-1 transition-colors ${isActive('/cocina')}`}>Chef Personal</Link>
          <Link to="/entrenamiento" className={`pb-1 transition-colors ${isActive('/entrenamiento')}`}>Entreno</Link>
          <Link to="/seguimiento" className={`pb-1 transition-colors ${isActive('/seguimiento')}`}>Seguimiento</Link>

        </div>

        {/* USUARIO */}
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-gray-500 hidden md:block">{userName}</span>
          <button onClick={onLogout} className="text-xs font-bold text-gray-500 hover:text-red-500 uppercase border border-gray-600 px-3 py-1 hover:border-red-500 transition-all">Salir</button>
        </div>
      </nav>

      {/* --- MODAL DE GESTIÓN DE SUSCRIPCIÓN --- */}
      {showSubModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-gray-900 border border-gray-700 w-full max-w-sm rounded-lg shadow-2xl p-6 relative">
                
                <button onClick={() => setShowSubModal(false)} className="absolute top-3 right-3 text-gray-500 hover:text-white">✕</button>

                <h3 className="text-xl font-display font-bold text-white italic uppercase mb-1">Tu Membresía</h3>
                <div className={`h-1 w-20 mb-6 ${autoRenew ? 'bg-sportRed' : 'bg-orange-500'}`}></div>

                <div className="space-y-4 mb-8">
                    <div className="flex justify-between items-center border-b border-gray-800 pb-2">
                        <span className="text-gray-400 text-xs uppercase font-bold">Estado Actual</span>
                        <span className="text-white font-bold text-sm uppercase">Activo (PRO)</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-gray-800 pb-2">
                        <span className="text-gray-400 text-xs uppercase font-bold">Vencimiento</span>
                        <span className="text-white font-bold text-sm">{formatearFecha(subscriptionEnd)}</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-gray-800 pb-2">
                        <span className="text-gray-400 text-xs uppercase font-bold">Renovación</span>
                        <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded ${autoRenew ? 'bg-green-500/20 text-green-400' : 'bg-orange-500/20 text-orange-400'}`}>
                            {autoRenew ? 'Automática' : 'Cancelada'}
                        </span>
                    </div>
                </div>

                {autoRenew ? (
                    <button 
                        onClick={() => {
                            setShowSubModal(false);
                            onCancelSub();
                        }}
                        className="w-full border border-gray-600 text-gray-400 hover:border-red-500 hover:text-red-500 py-3 text-xs font-bold uppercase tracking-widest transition-colors"
                    >
                        Cancelar Suscripción
                    </button>
                ) : (
                    <button 
    onClick={() => {
        onReactivate();         // 1. Dispara la lógica global (Loading -> Éxito)
        setShowSubModal(false);  // 2. ¡Cierra este modal inmediatamente!
    }}
    className="w-full bg-white text-sportDark hover:bg-gray-200 py-3 text-xs font-bold uppercase tracking-widest transition-colors shadow-lg"
>
    ↻ Reactivar Membresía
</button>
                )}
            </div>
        </div>
      )}
    </>
  );
}