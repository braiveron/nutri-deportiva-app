import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function WeightTracker({ userId }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true); // 👈 Ahora sí lo usaremos
  const [newWeight, setNewWeight] = useState("");
  
  const today = new Date().toISOString().split('T')[0];
  const [date, setDate] = useState(today);

  useEffect(() => {
    if (userId) loadHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const loadHistory = async () => {
    try {
      const res = await api.getWeightHistory(userId);
      if (res.success) {
        const formattedData = res.history.map(item => ({
            ...item,
            displayDate: new Date(item.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }),
            val: Number(item.weight)
        }));
        setHistory(formattedData);
      }
    } catch (error) {
      console.error(error);
    } finally {
      // Pequeño delay para que la transición sea suave
      setTimeout(() => setLoading(false), 300);
    }
  };

  const handleAddWeight = async (e) => {
    e.preventDefault();
    if (!newWeight) return;

    try {
      const res = await api.addWeightLog(userId, newWeight, date);
      if (res.success) {
        setNewWeight("");
        loadHistory(); 
      } else {
        alert("Error al guardar");
      }
    } catch (error) {
        console.error(error);
    }
  };

  const minWeight = history.length > 0 ? Math.min(...history.map(d => d.val)) - 2 : 0;
  const maxWeight = history.length > 0 ? Math.max(...history.map(d => d.val)) + 2 : 100;

  // 👇 SI ESTÁ CARGANDO, MOSTRAMOS UN SKELETON
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
        
        {/* TARJETA DE RESUMEN */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Input Rápido */}
            <div className="md:col-span-1 bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Registrar Peso</h3>
                <form onSubmit={handleAddWeight} className="flex flex-col gap-3">
                    <div className="relative">
                        <input 
                            type="number" 
                            step="0.1" 
                            placeholder="0.0" 
                            className="w-full text-3xl font-bold text-sportDark placeholder-gray-200 border-b-2 border-gray-100 focus:border-sportRed focus:outline-none py-2"
                            value={newWeight}
                            onChange={(e) => setNewWeight(e.target.value)}
                        />
                        <span className="absolute right-0 bottom-3 text-gray-400 font-bold">kg</span>
                    </div>
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

            {/* Estadísticas Rápidas */}
            <div className="md:col-span-2 bg-gray-900 text-white p-6 rounded-2xl shadow-lg flex flex-col justify-center relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-sportRed/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-1">Peso Actual</h3>
                <div className="text-5xl font-display font-bold italic">
                    {history.length > 0 ? history[history.length - 1].val : '--'} <span className="text-xl not-italic text-sportRed">kg</span>
                </div>
                
                {history.length > 1 && (
                    <div className="mt-4 flex items-center gap-2 text-sm font-medium">
                        {history[history.length - 1].val > history[0].val ? (
                             <span className="text-green-400">▲ Ganancia Total: +{(history[history.length - 1].val - history[0].val).toFixed(1)} kg</span>
                        ) : (
                             <span className="text-yellow-400">▼ Pérdida Total: {(history[history.length - 1].val - history[0].val).toFixed(1)} kg</span>
                        )}
                        <span className="text-gray-500">• Desde el inicio</span>
                    </div>
                )}
            </div>
        </div>

        {/* GRÁFICA */}
        <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 h-[400px]">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-6">Tendencia</h3>
            
            {history.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={history} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                        <XAxis 
                            dataKey="displayDate" 
                            stroke="#9ca3af" 
                            tick={{fontSize: 12}} 
                            tickLine={false}
                            axisLine={false}
                            dy={10}
                        />
                        <YAxis 
                            domain={[minWeight, maxWeight]} 
                            stroke="#9ca3af" 
                            tick={{fontSize: 12}} 
                            tickLine={false} 
                            axisLine={false}
                            unit=" kg"
                        />
                        <Tooltip 
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                            itemStyle={{ color: '#dc2626', fontWeight: 'bold' }}
                        />
                        <Line 
                            type="monotone" 
                            dataKey="val" 
                            stroke="#dc2626" 
                            strokeWidth={3} 
                            dot={{ r: 4, fill: '#dc2626', strokeWidth: 2, stroke: '#fff' }} 
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