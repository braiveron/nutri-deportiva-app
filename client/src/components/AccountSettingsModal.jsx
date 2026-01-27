import { useState } from "react";
import { api } from "../services/api";

export default function AccountSettingsModal({ userId, currentName, onClose, onUpdateSuccess }) {
  
  // 👇 AQUÍ USAMOS 'currentName' PARA RELLENAR LOS CAMPOS AUTOMÁTICAMENTE
  // Si currentName es "Juan Perez", intenta separar nombre y apellido.
  const [nombre, setNombre] = useState(() => {
    if (!currentName) return "";
    return currentName.split(" ")[0]; // Toma la primera palabra
  });

  const [apellido, setApellido] = useState(() => {
    if (!currentName) return "";
    const parts = currentName.split(" ");
    return parts.length > 1 ? parts.slice(1).join(" ") : ""; // Toma el resto
  });

  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("datos");

  const handleUpdateData = async (e) => {
    e.preventDefault();
    setLoading(true);
    const res = await api.updateUserProfile(userId, { nombre, apellido });
    setLoading(false);

    if (res.success) {
      alert("✅ Datos actualizados correctamente.");
      // Actualizamos el nombre en la App globalmente
      if (onUpdateSuccess) onUpdateSuccess(`${nombre} ${apellido}`.trim()); 
      onClose();
    } else {
      alert("Error: " + res.error.message);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (password.length < 6) return alert("La contraseña debe tener al menos 6 caracteres.");
    
    setLoading(true);
    const res = await api.updateUserPassword(password);
    setLoading(false);

    if (res.success) {
      alert("🔒 Contraseña cambiada con éxito.");
      setPassword("");
      onClose();
    } else {
      alert("Error: " + res.error.message);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden relative">
        
        {/* Botón Cerrar */}
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-800">
          ✕
        </button>

        {/* Encabezado */}
        <div className="bg-gray-50 p-6 border-b border-gray-100">
          <h3 className="text-xl font-display font-bold text-gray-800 italic">CONFIGURAR CUENTA</h3>
          <p className="text-xs text-gray-500 mt-1">Edita tus datos de acceso.</p>
        </div>

        {/* Pestañas */}
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

        {/* Contenido */}
        <div className="p-6">
            
            {/* --- TAB DATOS --- */}
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
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Apellido</label>
                        <input 
                            type="text" 
                            className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:border-sportRed bg-gray-50"
                            placeholder="Tu apellido"
                            value={apellido}
                            onChange={(e) => setApellido(e.target.value)}
                            required
                        />
                    </div>
                    <button disabled={loading} className="w-full bg-sportDark text-white py-3 rounded-lg font-bold uppercase tracking-widest hover:bg-black transition-all mt-2">
                        {loading ? "Guardando..." : "Guardar Cambios"}
                    </button>
                </form>
            )}

            {/* --- TAB SEGURIDAD --- */}
            {activeTab === "seguridad" && (
                <form onSubmit={handleChangePassword} className="space-y-4">
                    <div className="bg-yellow-50 p-3 rounded border border-yellow-100 mb-4">
                        <p className="text-xs text-yellow-700">⚠️ Al cambiar tu contraseña, podrías tener que volver a iniciar sesión en otros dispositivos.</p>
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
                    <button disabled={loading} className="w-full bg-sportRed text-white py-3 rounded-lg font-bold uppercase tracking-widest hover:bg-red-700 transition-all mt-2 shadow-lg shadow-red-200">
                        {loading ? "Actualizando..." : "Cambiar Contraseña"}
                    </button>
                </form>
            )}

        </div>
      </div>
    </div>
  );
}