import React from 'react';
import { createPortal } from 'react-dom'; 

export default function StatusModal({ 
  type = 'info', 
  title, 
  message, 
  onClose, 
  onConfirm, 
  confirmText = "ACEPTAR", 
  cancelText = "CANCELAR" 
}) {
  
  const colors = {
    success: { 
        bg: 'bg-green-50', border: 'border-green-500', text: 'text-green-800', 
        icon: '✅', btn: 'bg-green-600 hover:bg-green-700 text-white' 
    },
    error: { 
        bg: 'bg-red-50', border: 'border-red-500', text: 'text-red-800', 
        icon: '❌', btn: 'bg-red-600 hover:bg-red-700 text-white' 
    },
    warning: { 
        bg: 'bg-yellow-50', border: 'border-yellow-500', text: 'text-yellow-800', 
        icon: '⚠️', btn: 'bg-yellow-500 hover:bg-yellow-600 text-white' 
    },
    info: { 
        bg: 'bg-blue-50', border: 'border-blue-500', text: 'text-blue-800', 
        icon: 'ℹ️', btn: 'bg-blue-600 hover:bg-blue-700 text-white' 
    },
    confirm: { 
        bg: 'bg-green-50', border: 'border-green-500', text: 'text-green-800', 
        icon: '🎉', btn: 'bg-green-600 hover:bg-green-700 text-white' 
    },
    loading: {
        bg: 'bg-gray-50', border: 'border-gray-300', text: 'text-gray-700',
        icon: '⏳', btn: 'hidden' 
    }
  };

  const style = colors[type] || colors.info;

  // Bloqueamos cierre si es loading o confirmación obligatoria
  const handleBackdropClick = (e) => {
      if (type === 'loading') return;
      if (type === 'confirm') return; 
      if (e.target === e.currentTarget && onClose) {
          onClose();
      }
  };

  const modalContent = (
    <div 
        className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
        onClick={handleBackdropClick}
    >
      
      <div className={`bg-white w-full max-w-sm rounded-xl shadow-2xl overflow-hidden transform transition-all scale-100 border-t-4 ${style.border}`}>
        
        {/* CUERPO */}
        <div className={`p-6 text-center ${style.bg}`}>
            <div className={`text-4xl mb-3 drop-shadow-md ${type === 'loading' ? 'animate-spin' : 'animate-bounce-slow'}`}>
                {type === 'loading' ? '⚙️' : style.icon}
            </div>
            <h3 className={`text-xl font-black uppercase italic tracking-wider mb-2 ${style.text}`}>
              {title}
            </h3>
            <p className="text-gray-600 text-sm font-medium leading-relaxed">
              {message}
            </p>
        </div>

        {/* 👇 CORRECCIÓN: OCULTAR COMPLETAMENTE LOS BOTONES SI ES LOADING */}
        {type !== 'loading' && (
            <div className="bg-white p-4 flex gap-3 justify-center border-t border-gray-100">
                {onConfirm ? (
                    <>
                        {type !== 'confirm' && (
                            <button 
                                onClick={onClose}
                                className="flex-1 py-3 bg-white border border-gray-200 text-gray-500 font-bold uppercase text-xs rounded-lg hover:bg-gray-100 transition-colors tracking-wider"
                            >
                                {cancelText}
                            </button>
                        )}
                        <button 
                            onClick={onConfirm}
                            className={`flex-1 py-3 font-bold uppercase text-xs rounded-lg shadow-md transition-transform active:scale-95 tracking-wider ${style.btn}`}
                        >
                            {confirmText}
                        </button>
                    </>
                ) : (
                    <button 
                        onClick={onClose}
                        className="w-full py-3 bg-gray-900 text-white font-bold uppercase text-xs rounded-lg hover:bg-black transition-colors tracking-wider shadow-lg"
                    >
                        ENTENDIDO
                    </button>
                )}
            </div>
        )}
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}