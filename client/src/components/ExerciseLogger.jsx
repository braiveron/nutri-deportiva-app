import React, { useState } from 'react';
import { api } from '../services/api';

export default function ExerciseLogger({ userId, exerciseName }) {
  const [weight, setWeight] = useState('');
  const [reps, setReps] = useState('');
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [loading, setLoading] = useState(false);

  // Cargar historial al abrir el desplegable
  const toggleHistory = async () => {
    if (!showHistory) {
        setLoading(true);
        const res = await api.getExerciseHistory(userId, exerciseName);
        if (res.success) setHistory(res.history);
        setLoading(false);
    }
    setShowHistory(!showHistory);
  };

  const handleSave = async () => {
    if (!weight || !reps) return;
    
    // Optimistic Update (Actualizamos la UI antes de recibir respuesta para que se sienta rápido)
    const newLog = {
        weight_kg: weight,
        reps: reps,
        created_at: new Date().toISOString() // Fecha simulada
    };
    
    setHistory(prev => [newLog, ...prev]); // Lo ponemos primero en la lista
    setWeight('');
    setReps('');

    // Guardamos en Backend
    await api.saveExerciseLog({
        userId,
        exercise_name: exerciseName,
        weight,
        reps
    });
  };

  return (
    <div className="mt-3 bg-gray-50 p-3 rounded-lg border border-gray-200 shadow-sm">
      <h4 className="text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">Registrar Progreso</h4>
      
      {/* Inputs y Botón */}
      <div className="flex gap-2 items-end">
        <div className="flex-1">
            <label className="text-[10px] text-gray-400 block mb-1">PESO (KG)</label>
            <input 
                type="number" 
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                className="w-full bg-white border border-gray-300 rounded p-1.5 text-sm focus:outline-none focus:border-sportRed text-center font-bold text-gray-700"
                placeholder="0"
            />
        </div>
        <div className="flex-1">
            <label className="text-[10px] text-gray-400 block mb-1">REPS</label>
            <input 
                type="number" 
                value={reps}
                onChange={(e) => setReps(e.target.value)}
                className="w-full bg-white border border-gray-300 rounded p-1.5 text-sm focus:outline-none focus:border-sportRed text-center font-bold text-gray-700"
                placeholder="0"
            />
        </div>
        <button 
            onClick={handleSave}
            disabled={!weight || !reps}
            className="bg-sportDark text-white p-2 rounded hover:bg-black transition-colors disabled:opacity-50 h-[34px] w-[34px] flex items-center justify-center"
        >
            💾
        </button>
      </div>

      {/* Botón Ver Historial */}
      <button 
        onClick={toggleHistory}
        className="text-[11px] text-sportRed font-semibold mt-3 flex items-center gap-1 hover:underline"
      >
        {showHistory ? "Ocultar historial" : "Ver historial previo"} 
        {loading && <span className="animate-spin ml-1">⏳</span>}
      </button>

      {/* Lista de Historial */}
      {showHistory && (
        <div className="mt-2 space-y-1 animate-fade-in-down">
            {history.length === 0 && !loading ? (
                <p className="text-[10px] text-gray-400 italic">No hay registros aún.</p>
            ) : (
                history.map((log, idx) => (
                    <div key={idx} className="flex justify-between items-center text-xs bg-white p-2 rounded border border-gray-100">
                        <span className="text-gray-400">{new Date(log.created_at).toLocaleDateString()}</span>
                        <span className="font-bold text-gray-700">{log.weight_kg}kg <span className="text-gray-400 font-normal">x</span> {log.reps} reps</span>
                    </div>
                ))
            )}
        </div>
      )}
    </div>
  );
}