import { useState, useEffect, useCallback } from "react";
import { api } from "../services/api";
import { supabase } from "../supabase";

export default function AdminPage({ userRole }) {
  const [activeTab, setActiveTab] = useState('tickets');
  const [tickets, setTickets] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingUser, setUpdatingUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const [paymentModal, setPaymentModal] = useState({
    show: false,
    type: 'confirm',
    title: '',
    message: '',
    onConfirm: null
  });

  const handleOpenUserDetail = (user) => {
    setSelectedUser(user);
    setIsDetailModalOpen(true);
  };

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.getAllTickets();
      if (res && res.success) setTickets(res.tickets);
    } catch (error) {
      console.error("Error cargando tickets:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error("Error cargando usuarios:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const executeSubscriptionChange = async (userId, newTier) => {
    setPaymentModal(prev => ({ ...prev, show: false }));
    setUpdatingUser(userId);
    
    try {
      const newDate = newTier === 'pro' 
        ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() 
        : null;

      const { error } = await supabase
        .from('profiles')
        .update({ 
          subscription_tier: newTier,
          subscription_end_date: newDate 
        })
        .eq('id', userId);

      if (error) throw error;

      setUsers(prev => prev.map(u => 
        u.id === userId ? { ...u, subscription_tier: newTier, subscription_end_date: newDate } : u
      ));
      
    } catch (error) {
      console.error("Error actualizando membresía:", error);
      setPaymentModal({
        show: true,
        type: 'error',
        title: 'Error',
        message: 'No se pudo actualizar la membresía.',
        onConfirm: () => setPaymentModal(prev => ({ ...prev, show: false }))
      });
    } finally {
      setUpdatingUser(null);
    }
  };

  const toggleSubscription = (user) => {
    const currentTier = (user.subscription_tier || 'free').toUpperCase();
    const newTier = user.subscription_tier === 'pro' ? 'free' : 'pro';
    const nombreUsuario = user.nombre ? `${user.nombre} ${user.apellido || ''}` : user.email;
    
    setPaymentModal({
      show: true,
      type: 'confirm',
      title: 'Cambiar Membresía',
      message: `¿Confirmas cambiar a ${nombreUsuario} de plan ${currentTier} a ${newTier.toUpperCase()}?`,
      onConfirm: () => executeSubscriptionChange(user.id, newTier)
    });
  };

  const handleResolve = (id) => {
    setPaymentModal({
      show: true,
      type: 'confirm',
      title: 'Resolver Ticket',
      message: '¿Marcar este ticket como resuelto?',
      onConfirm: async () => {
        setPaymentModal(prev => ({ ...prev, show: false }));
        try {
            const res = await api.resolveTicket(id);
            if (res.success) fetchTickets();
        } catch (error) { console.error(error); }
      }
    });
  };

  const filteredUsers = users.filter(user => {
    const fullName = `${user.nombre || ''} ${user.apellido || ''}`.toLowerCase();
    const email = (user.email || '').toLowerCase();
    const search = searchTerm.toLowerCase();
    return fullName.includes(search) || email.includes(search);
  });

  useEffect(() => {
    if (userRole === 'admin') {
        if (activeTab === 'tickets') fetchTickets();
        if (activeTab === 'users') fetchUsers();
    }
    // IMPORTANTE: Solo dependemos de estos dos para evitar el bucle de renders
  }, [userRole, activeTab, fetchTickets, fetchUsers]);

  if (userRole !== 'admin') {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4 text-black">
            <span className="text-6xl mb-4">⛔</span>
            <h1 className="text-2xl font-bold text-gray-800 uppercase tracking-widest">Acceso Denegado</h1>
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8 animate-fade-in pt-24 font-sans text-black">
      <div className="max-w-6xl mx-auto">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div>
                <h1 className="text-3xl font-black uppercase italic text-gray-900 tracking-tighter">
                    PANEL DE <span className="text-sportRed">CONTROL</span>
                </h1>
                <p className="text-gray-500 text-sm font-medium">Gestión de usuarios y soporte técnico.</p>
            </div>
            
            <div className="flex bg-white p-1 rounded-xl shadow-sm border border-gray-200">
                <button 
                    onClick={() => setActiveTab('tickets')}
                    className={`px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all ${activeTab === 'tickets' ? 'bg-sportRed text-white shadow-md' : 'text-gray-400 hover:text-gray-600'}`}
                >
                    🎟️ Tickets
                </button>
                <button 
                    onClick={() => setActiveTab('users')}
                    className={`px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all ${activeTab === 'users' ? 'bg-sportRed text-white shadow-md' : 'text-gray-400 hover:text-gray-600'}`}
                >
                    👥 Usuarios
                </button>
            </div>
        </div>

        {loading ? (
            <div className="flex justify-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-sportRed"></div>
            </div>
        ) : (
            <div className="animate-fade-in">
                
                {activeTab === 'tickets' && (
                    <div className="grid gap-4">
                        {tickets.length === 0 ? (
                            <div className="bg-white p-12 rounded-2xl text-center shadow-sm">
                                <p className="text-gray-400 font-medium italic">No hay tickets pendientes.</p>
                            </div>
                        ) : (
                            tickets.map(ticket => (
                                <div key={ticket.id} className={`bg-white p-6 rounded-xl shadow-sm border-l-4 ${ticket.status === 'open' ? 'border-sportRed' : 'border-green-500'}`}>
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <span className="text-[10px] font-bold uppercase text-gray-400 block mb-1">Asunto</span>
                                            <h3 className="font-bold text-lg text-gray-900">{ticket.subject}</h3>
                                            <p className="text-gray-600 text-sm mt-1">{ticket.message}</p>
                                        </div>
                                        {ticket.status === 'open' && (
                                            <button onClick={() => handleResolve(ticket.id)} className="bg-black text-white px-4 py-2 rounded-lg text-[10px] font-bold uppercase hover:bg-sportRed transition-colors">Resolver</button>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {activeTab === 'users' && (
                    <div className="animate-fade-in">
                        <div className="mb-6 relative group">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
                            <input 
                                type="text"
                                placeholder="BUSCAR POR NOMBRE O EMAIL..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-white border border-gray-200 rounded-2xl py-4 pl-12 pr-4 text-xs font-bold uppercase tracking-widest focus:outline-none focus:border-sportRed focus:ring-1 focus:ring-sportRed shadow-sm transition-all"
                            />
                        </div>

                        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gray-50 border-b border-gray-200">
                                        <th className="p-4 text-[10px] font-bold text-gray-400 uppercase">Usuario</th>
                                        <th className="p-4 text-[10px] font-bold text-gray-400 uppercase text-center">Plan</th>
                                        <th className="p-4 text-[10px] font-bold text-gray-400 uppercase text-center">Vencimiento</th>
                                        <th className="p-4 text-[10px] font-bold text-gray-400 uppercase text-right">Acción</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredUsers.length === 0 ? (
                                        <tr>
                                            <td colSpan="4" className="p-12 text-center text-gray-400 italic text-sm">No hay resultados.</td>
                                        </tr>
                                    ) : (
                                        filteredUsers.map(user => (
                                            <tr key={user.id} onClick={() => handleOpenUserDetail(user)} className="border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer">
                                                <td className="p-4">
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-gray-900 capitalize">{user.nombre || 'Sin nombre'} {user.apellido || ''}</span>
                                                        <span className="text-xs text-gray-400">{user.email}</span>
                                                    </div>
                                                </td>
                                                <td className="p-4 text-center">
                                                    <span className={`px-2 py-1 rounded text-[9px] font-black uppercase inline-block min-w-[50px] ${user.subscription_tier === 'pro' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
                                                        {user.subscription_tier || 'free'}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-xs text-gray-500 text-center font-medium">
                                                    {user.subscription_end_date ? new Date(user.subscription_end_date).toLocaleDateString() : 'N/A'}
                                                </td>
                                                <td className="p-4 text-right">
                                                    {user.role !== 'admin' ? (
                                                        <button 
                                                            disabled={updatingUser === user.id}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                toggleSubscription(user);
                                                            }}
                                                            className={`px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase transition-all shadow-sm ${
                                                                user.subscription_tier === 'pro' ? 'bg-red-50 text-red-600 hover:bg-red-600' : 'bg-green-50 text-green-600 hover:bg-green-600'
                                                            } hover:text-white disabled:opacity-50`}
                                                        >
                                                            {updatingUser === user.id ? '...' : user.subscription_tier === 'pro' ? 'Quitar PRO' : 'Hacer PRO'}
                                                        </button>
                                                    ) : (
                                                        <span className="text-[9px] font-bold text-gray-300 uppercase italic">Administrador</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        )}
      </div>

      {/* MODAL GLOBAL (PAGOS/ERRORES) */}
      {paymentModal.show && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-sm w-full p-8 text-center shadow-2xl">
            <div className="text-5xl mb-4">{paymentModal.type === 'confirm' ? '🧐' : '❌'}</div>
            <h2 className="text-2xl font-black uppercase italic mb-2 text-gray-900">{paymentModal.title}</h2>
            <p className="text-gray-500 text-sm mb-8 font-medium">{paymentModal.message}</p>
            <div className="flex gap-4">
                {paymentModal.type === 'confirm' && (
                    <button onClick={() => setPaymentModal(prev => ({ ...prev, show: false }))} className="flex-1 px-4 py-3 text-xs font-bold uppercase text-gray-400 rounded-2xl">Cancelar</button>
                )}
                <button onClick={paymentModal.onConfirm || (() => setPaymentModal(prev => ({...prev, show: false})))} className="flex-1 bg-black text-white px-4 py-3 rounded-2xl text-xs font-bold uppercase hover:bg-sportRed">Confirmar</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE DETALLE DE USUARIO */}
      {isDetailModalOpen && selectedUser && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md" onClick={() => setIsDetailModalOpen(false)}>
            <div className="bg-white w-full max-w-lg rounded-sm overflow-hidden shadow-2xl border-t-8 border-sportRed relative" onClick={(e) => e.stopPropagation()}>
                <button onClick={() => setIsDetailModalOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-black">✕</button>
                <div className="p-8 bg-gray-50 border-b flex items-center gap-6">
                    <div className="w-20 h-20 bg-gray-900 text-white flex items-center justify-center text-3xl font-black italic rounded-full">
                        {selectedUser.nombre?.[0] || '?'}{selectedUser.apellido?.[0] || ''}
                    </div>
                    <div>
                        <h2 className="text-2xl font-black uppercase italic leading-none">{selectedUser.nombre || 'Sin'} <span className="text-sportRed">{selectedUser.apellido || 'Nombre'}</span></h2>
                        <p className="text-gray-500 font-bold text-xs uppercase mt-1">{selectedUser.email}</p>
                    </div>
                </div>
                <div className="p-8 grid grid-cols-2 gap-8">
                    <div className="space-y-1">
                        <p className="text-[10px] font-black text-gray-400 uppercase">Estado del Plan</p>
                        <p className="font-bold text-gray-900 uppercase italic">{selectedUser.subscription_tier === 'pro' ? 'Elite Pro' : 'Estándar Free'}</p>
                    </div>
                    <div className="space-y-1 text-right">
                        <p className="text-[10px] font-black text-gray-400 uppercase">Miembro Desde</p>
                        <p className="font-bold text-gray-700">{new Date(selectedUser.created_at).toLocaleDateString()}</p>
                    </div>
                    {selectedUser.subscription_tier === 'pro' && (
                        <div className="col-span-2 bg-gray-900 p-4 flex justify-between items-center rounded-sm">
                            <span className="text-white font-bold italic uppercase text-xs">Días restantes:</span>
                            <span className="bg-sportRed text-white px-3 py-1 font-black text-lg">
                                {Math.max(0, Math.ceil((new Date(selectedUser.subscription_end_date) - new Date()) / (1000 * 60 * 60 * 24)))}
                            </span>
                        </div>
                    )}
                </div>
                <div className="p-6 bg-gray-50 border-t">
                    <button 
                        onClick={() => { setIsDetailModalOpen(false); toggleSubscription(selectedUser); }}
                        className="w-full bg-black text-white py-3 font-bold uppercase text-xs hover:bg-sportRed"
                    >
                        Gestionar Suscripción
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}