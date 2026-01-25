import { useState, useEffect } from "react";

export default function TrainingCoach({ plan, userId, onPlanCreated, currentGoal }) {
  const [loading, setLoading] = useState(false);
  const [expandedDay, setExpandedDay] = useState(0);
  
  // Estados para los selectores
  const [selectedGoal, setSelectedGoal] = useState(currentGoal || 'mantener');
  const [selectedDays, setSelectedDays] = useState("4"); // Por defecto 4 días

  useEffect(() => {
    if (currentGoal) setSelectedGoal(currentGoal);
  }, [currentGoal]);

  const generarEntreno = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/crear-entreno', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            userId, 
            objetivo: selectedGoal,
            dias: selectedDays // 👈 Enviamos los días
        })
      });
      const data = await response.json();
      
      if (data.exito) {
        onPlanCreated(data.rutina);
        setExpandedDay(0); // Resetear acordeón
      } else {
        alert("Error: " + (data.error || "Fallo al crear rutina"));
      }
    } catch (error) {
      console.error(error);
      alert("Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  // --- COMPONENTE TOOLBAR (NUEVO DISEÑO) ---
  const Toolbar = () => (
    <div className="w-full max-w-5xl bg-gray-900 text-white p-3 rounded-lg shadow-xl mb-6 flex flex-col md:flex-row items-center justify-between gap-4 border-b-4 border-sportRed">
        
        {/* TÍTULO PEQUEÑO */}
        <div className="flex items-center gap-2 md:border-r md:border-gray-700 md:pr-4">
            <span className="text-2xl">⚡</span>
            <div>
                <h3 className="font-display font-bold uppercase italic leading-none">Obtener</h3>
                <span className="text-[10px] text-gray-400 tracking-widest uppercase">Rutina Personalizada</span>
            </div>
        </div>

        {/* CONTROLES (Horizontal) */}
        <div className="flex flex-1 flex-col md:flex-row gap-3 w-full md:w-auto">
            
            {/* SELECTOR OBJETIVO */}
            <select 
                value={selectedGoal} 
                onChange={(e) => setSelectedGoal(e.target.value)}
                className="bg-gray-800 border border-gray-700 text-xs font-bold uppercase rounded px-3 py-2 focus:border-sportRed focus:outline-none flex-1 text-white"
            >
                <option value="perder">🔥 Perder Grasa</option>
                <option value="mantener">⚖️ Mantenimiento</option>
                <option value="ganar">💪 Hipertrofia</option>
                <option value="fuerza">🏋️‍♂️ Fuerza Pura</option>
            </select>

            {/* SELECTOR DÍAS */}
            <select 
                value={selectedDays} 
                onChange={(e) => setSelectedDays(e.target.value)}
                className="bg-gray-800 border border-gray-700 text-xs font-bold uppercase rounded px-3 py-2 focus:border-sportRed focus:outline-none w-full md:w-32 text-white"
            >
                <option value="2">2 Días/sem</option>
                <option value="3">3 Días/sem</option>
                <option value="4">4 Días/sem</option>
                <option value="5">5 Días/sem</option>
                <option value="6">6 Días/sem</option>
            </select>
        </div>

        {/* BOTÓN GENERAR */}
        <button 
            onClick={generarEntreno}
            disabled={loading}
            className="w-full md:w-auto bg-sportRed hover:bg-red-700 text-white px-6 py-2 rounded font-bold uppercase tracking-widest text-xs transition-all shadow-[0_0_10px_rgba(220,38,38,0.4)] hover:shadow-[0_0_20px_rgba(220,38,38,0.6)] disabled:opacity-50 whitespace-nowrap"
        >
            {loading ? 'Generando...' : 'Crear Rutina'}
        </button>
    </div>
  );

  return (
    <div className="w-full max-w-5xl animate-fade-in flex flex-col items-center">
        
        {/* BARRA DE HERRAMIENTAS SIEMPRE VISIBLE */}
        <Toolbar />

        {/* CONTENIDO DE LA RUTINA */}
        {plan ? (
            <div className="w-full animate-slide-up">
                {/* CABECERA */}
                <div className="bg-white border-l-8 border-sportRed p-6 shadow-md mb-6 flex flex-wrap justify-between items-center gap-4 rounded-sm">
                    <div>
                        <h2 className="text-2xl font-display font-bold text-sportDark uppercase italic">
                            {plan.nombre_rutina}
                        </h2>
                        <div className="flex gap-2 mt-2 flex-wrap">
                            <span className="text-[10px] font-bold bg-black text-white px-2 py-1 uppercase rounded">{plan.frecuencia}</span>
                            <span className="text-[10px] font-bold bg-red-100 text-sportRed px-2 py-1 uppercase rounded">{plan.enfoque}</span>
                        </div>
                    </div>
                </div>

                {/* DÍAS */}
                <div className="space-y-3">
                    {plan.dias.map((dia, index) => {
                        const isOpen = expandedDay === index;
                        return (
                            <div key={index} className="bg-white shadow border border-gray-100 rounded-sm overflow-hidden">
                                <button 
                                    onClick={() => setExpandedDay(isOpen ? null : index)}
                                    className={`w-full flex justify-between items-center p-4 text-left font-bold uppercase tracking-wider transition-colors ${isOpen ? 'bg-sportDark text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                                >
                                    <span className="text-sm">{dia.dia}</span>
                                    <span className="text-lg font-mono">{isOpen ? '-' : '+'}</span>
                                </button>
                                
                                {isOpen && (
                                    <div className="p-4 bg-gray-50 border-t border-gray-200">
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-sm text-left">
                                                <thead className="text-[10px] text-gray-400 uppercase border-b border-gray-200">
                                                    <tr>
                                                        <th className="py-2">Ejercicio</th>
                                                        <th className="py-2">Series</th>
                                                        <th className="py-2">Reps</th>
                                                        <th className="py-2">Descanso</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="font-medium text-gray-700 text-xs md:text-sm">
                                                    {dia.ejercicios.map((ej, i) => (
                                                        <tr key={i} className="border-b border-gray-100 last:border-0 hover:bg-white transition-colors">
                                                            <td className="py-2 pr-2 font-bold text-sportDark">{ej.nombre}</td>
                                                            <td className="py-2">{ej.series}</td>
                                                            <td className="py-2 text-sportRed font-bold">{ej.reps}</td>
                                                            <td className="py-2 text-gray-500">{ej.descanso}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
                
                <div className="mt-6 p-3 bg-yellow-50 border border-yellow-200 rounded text-center">
                    <span className="text-yellow-600 font-bold uppercase text-[10px] tracking-widest block mb-1">Coach Tip</span>
                    <p className="text-gray-700 italic text-sm">"{plan.tip_extra}"</p>
                </div>
            </div>
        ) : (
            // Placeholder si no hay rutina aún
            <div className="text-center mt-10 opacity-50 animate-pulse">
                <div className="text-6xl mb-2">👆</div>
                <p className="font-bold text-gray-400 uppercase tracking-widest">Configura y genera tu plan arriba</p>
            </div>
        )}
    </div>
  );
}