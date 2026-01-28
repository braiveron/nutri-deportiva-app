import { useState } from "react";
import { api } from "../services/api";

export default function SupportModal({ userId, onClose }) {
  const [subject, setSubject] = useState("Bug/Error");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false); // Estado de éxito

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    setLoading(true);
    const res = await api.createSupportTicket(userId, subject, message);
    setLoading(false);

    if (res.success) {
      setSent(true); 
      // ❌ QUITAMOS EL TIMEOUT AQUÍ. 
      // Ahora esperamos a que el usuario cierre manualmente.
    } else {
      alert("Error al enviar. Intenta nuevamente.");
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden relative">
        
        {/* Botón X (siempre visible para salir rápido) */}
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-800 z-10">
          ✕
        </button>

        {/* Encabezado */}
        <div className="bg-gray-900 p-6 border-b border-gray-800">
          <h3 className="text-xl font-display font-bold text-white italic">SOPORTE <span className="text-sportRed">TÉCNICO</span></h3>
          <p className="text-xs text-gray-400 mt-1">Reporta errores o problemas con tu cuenta.</p>
        </div>

        <div className="p-6">
          {sent ? (
            // 👇 VISTA DE ÉXITO CON BOTÓN MANUAL
            <div className="flex flex-col items-center justify-center py-6 text-center animate-fade-in">
              <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-4xl mb-6 shadow-sm">
                ✓
              </div>
              <h4 className="font-bold text-xl text-gray-900 mb-2">¡Reporte Enviado!</h4>
              <p className="text-sm text-gray-500 mb-8 px-4">
                Gracias por avisarnos. El equipo técnico revisará tu caso y te contactará si es necesario.
              </p>
              
              <button 
                onClick={onClose}
                className="w-full bg-black text-white py-3 rounded-lg font-bold uppercase tracking-widest hover:bg-gray-800 transition-all"
              >
                Entendido, Cerrar
              </button>
            </div>
          ) : (
            // 👇 FORMULARIO NORMAL
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Motivo</label>
                <select 
                    className="w-full p-3 border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:border-sportRed"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                >
                    <option value="Bug/Error">🐛 Reportar un Error</option>
                    <option value="Pagos">💳 Problema con Pagos</option>
                    <option value="Cuenta">👤 Problema de Cuenta</option>
                    <option value="Sugerencia">💡 Sugerencia</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Descripción</label>
                <textarea 
                    className="w-full p-3 border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:border-sportRed h-32 resize-none"
                    placeholder="Describe el problema con detalle..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    required
                ></textarea>
              </div>

              <button 
                disabled={loading}
                className="w-full bg-sportDark text-white py-3 rounded-lg font-bold uppercase tracking-widest hover:bg-black transition-all shadow-lg"
              >
                {loading ? "Enviando..." : "Enviar Reporte"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}