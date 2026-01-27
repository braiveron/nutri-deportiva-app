import { useState, useEffect } from 'react';
import { api } from '../services/api';

export default function MacroTracker({ userId, userMacros }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Estados para la IA
  const [foodInput, setFoodInput] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [previewData, setPreviewData] = useState(null); 

  // Estado para el Modal de Confirmación (guarda el ID a borrar)
  const [logToDelete, setLogToDelete] = useState(null);

  const loadLogs = async () => {
    try {
        const data = await api.getDailyLogs(userId);
        if (data.success) setLogs(data.logs);
    } catch (error) {
        console.error("Error cargando logs:", error);
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) loadLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, userMacros]);

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
        alert("Error al analizar.");
    } finally {
        setAnalyzing(false);
    }
  };

  const handleConfirmAdd = async () => {
    if (!previewData) return;
    const newLog = {
        userId,
        meal_name: previewData.meal_name,
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
        }
    } catch  {
        alert("Error de conexión");
    }
  };

  // 👇 EJECUTA EL BORRADO REAL (Al confirmar en el modal)
  const executeDelete = async () => {
      if (!logToDelete) return;
      
      const id = logToDelete;
      setLogToDelete(null); // Cerramos el modal inmediatamente

      try {
          // 1. Borrar visualmente (Optimistic UI)
          const previousLogs = [...logs];
          setLogs(logs.filter(log => log.id !== id));

          // 2. Borrar en el servidor
          const res = await api.deleteDailyLog(id);
          
          if (!res.success) {
              // Si falla, revertimos
              setLogs(previousLogs);
              alert("No se pudo borrar, intenta de nuevo.");
          }
      } catch (error) {
          console.error(error);
      }
  };

  // CÁLCULOS
  const consumed = logs.reduce((acc, log) => ({
    protein: acc.protein + (log.protein || 0),
    carbs: acc.carbs + (log.carbs || 0),
    fats: acc.fats + (log.fats || 0),
    calories: acc.calories + (log.calories || 0)
  }), { protein: 0, carbs: 0, fats: 0, calories: 0 });

  if (loading) return <div className="animate-pulse h-32 bg-gray-100 rounded-xl"></div>;

  return (
    <div className="w-full max-w-4xl mx-auto mb-10 animate-fade-in relative">
      
      {/* --- DASHBOARD --- */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-6">
        <h3 className="text-xl font-display font-bold text-sportDark mb-6 flex items-center gap-2">
            📊 Tu Progreso Diario
        </h3>

        {!userMacros ? (
             <div className="p-4 bg-yellow-50 text-yellow-700 rounded-lg">⚠️ Sin plan activo.</div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <MacroCard label="Proteína" current={consumed.protein} target={userMacros.protein} color="bg-sportRed" unit="g" />
                <MacroCard label="Carbos" current={consumed.carbs} target={userMacros.carbs} color="bg-yellow-500" unit="g" />
                <MacroCard label="Grasas" current={consumed.fats} target={userMacros.fats} color="bg-blue-500" unit="g" />
            </div>
        )}
        
        <div className="mt-6 text-center text-sm text-gray-500 font-medium">
            Calorías: <span className="text-sportDark font-bold text-lg">{Math.round(consumed.calories)}</span> / {userMacros?.calories || '?'} kcal
        </div>
      </div>

      {/* --- INPUT --- */}
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

      {/* --- LISTA --- */}
      {logs.length > 0 && (
          <div className="mt-8">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Historial de Hoy</h4>
              <div className="space-y-3">
                  {logs.slice().reverse().map(log => (
                      <div key={log.id} className="flex justify-between items-center bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow group">
                          <div>
                            <span className="font-medium text-gray-700 capitalize block">{log.meal_name}</span>
                            <div className="flex gap-3 text-xs font-medium text-gray-500 mt-1">
                                <span className="bg-gray-100 px-2 py-0.5 rounded text-gray-600">{Math.round(log.calories)} kcal</span>
                                <span className="text-sportRed">P: {log.protein}</span>
                                <span className="text-yellow-600">C: {log.carbs}</span>
                                <span className="text-blue-500">G: {log.fats}</span>
                            </div>
                          </div>
                          <button 
                            onClick={() => setLogToDelete(log.id)} // 👇 Abre el Modal
                            className="text-gray-300 hover:text-red-500 p-2 rounded-full hover:bg-red-50 transition-all"
                          >
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                              </svg>
                          </button>
                      </div>
                  ))}
              </div>
          </div>
      )}

      {/* --- MODAL DE CONFIRMACIÓN (NUEVO) --- */}
      {logToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm border border-gray-100 transform transition-all scale-100">
                <div className="flex flex-col items-center text-center">
                    <div className="bg-red-50 p-3 rounded-full mb-4 text-red-500">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                        </svg>
                    </div>
                    
                    <h3 className="text-xl font-display font-bold text-gray-800 mb-2">¿Borrar comida?</h3>
                    <p className="text-gray-500 text-sm mb-6">
                        Esta acción restará los macros de tu progreso diario. No se puede deshacer.
                    </p>

                    <div className="flex gap-3 w-full">
                        <button 
                            onClick={() => setLogToDelete(null)}
                            className="flex-1 py-3 text-sm font-bold text-gray-500 hover:bg-gray-50 rounded-xl transition-colors"
                        >
                            Cancelar
                        </button>
                        <button 
                            onClick={executeDelete}
                            className="flex-1 py-3 text-sm font-bold bg-sportRed text-white rounded-xl hover:bg-red-700 shadow-lg shadow-red-500/30 transition-all"
                        >
                            Sí, borrar
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}

    </div>
  );
}

function MacroCard({ label, current, target, color, unit }) {
    const safeTarget = target || 1;
    const percent = Math.min((current / safeTarget) * 100, 100);
    const remaining = Math.max(safeTarget - current, 0).toFixed(1); 

    return (
        <div className="flex flex-col">
            <div className="flex justify-between mb-2">
                <span className="text-sm font-bold text-gray-600">{label}</span>
                <span className="text-xs font-bold text-gray-400">{remaining} {unit} restantes</span>
            </div>
            <div className="h-4 w-full bg-gray-100 rounded-full overflow-hidden shadow-inner">
                <div className={`h-full ${color} transition-all duration-1000 ease-out`} style={{ width: `${percent}%` }}></div>
            </div>
            <div className="flex justify-between mt-1 text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                <span>{current} {unit}</span>
                <span>{safeTarget} {unit}</span>
            </div>
        </div>
    );
}