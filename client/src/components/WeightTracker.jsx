import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function WeightTracker({ userId, onWeightAdded }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(null);
  
  // Estados para el formulario
  const [newWeight, setNewWeight] = useState("");
  const [waist, setWaist] = useState("");
  const [neck, setNeck] = useState("");
  const [hip, setHip] = useState("");
  const [activeMetric, setActiveMetric] = useState('weight'); // 'weight', 'fat_percentage', 'waist'
  
  const today = new Date().toISOString().split('T')[0];
  const [date, setDate] = useState(today);

  // 1. CARGAR PERFIL (Para automatizar Género y Altura)
  useEffect(() => {
    const loadProfile = async () => {
      if (!userId) return;
      try {
        const res = await api.getBiometrics(userId);
        if (res.existe) {
          setUserProfile(res.datos);
        }
      } catch (error) {
        console.error("Error al cargar perfil:", error);
      }
    };
    loadProfile();
  }, [userId]);

  // 2. CARGAR HISTORIAL
  const loadHistory = useCallback(async () => {
    if (!userId) return;
    try {
      const res = await api.getWeightHistory(userId);
      if (res.success) {
        const lastWeightsByDay = new Map();

        res.history.forEach(item => {
          lastWeightsByDay.set(item.date, item);
        });

        const uniqueDaysData = Array.from(lastWeightsByDay.values())
          .sort((a, b) => new Date(a.date) - new Date(b.date))
          .map(item => ({
            ...item,
            displayDate: new Date(item.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }),
            weightVal: Number(item.weight) || 0,
            fatVal: Number(item.fat_percentage) || 0,
            waistVal: Number(item.waist) || 0
          }));

        setHistory(uniqueDaysData);
      }
    } catch (error) {
      console.error("Error al cargar el historial:", error);
    } finally {
      setTimeout(() => setLoading(false), 300);
    }
  }, [userId]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  // 3. LÓGICA DE CÁLCULO AUTOMATIZADA
  const calculateBodyFat = (waist, neck, hip) => {
    const w = parseFloat(waist);
    const n = parseFloat(neck);
    const h = parseFloat(hip);
    
    // Usamos datos del perfil o valores por defecto seguros
    const gender = userProfile?.gender || 'masculino';
    const height = userProfile?.height_cm || 175;
    
    if (!w || !n) return null;

    let fat;
    if (gender === 'masculino') {
      fat = 495 / (1.0324 - 0.19077 * Math.log10(w - n) + 0.15456 * Math.log10(height)) - 450;
    } else {
      if (!h) return null;
      fat = 495 / (1.29579 - 0.35004 * Math.log10(w + h - n) + 0.22100 * Math.log10(height)) - 450;
    }

    return fat.toFixed(1);
  };

 const handleSave = async (e) => {
  e.preventDefault();
  
  // Determinamos si estamos en una pestaña de biometría (Medidas o Grasa)
  const isBiometric = activeMetric === 'waist' || activeMetric === 'fat_percentage';
  
  // Si es biometría, el peso es opcional (usa el último) o el del input si el usuario escribió algo
  // Si es la pestaña de peso, el peso es obligatorio
  const weightToSave = newWeight || (history.length > 0 ? history[history.length - 1].weightVal : "");

  if (!weightToSave) {
    alert("Por favor, ingresa un peso inicial.");
    return;
  }

  let payload = { 
    weight: weightToSave, 
    date 
  };

  if (isBiometric) {
    const fat = calculateBodyFat(waist, neck, hip);
    payload = { 
      ...payload, 
      waist, 
      neck, 
      hip, 
      fat_percentage: fat
    };
  }

  try {
    const res = await api.addWeightLog(userId, payload.weight, payload.date, payload);
    if (res.success) {
      setNewWeight("");
      setWaist("");
      setNeck("");
      setHip("");
      loadHistory();
      if (onWeightAdded) onWeightAdded();
    } else {
      alert("Error al guardar: " + (res.error || "Servidor no responde"));
    }
  } catch (error) {
      console.error(error);
      alert("Error de conexión al guardar");
  }
};

  const metricConfig = {
    weight: { key: 'weightVal', label: 'Peso', unit: ' kg', color: '#dc2626' },
    fat_percentage: { key: 'fatVal', label: 'Grasa', unit: ' %', color: '#3b82f6' },
    waist: { key: 'waistVal', label: 'Medidas', unit: ' cm', color: '#10b981' }
  };

  const currentMetric = metricConfig[activeMetric];
  const chartValues = history.map(d => d[currentMetric.key]).filter(v => v > 0);
  const minVal = chartValues.length > 0 ? Math.min(...chartValues) * 0.95 : 0;
  const maxVal = chartValues.length > 0 ? Math.max(...chartValues) * 1.05 : 100;

  if (loading) {
      return (
          <div className="w-full animate-pulse space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-1 h-48 bg-gray-200 rounded-2xl"></div>
                  <div className="md:col-span-2 h-48 bg-gray-200 rounded-2xl"></div>
              </div>
              <div className="h-[400px] bg-gray-200 rounded-2xl"></div>
          </div>
      );
  }

  return (
    <div className="w-full animate-fade-in space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-1 bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">
                    {activeMetric === 'weight' ? 'Registrar Peso' : 
      activeMetric === 'waist' ? 'Registrar Medidas' : 
      'Registrar Grasa %'}
                </h3>
                <form onSubmit={handleSave} className="flex flex-col gap-3">
                    {(activeMetric === 'waist' || activeMetric === 'fat_percentage') ? (
                        <div className="space-y-3">
                            <input type="number" step="0.1" placeholder="Cintura (cm)" className="w-full p-2 border-b-2 border-gray-100 focus:border-green-500 outline-none font-bold" value={waist} onChange={(e)=>setWaist(e.target.value)} required />
                            <input type="number" step="0.1" placeholder="Cuello (cm)" className="w-full p-2 border-b-2 border-gray-100 focus:border-green-500 outline-none font-bold" value={neck} onChange={(e)=>setNeck(e.target.value)} required />
                            {/* Mostrar cadera solo si el perfil indica que es femenino */}
                            {userProfile?.gender === 'femenino' && (
                              <input type="number" step="0.1" placeholder="Cadera (cm)" className="w-full p-2 border-b-2 border-gray-100 focus:border-green-500 outline-none font-bold" value={hip} onChange={(e)=>setHip(e.target.value)} required />
                            )}
                        </div>
                    ) : (
                        <div className="relative">
                            <input 
                                type="number" 
                                step="0.1" 
                                placeholder="0.0" 
                                className="w-full text-3xl font-bold text-sportDark placeholder-gray-200 border-b-2 border-gray-100 focus:border-sportRed focus:outline-none py-2"
                                value={newWeight}
                                onChange={(e) => setNewWeight(e.target.value)}
                                required={activeMetric === 'weight'}
                            />
                            <span className="absolute right-0 bottom-3 text-gray-400 font-bold">kg</span>
                        </div>
                    )}
                    
                    <input 
                        type="date" 
                        className="text-xs text-gray-400 bg-gray-50 p-2 rounded border border-gray-100"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                    />
                    <button type="submit" className="bg-black text-white py-3 rounded-xl font-bold uppercase text-xs tracking-widest hover:bg-sportRed transition-colors mt-2">
                        Guardar
                    </button>
                </form>
            </div>

            <div className="md:col-span-2 bg-gray-900 text-white p-6 rounded-2xl shadow-lg flex flex-col justify-center relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-sportRed/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-1">Estado Actual</h3>
                <div className="flex gap-8 items-end">
                    <div>
                        <p className="text-[10px] text-gray-500 uppercase font-bold">Peso</p>
                        <div className="text-4xl font-display font-bold italic">
                            {history.length > 0 ? history[history.length - 1].weightVal : '--'} <span className="text-lg not-italic text-sportRed">kg</span>
                        </div>
                    </div>
                    <div>
                        <p className="text-[10px] text-gray-500 uppercase font-bold">Grasa</p>
                        <div className="text-4xl font-display font-bold italic text-blue-400">
                            {history.length > 0 && history[history.length - 1].fatVal > 0 ? history[history.length - 1].fatVal : '--'} <span className="text-lg not-italic">%</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 h-[450px]">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Tendencia de Progreso</h3>
                <div className="flex bg-gray-100 p-1 rounded-lg">
                    {Object.keys(metricConfig).map((m) => (
                        <button
                            key={m}
                            onClick={() => setActiveMetric(m)}
                            className={`px-3 py-1.5 rounded-md text-[10px] font-bold uppercase transition-all ${
                                activeMetric === m ? 'bg-white text-black shadow-sm' : 'text-gray-400 hover:text-gray-600'
                            }`}
                        >
                            {metricConfig[m].label}
                        </button>
                    ))}
                </div>
            </div>

            {history.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={history} margin={{ top: 5, right: 20, bottom: 60, left: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                        <XAxis dataKey="displayDate" stroke="#9ca3af" tick={{fontSize: 12}} tickLine={false} axisLine={false} dy={10} />
                        <YAxis domain={[minVal, maxVal]} stroke="#9ca3af" tick={{fontSize: 12}} tickLine={false} axisLine={false} unit={currentMetric.unit} />
                        <Tooltip 
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                            itemStyle={{ color: currentMetric.color, fontWeight: 'bold' }}
                        />
                        <Line 
                            type="monotone" 
                            dataKey={currentMetric.key} 
                            stroke={currentMetric.color} 
                            strokeWidth={3} 
                            dot={{ r: 4, fill: currentMetric.color, strokeWidth: 2, stroke: '#fff' }} 
                            activeDot={{ r: 6 }} 
                        />
                    </LineChart>
                </ResponsiveContainer>
            ) : (
                <div className="h-full flex flex-col items-center justify-center text-gray-300">
                    <span className="text-4xl mb-2">📉</span>
                    <p className="text-sm font-bold uppercase">Sin datos suficientes</p>
                </div>
            )}
        </div>
    </div>
  );
}