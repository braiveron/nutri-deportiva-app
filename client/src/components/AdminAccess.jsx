import { useState } from 'react';
import { api } from '../services/api';
import StatusModal from './StatusModal'; // 👈 1. Importamos tu Modal

export default function AdminAccess({ userId, onRoleUpdate }) {
  const [key, setKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [showInput, setShowInput] = useState(false);
  
  // 👈 2. Estado para el Modal
  const [modal, setModal] = useState({ show: false, type: 'success', title: '', message: '' });

  const handleSubmit = async () => {
    if (!key) return;
    setLoading(true);

    try {
        const res = await api.claimAdminRole(userId, key);

        if (res.success) {
            // ✅ ÉXITO: Mostramos Modal Verde
            setModal({
                show: true,
                type: 'success',
                title: '¡Acceso Concedido!',
                message: res.message || 'Bienvenido al modo Administrador.',
                isSuccess: true // Bandera para saber si recargar al cerrar
            });
            
            if (onRoleUpdate) onRoleUpdate('admin');
            setShowInput(false);
        } else {
            // ❌ ERROR: Mostramos Modal Rojo
            setModal({
                show: true,
                type: 'error',
                title: 'Acceso Denegado',
                message: res.error || 'La clave maestra es incorrecta.',
                isSuccess: false
            });
        }
    } catch {
        setModal({
            show: true,
            type: 'error',
            title: 'Error de Conexión',
            message: 'No se pudo verificar la clave.',
            isSuccess: false
        });
    } finally {
        setLoading(false);
        setKey('');
    }
  };

  // Función para cerrar el modal
  const handleCloseModal = () => {
      // Si fue éxito, recargamos la página al cerrar el modal para aplicar cambios
      if (modal.isSuccess) {
          window.location.reload();
      }
      setModal({ ...modal, show: false });
  };

  return (
    <>
        {/* Renderizamos el Modal aquí (si show es true) */}
        {modal.show && (
            <StatusModal 
                show={modal.show}
                type={modal.type}
                title={modal.title}
                message={modal.message}
                onClose={handleCloseModal}
            />
        )}

        <div className="relative inline-flex items-center">
            {/* TRIGGER: Estilo idéntico al footer */}
            <span 
                onClick={() => setShowInput(!showInput)} 
                className="cursor-pointer hover:text-sportRed transition-colors uppercase tracking-widest text-[10px] font-bold"
            >
                {showInput ? "CERRAR" : "ZONA ADMIN"}
            </span>

            {/* INPUT FLOTANTE */}
            {showInput && (
                <div className="absolute bottom-full mb-3 right-0 bg-white border border-gray-200 shadow-xl p-2 rounded flex gap-1 z-50 w-48 animate-fade-in-up">
                    <input 
                        type="password" 
                        value={key}
                        onChange={(e) => setKey(e.target.value)}
                        placeholder="Clave maestra..."
                        className="flex-1 p-1 text-xs border border-gray-300 rounded outline-none text-black font-normal normal-case tracking-normal"
                        autoFocus
                        onKeyDown={(e) => e.key === 'Enter' && handleSubmit()} // Permitir Enter para enviar
                    />
                    <button 
                        onClick={handleSubmit}
                        disabled={loading}
                        className="bg-black text-white px-2 py-1 rounded text-[10px] font-bold uppercase hover:bg-gray-800 disabled:opacity-50"
                    >
                        {loading ? "..." : "OK"}
                    </button>
                </div>
            )}
        </div>
    </>
  );
}