import { useState } from 'react';

export default function SubscriptionStatus({ userRole, subscriptionEnd, autoRenew, onCancel, onSubscribe }) {
  const [loading, setLoading] = useState(false);

  // Formatear fecha bonita (ej: 25 de Febrero, 2026)
  const formatearFecha = (fechaISO) => {
    if (!fechaISO) return "---";
    return new Date(fechaISO).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const handleCancel = async () => {
    if (!window.confirm("¿Seguro que quieres cancelar? Perderás los beneficios cuando termine tu periodo actual.")) return;
    
    setLoading(true);
    await onCancel(); // Llamamos a la función que pasaremos desde App
    setLoading(false);
  };

  // CASO 1: USUARIO FREE
  if (userRole !== 'pro') {
    return (
        <div className="w-full max-w-5xl bg-gray-900 text-white p-6 border-l-4 border-gray-600 flex flex-col md:flex-row justify-between items-center gap-4 mb-8 shadow-lg">
            <div>
                <h3 className="text-xl font-display font-bold uppercase italic text-gray-400">Estado: <span className="text-white">GRATUITO</span></h3>
                <p className="text-xs text-gray-400">Sube a PRO para desbloquear Chef y Entrenador IA.</p>
            </div>
            <button 
                onClick={onSubscribe}
                className="bg-sportRed hover:bg-red-700 text-white px-6 py-2 rounded-sm uppercase font-bold text-xs tracking-widest transition-all"
            >
                Mejorar a PRO ($4.99)
            </button>
        </div>
    );
  }

  // CASO 2: USUARIO PRO (ACTIVO O CANCELADO)
  const fechaFin = formatearFecha(subscriptionEnd);

  return (
    <div className="w-full max-w-5xl bg-gray-900 text-white p-6 border-l-4 border-sportRed flex flex-col md:flex-row justify-between items-center gap-6 mb-8 shadow-lg relative overflow-hidden">
        
        {/* Decoración de fondo */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-sportRed/10 rounded-full blur-3xl translate-x-10 -translate-y-10"></div>

        <div className="z-10">
            <div className="flex items-center gap-3 mb-1">
                <h3 className="text-xl font-display font-bold uppercase italic">
                    Estado: <span className="text-sportRed">MIEMBRO PRO</span>
                </h3>
                {/* Badge de estado */}
                {autoRenew ? (
                    <span className="bg-green-500/20 text-green-400 text-[10px] font-bold px-2 py-0.5 rounded border border-green-500/30 uppercase tracking-wide">
                        Renovación Activa
                    </span>
                ) : (
                    <span className="bg-orange-500/20 text-orange-400 text-[10px] font-bold px-2 py-0.5 rounded border border-orange-500/30 uppercase tracking-wide">
                        Cancelación Programada
                    </span>
                )}
            </div>

            <p className="text-sm text-gray-300">
                {autoRenew 
                    ? `Tu próxima facturación será el ${fechaFin}.` 
                    : `Tu acceso PRO finalizará el ${fechaFin}.`
                }
            </p>
        </div>

        <div className="z-10">
            {autoRenew ? (
                <button 
                    onClick={handleCancel}
                    disabled={loading}
                    className="text-xs font-bold text-gray-400 hover:text-white border border-gray-600 hover:border-white px-4 py-2 uppercase tracking-widest transition-all"
                >
                    {loading ? 'Procesando...' : 'Cancelar Suscripción'}
                </button>
            ) : (
                <button 
                    onClick={onSubscribe} // Reutilizamos suscribirse para "Reactivar"
                    className="text-xs font-bold bg-white text-sportDark hover:bg-gray-200 px-6 py-2 uppercase tracking-widest transition-all"
                >
                    Reactivar Renovación
                </button>
            )}
        </div>
    </div>
  );
}