import { useEffect, useState } from "react";
import { supabase } from "../supabase";
import StatusModal from "./StatusModal";
import WorkoutDetailsModal from "./WorkoutDetailsModal"; // 👈 1. IMPORTAMOS EL MODAL

export default function WorkoutHistory({ userId, onDeleteSuccess }) {
  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  
  // 👇 2. ESTADO PARA CONTROLAR QUÉ RUTINA SE MUESTRA EN EL MODAL
  const [selectedPlanForModal, setSelectedPlanForModal] = useState(null);

  const [modal, setModal] = useState({ show: false, type: 'success', title: '', message: '', onConfirm: null });

  useEffect(() => {
    if (userId) fetchWorkouts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const fetchWorkouts = async () => {
    try {
      const { data, error } = await supabase
        .from('saved_workouts')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setWorkouts(data || []);
    } catch (error) {
      console.error("Error cargando historial de rutinas:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (e, id) => {
    e.stopPropagation(); 
    setModal({
        show: true, type: 'error', title: '¿Borrar Rutina?',
        message: 'Se eliminará de tu historial permanentemente.',
        onConfirm: () => confirmDelete(id)
    });
  };

  const confirmDelete = async (id) => {
    setModal({ show: true, type: 'loading', title: 'Borrando...', message: 'Eliminando rutina...', onConfirm: null });
    try {
      const { error } = await supabase.from('saved_workouts').delete().eq('id', id);
      if (error) throw error;
      
      setWorkouts(workouts.filter(w => w.id !== id));
      setModal({ show: true, type: 'success', title: '¡Eliminada!', message: 'Rutina borrada.', onConfirm: null });

      if (onDeleteSuccess) onDeleteSuccess(id);
    } catch (error) {
      setModal({ show: true, type: 'error', title: 'Error', message: error.message, onConfirm: null });
    }
  };

  const closeModal = () => setModal({ ...modal, show: false });
  const toggleExpand = (id) => setExpandedId(expandedId === id ? null : id);

  if (loading) return <div className="text-center text-gray-400 mt-10 animate-pulse">Cargando tus rutinas...</div>;
  if (workouts.length === 0) return null;

  return (
    <div className="w-full max-w-5xl mt-16 animate-fade-in pb-20 relative">
      
      {modal.show && <StatusModal {...modal} onClose={closeModal} />}

      {/* 👇 3. AQUÍ RENDERIZAMOS EL MODAL SI HAY UN PLAN SELECCIONADO */}
      {selectedPlanForModal && (
        <WorkoutDetailsModal 
            plan={selectedPlanForModal} 
            onClose={() => setSelectedPlanForModal(null)} 
        />
      )}

      {/* TÍTULO */}
      <div className="flex items-center gap-4 mb-6">
        <div className="h-px bg-gray-300 flex-1"></div>
        <h3 className="text-2xl font-display font-bold text-gray-400 uppercase tracking-widest">
            Biblioteca de Rutinas
        </h3>
        <div className="h-px bg-gray-300 flex-1"></div>
      </div>

      <div className="grid gap-4">
        {workouts.map((item) => {
            const plan = item.plan_data;
            const isOpen = expandedId === item.id;

            return (
                <div key={item.id} className="bg-white border-l-4 border-black shadow-md overflow-hidden transition-all duration-300 group">
                    {/* CABECERA DE LA TARJETA */}
                    <div onClick={() => toggleExpand(item.id)} className="w-full flex justify-between items-center p-4 hover:bg-gray-50 cursor-pointer">
                        <div>
                            <h4 className="font-bold text-sportDark uppercase text-lg">{plan.nombre_rutina}</h4>
                            <div className="flex gap-2 mt-1">
                                <span className="text-[10px] bg-gray-200 px-2 py-0.5 rounded font-bold uppercase text-gray-600">
                                    {new Date(item.created_at).toLocaleDateString()}
                                </span>
                                <span className="text-[10px] bg-red-100 px-2 py-0.5 rounded font-bold uppercase text-sportRed">
                                    {plan.frecuencia}
                                </span>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <button 
                                onClick={(e) => handleDeleteClick(e, item.id)}
                                className="p-2 text-gray-300 hover:text-red-600 hover:bg-red-50 rounded-full transition-all"
                                title="Borrar Rutina"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                                </svg>
                            </button>
                            <span className={`text-sportRed text-2xl transform transition-transform ${isOpen ? 'rotate-180' : ''}`}>▼</span>
                        </div>
                    </div>

                    {/* DETALLE EXPANDIDO (RESUMEN + BOTÓN DE ABRIR) */}
                    {isOpen && (
                        <div className="p-4 bg-gray-50 border-t border-gray-200 animate-fade-in">
                            {/* Grilla de resumen (lo que ya tenías) */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 mb-4">
                                {plan.dias.map((dia, i) => (
                                    <div key={i} className="bg-white p-2 border border-gray-200 rounded text-xs shadow-sm">
                                        <strong className="block text-sportRed mb-1">{dia.dia}</strong>
                                        <p className="text-gray-500">{dia.ejercicios.length} ejercicios</p>
                                    </div>
                                ))}
                            </div>
                            
                            {/* TIP */}
                            <div className="text-center mb-4">
                                <p className="text-xs text-gray-500 italic">"{plan.tip_extra}"</p>
                            </div>

                            {/* 👇 4. BOTÓN NUEVO: ABRIR DETALLE */}
                            <div className="flex justify-center">
                                <button 
                                    onClick={() => setSelectedPlanForModal(plan)}
                                    className="bg-sportDark text-white px-6 py-2 rounded-full font-bold uppercase text-xs tracking-widest hover:bg-black transition-transform hover:scale-105 shadow-lg flex items-center gap-2"
                                >
                                    <span>👁️ Ver Rutina Completa</span>
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            );
        })}
      </div>
    </div>
  );
}