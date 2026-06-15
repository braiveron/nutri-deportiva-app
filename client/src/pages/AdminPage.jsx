import { useState, useEffect, useCallback } from "react";
import { api } from "../services/api";
import { supabase } from "../supabase";

export default function AdminPage({ userRole }) {
  const [activeTab, setActiveTab] = useState('tickets');
  const [tickets, setTickets] = useState([]);
  const [users, setUsers] = useState([]);
  const [coupons, setCoupons] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [updatingUser, setUpdatingUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isCouponModalOpen, setIsCouponModalOpen] = useState(false); 
  const [newCoupon, setNewCoupon] = useState({ code: '', discount_percent: 0, free_days: 0, expiration_days: 30, usage_limit: 10 });
  const [paymentModal, setPaymentModal] = useState({
    show: false,
    type: 'confirm',
    title: '',
    message: '',
    onConfirm: null
  });
  const [statusModal, setStatusModal] = useState({
    show: false,
    title: '',
    message: '',
    type: 'success' 
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

  const fetchCoupons = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setCoupons(data || []);
    } catch (error) {
      console.error("Error cargando cupones:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleCreateCoupon = async () => {
    try {
      const expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() + parseInt(newCoupon.expiration_days));

      const { error } = await supabase
        .from('coupons')
        .insert([{ 
          code: newCoupon.code.toUpperCase(), 
          type: parseInt(newCoupon.discount_percent) > 0 ? 'mixed' : 'free_days', 
          value: parseInt(newCoupon.free_days),
          discount_percent: parseInt(newCoupon.discount_percent),
          usage_limit: parseInt(newCoupon.usage_limit) || 10, 
          usage_count: 0,
          expires_at: expirationDate.toISOString() 
        }]);

      if (error) throw error;
      
      setIsCouponModalOpen(false);
      setNewCoupon({ code: '', discount_percent: 0, free_days: 0, expiration_days: 30, usage_limit: 10 });
      fetchCoupons();

      setStatusModal({
        show: true,
        title: '¡Logrado!',
        message: 'El cupón se ha creado correctamente.',
        type: 'success'
      });

    } catch (error) {
      setStatusModal({
        show: true,
        title: 'Error',
        message: error.message,
        type: 'error'
      });
    }
  };

  const toggleCouponStatus = async (id, currentStatus) => {
    try {
      const { error } = await supabase
        .from('coupons')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (error) throw error;
      
      await fetchCoupons(); 
      
      setStatusModal({
        show: true,
        title: 'Actualizado',
        message: `Cupón ${!currentStatus ? 'activado' : 'desactivado'} con éxito.`,
        type: 'success'
      });
    } catch (error) {
      setStatusModal({ 
        show: true, 
        title: 'Error', 
        message: error.message, 
        type: 'error' 
      });
    }
  };

  const deleteCoupon = async (id) => {
    try {
      const { error } = await supabase
        .from('coupons')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await fetchCoupons();
      setStatusModal({
        show: true,
        title: 'Eliminado',
        message: 'El cupón ha sido borrado permanentemente.',
        type: 'success'
      });
    } catch (error) {
      setStatusModal({ show: true, title: 'Error', message: error.message, type: 'error' });
    }
  };

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
      
      if (selectedUser?.id === userId) {
          setSelectedUser(prev => ({ ...prev, subscription_tier: newTier, subscription_end_date: newDate }));
      }
      
    } catch (err) {
      setPaymentModal({
        show: true,
        type: 'error',
        title: 'Error al actualizar',
        message: err.message || 'No se pudo cambiar la suscripción.',
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
        if (activeTab === 'coupons') fetchCoupons();
    }
  }, [userRole, activeTab, fetchTickets, fetchUsers, fetchCoupons]);

  if (userRole !== 'admin') {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4 text-black">
            <span className="text-6xl mb-4">⛔</span>
            <h1 className="text-2xl font-bold text-gray-800 uppercase tracking-widest">Acceso Denegado</h1>
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8 animate-fade-in pt-24 font-sans text-black">
      <div className="max-w-6xl mx-auto">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div>
                <h1 className="text-3xl font-black uppercase italic text-gray-900 tracking-tighter">
                    PANEL DE <span className="text-sportRed">CONTROL</span>
                </h1>
                <p className="text-gray-500 text-sm font-medium">Gestión de usuarios y cupones.</p>
            </div>
            
            <div className="flex bg-white p-1 rounded-xl shadow-sm border border-gray-200">
                <button 
                    onClick={() => setActiveTab('users')}
                    className={`px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all ${activeTab === 'users' ? 'bg-sportRed text-white shadow-md' : 'text-gray-400 hover:text-gray-600'}`}
                >
                    👥 Usuarios
                </button>
                <button 
                    onClick={() => setActiveTab('coupons')}
                    className={`px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all ${activeTab === 'coupons' ? 'bg-sportRed text-white shadow-md' : 'text-gray-400 hover:text-gray-600'}`}
                >
                    🏷️ Cupones
                </button>
                <button 
                    onClick={() => setActiveTab('tickets')}
                    className={`px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all ${activeTab === 'tickets' ? 'bg-sportRed text-white shadow-md' : 'text-gray-400 hover:text-gray-600'}`}
                >
                    🎟️ Tickets
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
                            {/* CORRECCIÓN 1: Convertido el emoji en Label y conectado al Input */}
                            <label htmlFor="user-search" className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 cursor-text">🔍</label>
                            <input 
                                id="user-search"
                                name="user-search"
                                type="text"
                                placeholder="BUSCAR POR NOMBRE O EMAIL..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-white border border-gray-200 rounded-2xl py-4 pl-12 pr-4 text-xs font-bold uppercase tracking-widest focus:outline-none focus:border-sportRed focus:ring-1 focus:ring-sportRed shadow-sm transition-all"
                            />
                        </div>

                        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-x-auto">
                            <table className="w-full text-left border-collapse min-w-[600px]">
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

                {activeTab === 'coupons' && (
                  <div className="animate-fade-in">
                    <div className="flex justify-between mb-6">
                      <h2 className="text-xl font-black uppercase italic">Gestión de Descuentos</h2>
                      <button 
                        onClick={() => setIsCouponModalOpen(true)}
                        className="bg-black text-white px-4 py-2 rounded-lg text-[10px] font-bold uppercase hover:bg-sportRed transition-colors shadow-lg"
                      >
                        + Crear Cupón
                      </button>
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-x-auto">
                      <table className="w-full text-left min-w-[500px]">
                        <thead className="bg-gray-50 border-b border-gray-200">
                          <tr>
                            <th className="p-4 text-[10px] font-bold text-gray-400 uppercase">Código</th>
                            <th className="p-4 text-[10px] font-bold text-gray-400 uppercase text-center">Free</th>
                            <th className="p-4 text-[10px] font-bold text-gray-400 uppercase text-center">Descuento (%)</th>
                            <th className="p-4 text-[10px] font-bold text-gray-400 uppercase text-center">Usos</th>
                            <th className="p-4 text-[10px] font-bold text-gray-400 uppercase text-center">Vence</th>
                            <th className="p-4 text-[10px] font-bold text-gray-400 uppercase text-right">Acciones</th>
                          </tr>
                        </thead>
                        <tbody>
                          {coupons.length === 0 ? (
                            <tr><td colSpan="6" className="p-12 text-center text-gray-400 italic">No hay cupones creados.</td></tr>
                          ) : (
                            coupons.map(coupon => (
                            <tr key={coupon.id} className="border-b border-gray-50">
                             <td className="p-4 font-black text-gray-900">{coupon.code}</td>
                             <td className="p-4 text-center font-bold text-sportRed">{coupon.value} días</td> 
                             <td className="p-4 text-center font-bold text-gray-600">{coupon.discount_percent || 0}%</td>
                             <td className="p-4 text-center">
                              <div className="flex flex-col items-center">
                                <span className="text-xs font-black text-gray-900">
                                  {coupon.usage_count || 0} / {coupon.usage_limit || '∞'}
                                </span>
                                <div className="w-16 h-1 bg-gray-100 rounded-full mt-1 overflow-hidden">
                                  <div 
                                    className="h-full bg-sportRed" 
                                    style={{ width: `${Math.min(((coupon.usage_count || 0) / (coupon.usage_limit || 1)) * 100, 100)}%` }}
                                  />
                                </div>
                              </div>
                            </td>
                             <td className="p-4 text-center text-xs text-gray-500">
                               {coupon.expires_at ? new Date(coupon.expires_at).toLocaleDateString() : 'Sin límite'}
                             </td>
                             <td className="p-4 text-right">
                               <div className="flex justify-end gap-2">
                                 <button 
                                    onClick={() => toggleCouponStatus(coupon.id, coupon.is_active)}
                                    className={`px-3 py-1 rounded text-[9px] font-black uppercase transition-all shadow-sm ${
                                        coupon.is_active 
                                        ? 'bg-green-100 text-green-600 hover:bg-red-50 hover:text-red-600' 
                                        : 'bg-gray-100 text-gray-400 hover:bg-green-50 hover:text-green-600'
                                    }`}
                                 >
                                    {coupon.is_active ? 'Activo' : 'Pausado'}
                                 </button>
                                 <button 
                                    onClick={() => {
                                        setPaymentModal({
                                            show: true,
                                            type: 'confirm',
                                            title: 'Eliminar Cupón',
                                            message: `¿Estás seguro de que quieres eliminar el cupón ${coupon.code}?`,
                                            onConfirm: () => {
                                                setPaymentModal(prev => ({...prev, show: false}));
                                                deleteCoupon(coupon.id);
                                            }
                                        });
                                    }}
                                    className="p-1.5 rounded bg-red-50 text-red-600 hover:bg-red-600 hover:text-white transition-all shadow-sm"
                                    title="Eliminar"
                                 >
                                    🗑️
                                 </button>
                               </div>
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
      
      {/* MODAL CREAR CUPÓN */}
      {isCouponModalOpen && (
        <div className="fixed inset-0 z-[1001] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-sm w-full p-8 shadow-2xl border-t-8 border-black">
            <h2 className="text-2xl font-black uppercase italic mb-6 text-gray-900">Nuevo Cupón</h2>
            <div className="space-y-4">
              <div className="space-y-4">
                
                {/* CORRECCIÓN 2a: Enlazado Label + Input para Código */}
                <div>
                  <label htmlFor="coupon-code" className="text-[10px] font-black text-gray-400 uppercase mb-1 block">Código</label>
                  <input 
                    id="coupon-code"
                    name="coupon-code"
                    type="text" 
                    className="w-full border rounded-xl p-3 font-bold uppercase text-sm focus:border-sportRed outline-none"
                    value={newCoupon.code}
                    onChange={e => setNewCoupon({...newCoupon, code: e.target.value})}
                    placeholder="EJ: PROMO2026"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  
                  {/* CORRECCIÓN 2b: Enlazado Label + Input para % Descuento */}
                  <div>
                    <label htmlFor="coupon-discount" className="text-[10px] font-black text-gray-400 uppercase mb-1 block">% Desc.</label>
                    <input 
                      id="coupon-discount"
                      name="coupon-discount"
                      type="number" 
                      className="w-full border rounded-xl p-3 font-bold text-sm outline-none"
                      value={newCoupon.discount_percent}
                      onChange={e => setNewCoupon({...newCoupon, discount_percent: e.target.value})}
                    />
                  </div>

                  {/* CORRECCIÓN 2c: Enlazado Label + Input para Días Gratis */}
                  <div>
                    <label htmlFor="coupon-free-days" className="text-[10px] font-black text-gray-400 uppercase mb-1 block">Días Gratis</label>
                    <input 
                      id="coupon-free-days"
                      name="coupon-free-days"
                      type="number" 
                      className="w-full border rounded-xl p-3 font-bold text-sm outline-none"
                      value={newCoupon.free_days}
                      onChange={e => setNewCoupon({...newCoupon, free_days: e.target.value})}
                    />
                  </div>

                  {/* CORRECCIÓN 2d: Enlazado Label + Input para Expiración */}
                  <div>
                    <label htmlFor="coupon-expiration" className="text-[10px] font-black text-gray-400 uppercase mb-1 block">Validez (días)</label>
                    <input 
                      id="coupon-expiration"
                      name="coupon-expiration"
                      type="number" 
                      className="w-full border rounded-xl p-3 font-bold text-sm outline-none"
                      value={newCoupon.expiration_days}
                      onChange={e => setNewCoupon({...newCoupon, expiration_days: e.target.value})}
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="flex gap-4 mt-8">
              <button onClick={() => setIsCouponModalOpen(false)} className="flex-1 px-4 py-3 text-xs font-bold uppercase text-gray-400">Cerrar</button>
              <button onClick={handleCreateCoupon} className="flex-1 bg-black text-white px-4 py-3 rounded-2xl text-xs font-bold uppercase hover:bg-sportRed">Crear Cupón</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL STATUS */}
      {statusModal.show && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl transform transition-all scale-105">
            <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${
              statusModal.type === 'success' ? 'bg-green-100 text-green-500' : 'bg-red-100 text-red-500'
            }`}>
              {statusModal.type === 'success' ? (
                <span className="text-4xl">✓</span>
              ) : (
                <span className="text-4xl">✕</span>
              )}
            </div>
            <h3 className="text-2xl font-black text-gray-900 mb-2 uppercase italic">
              {statusModal.title}
            </h3>
            <p className="text-gray-500 font-medium mb-6">
              {statusModal.message}
            </p>
            <button
              onClick={() => setStatusModal({ ...statusModal, show: false })}
              className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest transition-all active:scale-95 ${
                statusModal.type === 'success' 
                  ? 'bg-gray-900 text-white hover:bg-black' 
                  : 'bg-sportRed text-white hover:opacity-90'
              }`}
            >
              Entendido
            </button>
          </div>
        </div>
      )}

      {/* MODAL GLOBAL */}
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
                        className="w-full bg-black text-white py-4 font-black uppercase italic tracking-widest hover:bg-sportRed transition-all"
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