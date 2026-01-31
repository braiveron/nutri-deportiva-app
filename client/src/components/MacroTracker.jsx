import { useState, useEffect } from 'react';
import { api } from '../services/api';
import StatusModal from './StatusModal'; 

export default function MacroTracker({ userId, userMacros }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Estados para la IA
  const [foodInput, setFoodInput] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [previewData, setPreviewData] = useState(null); 

  // Estado del Modal
  const [modal, setModal] = useState({ 
    show: false, 
    type: 'success', 
    title: '', 
    message: '', 
    onConfirm: null 
  });

  const loadLogs = async () => {
    try {
        const data = await api.getDailyLogs(userId);
        if (data.success) setLogs(data.logs);
    } catch (error) {
        console.error("Error cargando logs:", error);
    } finally {
        setTimeout(() => setLoading(false), 300);
    }
  };

  useEffect(() => {
    if (userId) loadLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, userMacros]);

  // --- HANDLERS ---

  const closeModal = () => {
    setModal({ ...modal, show: false });
  };

  const handleAnalyze = async (e) => {
    e.preventDefault();
    if (!foodInput.trim()) return;
    setAnalyzing(true);
    setPreviewData(null); 
    try {
        const res = await api.analyzeFood(foodInput);
        if (res.success) setPreviewData({ meal_name: foodInput, ...res.data });
    } catch (error) {
        console.error(error);
        setModal({ show: true, type: 'error', title: 'Error', message: 'No pudimos analizar la comida. Intenta de nuevo.', onConfirm: null });
    } finally {
        setAnalyzing(false);
    }
  };

  const handleConfirmAdd = async () => {
    if (!previewData) return;
    
    setModal({ show: true, type: 'loading', title: 'Guardando...', message: 'Registrando comida...', onConfirm: null });

    const newLog = {
        userId,
        meal_name: previewData.meal_name,
        // Usamos Number() para asegurar que sea numérico, pero sin perder decimales
        calories: Number(previewData.calories) || 0,
        protein: Number(previewData.protein) || 0,
        carbs: Number(previewData.carbs) || 0,
        fats: Number(previewData.fats) || 0
    };

    try {
        const res = await api.addDailyLog(newLog);
        if (res.success) {
            setLogs([...logs, res.log]); 
            setFoodInput("");           
            setPreviewData(null);       
            setModal({ ...modal, show: false });
        }
    } catch {
        setModal({ show: true, type: 'error', title: 'Error', message: 'Error de conexión al guardar.', onConfirm: null });
    }
  };

  const handleDeleteClick = (id) => {
    setModal({
        show: true,
        type: 'error', 
        title: '¿Borrar Comida?',
        message: 'Se eliminará este registro de tu total diario.',
        onConfirm: () => executeDelete(id) 
    });
  };

  const executeDelete = async (id) => {
      setModal({ show: true, type: 'loading', title: 'Borrando...', message: 'Eliminando registro...', onConfirm: null });
      
      try {
          const previousLogs = [...logs];
          setLogs(logs.filter(log => log.id !== id));

          const res = await api.deleteDailyLog(id);
          
          if (res.success) {
             setModal({ show: true, type: 'success', title: '¡Borrado!', message: 'Registro eliminado.', onConfirm: null });
          } else {
             setLogs(previousLogs);
             setModal({ show: true, type: 'error', title: 'Error', message: 'No se pudo borrar.', onConfirm: null });
          }
      } catch (error) {
          console.error(error);
          setModal({ show: true, type: 'error', title: 'Error', message: 'Error de conexión.', onConfirm: null });
      }
  };

  // CÁLCULOS
  const consumed = logs.reduce((acc, log) => ({
    protein: acc.protein + (log.protein || 0),
    carbs: acc.carbs + (log.carbs || 0),
    fats: acc.fats + (log.fats || 0),
    calories: acc.calories + (log.calories || 0)
  }), { protein: 0, carbs: 0, fats: 0, calories: 0 });

  return (
    <div className="w-full relative">
      
      {modal.show && (
        <StatusModal 
            type={modal.type}
            title={modal.title}
            message={modal.message}
            onClose={closeModal}
            onConfirm={modal.onConfirm}
        />
      )}

      {/* LAYOUT PRINCIPAL: 2 COLUMNAS */}
      <div className="flex flex-col lg:flex-row gap-8 items-start">
          
          {/* 👈 COLUMNA IZQUIERDA (40%) */}
          <div className="w-full lg:w-[40%] bg-white rounded-2xl shadow-lg border border-gray-100 p-6 sticky top-4 min-h-[500px] flex flex-col">
            
            <h3 className="text-xl font-display font-bold text-sportDark mb-6 flex items-center gap-2">
                📊 Tu Progreso
            </h3>

            {/* CONTENIDO CAMBIANTE */}
            {loading ? (
                <div className="flex-1 flex flex-col items-center justify-center opacity-50">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-sportRed mb-4"></div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest animate-pulse">Calculando...</p>
                </div>
            ) : (
                <div className="animate-fade-in space-y-8">
                    
                    {/* Contador */}
                    <div className="text-center p-4 bg-gray-50 rounded-xl border border-gray-100">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Calorías Diarias</span>
                        <div className="flex items-baseline justify-center gap-1 mt-1">
                            {/* 👇 CAMBIO 1: Eliminado Math.round() */}
                            <span className="text-4xl font-bold text-sportDark">{consumed.calories}</span>
                            <span className="text-gray-400 font-medium">/ {userMacros?.calories || '?'}</span>
                        </div>
                        <div className="text-[10px] text-gray-400 font-bold uppercase mt-1">kcal consumidas</div>
                    </div>

                    {/* Barras */}
                    <div className="flex flex-col gap-6">
                        <MacroCard label="Proteína" current={consumed.protein} target={userMacros.protein} color="bg-sportRed" unit="g" />
                        <MacroCard label="Carbohidratos" current={consumed.carbs} target={userMacros.carbs} color="bg-yellow-500" unit="g" />
                        <MacroCard label="Grasas" current={consumed.fats} target={userMacros.fats} color="bg-blue-500" unit="g" />
                    </div>
                </div>
            )}
          </div>


          {/* 👉 COLUMNA DERECHA (60%): INPUT Y LISTA */}
          <div className="w-full lg:w-[60%] flex flex-col gap-6">
            
            {/* INPUT */}
            <div className="bg-gray-50 rounded-xl p-6 border border-gray-200 shadow-inner">
                <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">¿Qué comiste hoy?</h4>
                {!previewData ? (
                    <form onSubmit={handleAnalyze} className="flex gap-2">
                        <input 
                            type="text" 
                            placeholder="Ej: 2 huevos revueltos"
                            className="flex-1 p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-sportRed focus:outline-none transition-all"
                            value={foodInput}
                            onChange={e => setFoodInput(e.target.value)}
                            disabled={analyzing}
                        />
                        <button type="submit" disabled={analyzing || !foodInput} className="bg-sportDark text-white px-6 py-3 rounded-lg font-bold uppercase hover:bg-black transition-colors disabled:opacity-50">
                            {analyzing ? '...' : 'Analizar'}
                        </button>
                    </form>
                ) : (
                    <div className="bg-white p-4 rounded-lg border border-green-100 shadow-sm animate-fade-in">
                        <div className="flex justify-between items-center mb-4">
                            <span className="font-bold text-lg text-gray-800 capitalize">{previewData.meal_name}</span>
                            <button onClick={() => setPreviewData(null)} className="text-xs text-red-400 hover:text-red-600 underline">Cancelar</button>
                        </div>
                        <div className="grid grid-cols-4 gap-2 text-center mb-4 text-sm">
                            <div className="bg-gray-50 p-2 rounded"><p className="font-bold">{previewData.calories}</p><p className="text-[10px]">Kcal</p></div>
                            <div className="bg-red-50 p-2 rounded"><p className="font-bold text-sportRed">{previewData.protein}g</p><p className="text-[10px]">Prot</p></div>
                            <div className="bg-yellow-50 p-2 rounded"><p className="font-bold text-yellow-600">{previewData.carbs}g</p><p className="text-[10px]">Carb</p></div>
                            <div className="bg-blue-50 p-2 rounded"><p className="font-bold text-blue-600">{previewData.fats}g</p><p className="text-[10px]">Gras</p></div>
                        </div>
                        <button onClick={handleConfirmAdd} className="w-full bg-green-600 text-white py-3 rounded-lg font-bold uppercase hover:bg-green-700 transition-colors">✓ Agregar</button>
                    </div>
                )}
            </div>

            {/* LISTA DE COMIDAS */}
            <div className="min-h-[200px]">
                 <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 pl-2">Historial de Hoy</h4>
                 
                 {loading ? (
                     <div className="flex justify-center py-10 opacity-50">
                         <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-400"></div>
                     </div>
                 ) : (
                     <div className="space-y-3 animate-fade-in">
                        {logs.length === 0 ? (
                            <div className="text-center py-8 text-gray-400 italic text-sm border-2 border-dashed border-gray-100 rounded-xl">
                                No hay comidas registradas hoy.
                            </div>
                        ) : (
                            logs.slice().reverse().map(log => (
                                <div key={log.id} className="flex justify-between items-center bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow group">
                                    <div>
                                        <span className="font-medium text-gray-700 capitalize block">{log.meal_name}</span>
                                        <div className="flex gap-3 text-xs font-medium text-gray-500 mt-1">
                                            {/* 👇 CAMBIO 2: Eliminado Math.round() */}
                                            <span className="bg-gray-100 px-2 py-0.5 rounded text-gray-600">{log.calories} kcal</span>
                                            <span className="text-sportRed">P: {log.protein}</span>
                                            <span className="text-yellow-600">C: {log.carbs}</span>
                                            <span className="text-blue-500">G: {log.fats}</span>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => handleDeleteClick(log.id)}
                                        className="text-gray-300 hover:text-red-500 p-2 rounded-full hover:bg-red-50 transition-all"
                                        title="Eliminar registro"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                                        </svg>
                                    </button>
                                </div>
                            ))
                        )}
                     </div>
                 )}
            </div>
          </div>
      </div>
    </div>
  );
}

function MacroCard({ label, current, target, color, unit }) {
    const safeTarget = target || 1;
    const percent = Math.min((current / safeTarget) * 100, 100);
    // Usamos toFixed(2) en el restante por si acaso la resta genera decimales infinitos, 
    // pero mantenemos el 'current' (lo consumido) exacto como viene.
    const remaining = Math.max(safeTarget - current, 0).toFixed(2); 

    return (
        <div className="flex flex-col">
            <div className="flex justify-between mb-1">
                <span className="text-sm font-bold text-gray-600">{label}</span>
                <span className="text-[10px] font-bold text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full border border-gray-100">
                    {remaining} {unit} restantes
                </span>
            </div>
            
            <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden shadow-inner mb-1">
                <div className={`h-full ${color} transition-all duration-1000 ease-out`} style={{ width: `${percent}%` }}></div>
            </div>
            
            <div className="flex justify-between text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                {/* Aquí mostramos el valor EXACTO actual */}
                <span>{current} {unit}</span>
                <span>{safeTarget} {unit}</span>
            </div>
        </div>
    );
}