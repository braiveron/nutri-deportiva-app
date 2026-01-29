import { useEffect } from "react";
import { createPortal } from "react-dom"; // 👈 Importamos esto para el "teletransporte"

export default function StatusModal({ type, title, message, onClose, onConfirm }) {
  const isSuccess = type === 'success';
  const isError = type === 'error'; 
  const isConfirm = type === 'confirm'; 
  const isLoading = type === 'loading';

  const showActionButtons = (isConfirm || isError) && typeof onConfirm === 'function';

  // Bloqueamos el scroll del cuerpo cuando el modal está abierto
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  // El contenido del modal
  const modalContent = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center px-4 animate-fade-in">
      
      {/* 1. FONDO OSCURO (BLOQUEO) RESTAURADO */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={(!isLoading && !showActionButtons) ? onClose : undefined} 
      ></div>

      {/* 2. EL MODAL */}
      <div className="relative bg-sportDark border-2 border-white/10 shadow-2xl rounded-2xl p-8 max-w-sm w-full text-center transform transition-all scale-100">
        
        {/* ICONO */}
        <div className={`mx-auto flex items-center justify-center h-16 w-16 rounded-full mb-6 ${
            isSuccess ? 'bg-green-500/10 text-green-500' : 
            isError ? 'bg-red-500/10 text-red-500' : 
            isLoading ? 'bg-blue-500/10 text-blue-400' : 
            'bg-yellow-500/10 text-yellow-500' 
        }`}>
            {isSuccess && (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
            )}
            {(isError || (isConfirm && !isSuccess && !isLoading)) && (
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    {isError ? (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    )}
                 </svg>
            )}
            {isLoading && (
                <svg className="animate-spin h-8 w-8" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
            )}
        </div>

        <h3 className="text-2xl font-display font-bold text-white italic mb-2 uppercase tracking-wide">
            {title}
        </h3>
        <p className="text-gray-300 text-sm mb-8 leading-relaxed font-medium">
            {message}
        </p>

        {/* BOTONES */}
        {!isLoading && (
            <>
                {showActionButtons ? (
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="flex-1 py-3 rounded-lg font-bold text-xs uppercase tracking-widest bg-white/5 hover:bg-white/10 text-gray-300 transition-colors border border-white/10"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={onConfirm}
                            className={`flex-1 py-3 rounded-lg font-bold text-xs uppercase tracking-widest text-white shadow-lg transition-transform transform hover:scale-105 ${
                                isError 
                                ? 'bg-red-600 hover:bg-red-500 shadow-red-900/20' 
                                : 'bg-sportRed hover:bg-red-600 shadow-red-900/20'
                            }`}
                        >
                            {isError ? 'ELIMINAR' : 'CONFIRMAR'}
                        </button>
                    </div>
                ) : (
                    <button
                    onClick={onClose}
                    className={`w-full py-3 px-4 rounded-lg font-bold text-sm uppercase tracking-widest transition-all transform hover:scale-[1.02] shadow-lg ${
                        isSuccess 
                        ? 'bg-green-600 hover:bg-green-500 text-white shadow-green-900/20' 
                        : 'bg-white/10 hover:bg-white/20 text-white border border-white/10'
                    }`}
                    >
                    {isSuccess ? '¡Vamos!' : 'Entendido'}
                    </button>
                )}
            </>
        )}
      </div>
    </div>
  );

  // 🔥 MAGIA: Usamos createPortal para renderizarlo fuera de la jerarquía actual
  // Esto hace que "salte" cualquier overflow:hidden o transform del padre
  return createPortal(modalContent, document.body);
}