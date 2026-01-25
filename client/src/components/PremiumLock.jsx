export default function PremiumLock({ onUnlock }) {
  return (
    <div className="w-full max-w-2xl mx-auto bg-gray-900 text-white rounded-xl shadow-2xl border border-gray-800 p-10 flex flex-col items-center text-center relative overflow-hidden group animate-fade-in">
      
      {/* Fondo decorativo (más sutil) */}
      <div className="absolute top-0 w-full h-1 bg-gradient-to-r from-transparent via-sportRed to-transparent opacity-50"></div>
      <div className="absolute -bottom-10 left-1/2 w-40 h-40 bg-sportRed/10 rounded-full blur-3xl -translate-x-1/2"></div>

      {/* ICONO */}
      <div className="bg-gray-800 p-3 rounded-full border border-gray-700 shadow-inner mb-6 text-2xl">
        🔒
      </div>

      {/* TEXTO */}
      <h3 className="text-5xl font-display font-bold uppercase italic tracking-wider text-white mb-2">
          Contenido <span className="text-sportRed">PRO</span>
      </h3>
      
      <p className="text-gray-400 text-sm font-medium max-w-md mb-10 leading-relaxed">
          Esta función avanzada requiere una suscripción activa.<br />
          Desbloquea todo el potencial ahora.
      </p>

      {/* 👇 AQUÍ AGREGAMOS LA LISTA (Manteniendo tu estilo) */}
      <div className="grid grid-cols-2 gap-x-6 gap-y-3 mb-10 text-left w-full max-w-xs">
          <div className="flex items-center gap-3">
              <span className="text-sportRed font-bold text-lg">✓</span>
              <span className="text-xs font-bold text-gray-300 uppercase tracking-widest">Recetas Ilimitadas</span>
          </div>
          <div className="flex items-center gap-3">
              <span className="text-sportRed font-bold text-lg">✓</span>
              <span className="text-xs font-bold text-gray-300 uppercase tracking-widest">Rutinas a Medida</span>
          </div>
          <div className="flex items-center gap-3">
              <span className="text-sportRed font-bold text-lg">✓</span>
              <span className="text-xs font-bold text-gray-300 uppercase tracking-widest">Macros Exactos</span>
          </div>
          <div className="flex items-center gap-3">
              <span className="text-sportRed font-bold text-lg">✓</span>
              <span className="text-xs font-bold text-gray-300 uppercase tracking-widest">Acceso Total</span>
          </div>
      </div>

      {/* BOTÓN */}
      <div className="flex flex-col gap-2 w-full max-w-xs">
         <button 
            onClick={onUnlock}
            className="w-full bg-sportRed hover:bg-red-700 text-white py-2 rounded-sm uppercase font-bold text-base tracking-widest transition-all shadow-[0_0_15px_rgba(220,38,38,0.3)] hover:shadow-[0_0_25px_rgba(220,38,38,0.5)] active:scale-95"
         >
            Desbloquear Acceso
         </button>
         <span className="text-[9px] text-gray-500 uppercase font-bold tracking-widest">
            1 mes por $4.99 - Cancela cuando quieras
         </span>
      </div>

    </div>
  );
}