import { useState, useEffect, useCallback } from "react";
import { api } from "../services/api";

export default function AdminPage({ userRole }) {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  // Definimos la función con useCallback para estabilizarla
  const fetchTickets = useCallback(async () => {
    setLoading(true);
    try {
      // ⚠️ Si api.getAllTickets no existe en services/api.js, esto fallará
      const res = await api.getAllTickets();
      if (res && res.success) {
        setTickets(res.tickets);
      }
    } catch (error) {
      console.error("Error cargando tickets:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Efecto: Carga inicial
  useEffect(() => {
    if (userRole === 'admin') {
        fetchTickets();
    }
  }, [userRole, fetchTickets]);

  // Función para resolver
  const handleResolve = async (id) => {
    if(!window.confirm("¿Marcar este ticket como resuelto?")) return;
    
    try {
        const res = await api.resolveTicket(id);
        if (res.success) {
          fetchTickets(); // Recargamos la lista
        } else {
          alert("Error al actualizar");
        }
    } catch (error) {
        console.error(error);
        alert("Error de conexión");
    }
  };

  // Protección de Vista
  if (userRole !== 'admin') {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
            <span className="text-6xl mb-4">⛔</span>
            <h1 className="text-2xl font-bold text-gray-800 uppercase tracking-widest">Acceso Denegado</h1>
            <p className="text-gray-500 mt-2">No tienes permisos para estar aquí.</p>
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8 animate-fade-in pt-24">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
            <div>
                <h1 className="text-3xl font-display font-bold italic text-gray-900">
                    PANEL DE <span className="text-sportRed">ADMINISTRACIÓN</span>
                </h1>
                <p className="text-gray-500 text-sm">Gestiona reportes y soporte técnico.</p>
            </div>
            <button onClick={fetchTickets} className="bg-white px-4 py-2 rounded-lg shadow text-xs font-bold uppercase hover:bg-gray-50 transition-colors">
                🔄 Actualizar
            </button>
        </div>

        {loading ? (
            <div className="flex justify-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-sportRed"></div>
            </div>
        ) : tickets.length === 0 ? (
            <div className="bg-white p-12 rounded-2xl shadow-sm text-center">
                <span className="text-4xl">✅</span>
                <h3 className="text-xl font-bold mt-4 text-gray-800">Todo limpio</h3>
                <p className="text-gray-500">No hay tickets pendientes.</p>
            </div>
        ) : (
            <div className="grid gap-4">
                {tickets.map((ticket) => (
                    <div key={ticket.id} className={`bg-white p-6 rounded-xl shadow-sm border-l-4 ${ticket.status === 'open' ? 'border-sportRed' : 'border-green-500 opacity-75'}`}>
                        <div className="flex flex-col md:flex-row justify-between md:items-start gap-4">
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                    <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-widest ${ticket.status === 'open' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                                        {ticket.status === 'open' ? 'Pendiente' : 'Resuelto'}
                                    </span>
                                    <span className="text-xs text-gray-400">
                                        {new Date(ticket.created_at).toLocaleString()}
                                    </span>
                                </div>
                                <h3 className="font-bold text-lg text-gray-900 mb-1">{ticket.subject}</h3>
                                <p className="text-gray-600 text-sm mb-4 bg-gray-50 p-3 rounded-lg border border-gray-100">
                                    {ticket.message}
                                </p>
                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                    <span>👤 Enviado por:</span>
                                    {ticket.profiles ? (
                                        <span className="font-bold text-gray-700">
                                            {ticket.profiles.nombre} {ticket.profiles.apellido} ({ticket.profiles.email})
                                        </span>
                                    ) : (
                                        <span className="font-mono text-[10px]">{ticket.user_id}</span>
                                    )}
                                </div>
                            </div>
                            {ticket.status === 'open' && (
                                <button onClick={() => handleResolve(ticket.id)} className="bg-gray-900 text-white px-6 py-2 rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-sportRed transition-colors shadow-lg">
                                    Marcar Resuelto
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        )}
      </div>
    </div>
  );
}