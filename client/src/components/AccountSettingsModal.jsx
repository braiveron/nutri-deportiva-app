import { useState, useEffect } from "react";
import { api } from "../services/api";

export default function AccountSettingsModal({ userId, currentName, onClose, onUpdateSuccess }) {
  // Inicializamos nombre y apellido separando el currentName
  const [nombre, setNombre] = useState(() => {
    if (!currentName) return "";
    return currentName.split(" ")[0];
  });

  const [apellido, setApellido] = useState(() => {
    if (!currentName) return "";
    const parts = currentName.split(" ");
    return parts.length > 1 ? parts.slice(1).join(" ") : "";
  });

  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("datos");
  
  // Estado para mensajes
  const [status, setStatus] = useState({ type: "", text: "" });

  // Limpiar mensaje automáticamente
  useEffect(() => {
    if (status.text) {
      const timer = setTimeout(() => setStatus({ type: "", text: "" }), 3000);
      return () => clearTimeout(timer);
    }
  }, [status]);

  const handleUpdateData = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus({ type: "", text: "" });

    try {
      // Llamamos a la API con nombre y apellido
      const res = await api.updateUserProfile(userId, { nombre, apellido });
      
      if (res.success) {
        setLoading(false);
        setStatus({ type: "success", text: "✓ Perfil actualizado correctamente" });
        
        // Esperamos un momento para que el usuario lea el mensaje y recargamos
        setTimeout(() => {
          if (onUpdateSuccess) {
            onUpdateSuccess(); 
          } else {
            // Respaldo por seguridad: forzar recarga si no hay función
            window.location.reload();
          }
          onClose(); // Cerramos el modal
        }, 1500); 

      } else {
        setLoading(false);
        const errorMsg = res.error?.message || "Error desconocido";
        setStatus({ type: "error", text: `❌ ${errorMsg}` });
      }
    } catch {
      setLoading(false);
      setStatus({ type: "error", text: "❌ Error de conexión" });
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (password.length < 6) {
      return setStatus({ type: "error", text: "La contraseña es muy corta (min. 6)" });
    }
    
    setLoading(true);
    const res = await api.updateUserPassword(password);
    setLoading(false);

    if (res.success) {
      setStatus({ type: "success", text: "✓ Contraseña cambiada con éxito" });
      setPassword("");
      setTimeout(onClose, 1500);
    } else {
      setStatus({ type: "error", text: "Error: " + (res.error?.message || "Fallo el cambio") });
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden relative">
        
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-800 z-10">
          ✕
        </button>

        <div className="bg-gray-50 p-6 border-b border-gray-100">
          <h3 className="text-xl font-display font-bold text-gray-800 italic">CONFIGURAR CUENTA</h3>
          <p className="text-xs text-gray-500 mt-1">Edita tus datos de acceso.</p>
        </div>

        {/* --- BANNER DE NOTIFICACIÓN --- */}
        <div className={`overflow-hidden transition-all duration-300 ${status.text ? 'h-12' : 'h-0'}`}>
            <div className={`flex items-center justify-center h-full text-xs font-bold uppercase tracking-widest ${status.type === 'success' ? 'bg-green-500 text-white' : 'bg-sportRed text-white'}`}>
                {status.text}
            </div>
        </div>

        <div className="flex border-b border-gray-100">
            <button 
                onClick={() => setActiveTab("datos")}
                className={`flex-1 py-3 text-sm font-bold uppercase tracking-wider transition-colors ${activeTab === "datos" ? "text-sportRed border-b-2 border-sportRed bg-red-50/50" : "text-gray-400 hover:bg-gray-50"}`}
            >
                Datos Personales
            </button>
            <button 
                onClick={() => setActiveTab("seguridad")}
                className={`flex-1 py-3 text-sm font-bold uppercase tracking-wider transition-colors ${activeTab === "seguridad" ? "text-sportRed border-b-2 border-sportRed bg-red-50/50" : "text-gray-400 hover:bg-gray-50"}`}
            >
                Contraseña
            </button>
        </div>

        <div className="p-6">
            {activeTab === "datos" && (
                <form onSubmit={handleUpdateData} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Nombre</label>
                        <input 
                            type="text" 
                            className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:border-sportRed bg-gray-50"
                            placeholder="Tu nombre"
                            value={nombre}
                            onChange={(e) => setNombre(e.target.value)}
                            required
                        />
                         <p className="text-[10px] text-gray-400 mt-1">
                            Así te llamará tu Nutri-Coach IA.
                        </p>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Apellido</label>
                        <input 
                            type="text" 
                            className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:border-sportRed bg-gray-50"
                            placeholder="Tu apellido"
                            value={apellido}
                            onChange={(e) => setApellido(e.target.value)}
                        />
                    </div>
                    <button disabled={loading} className="w-full bg-sportDark text-white py-3 rounded-lg font-bold uppercase tracking-widest hover:bg-black transition-all mt-2 disabled:opacity-50">
                        {loading ? "Guardando..." : "Guardar Cambios"}
                    </button>
                </form>
            )}

            {activeTab === "seguridad" && (
                <form onSubmit={handleChangePassword} className="space-y-4">
                    <div className="bg-yellow-50 p-3 rounded border border-yellow-100 mb-4">
                        <p className="text-[10px] text-yellow-700 font-medium">⚠️ Se cerrará la sesión en otros dispositivos al cambiar la clave.</p>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Nueva Contraseña</label>
                        <input 
                            type="password" 
                            className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:border-sportRed bg-gray-50"
                            placeholder="Mínimo 6 caracteres"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <button disabled={loading} className="w-full bg-sportRed text-white py-3 rounded-lg font-bold uppercase tracking-widest hover:bg-red-700 transition-all mt-2 shadow-lg shadow-red-200 disabled:opacity-50">
                        {loading ? "Actualizando..." : "Cambiar Contraseña"}
                    </button>
                </form>
            )}
        </div>
      </div>
    </div>
  );
}