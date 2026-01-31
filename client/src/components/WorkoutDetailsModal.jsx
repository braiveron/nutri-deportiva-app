import { useState } from "react";

export default function WorkoutDetailsModal({ plan, onClose }) {
  const [expandedDay, setExpandedDay] = useState(0);

  if (!plan) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      
      <div className="bg-white w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-lg shadow-2xl flex flex-col relative">
        
        {/* CABECERA */}
        <div className="sticky top-0 bg-white z-10 p-6 border-b border-gray-100 flex justify-between items-start">
            <div>
                <h2 className="text-2xl font-display font-bold text-sportDark uppercase italic">
                    {plan.nombre_rutina}
                </h2>
                <div className="flex gap-2 mt-2">
                    <span className="text-[10px] font-bold bg-black text-white px-2 py-1 uppercase rounded">
                        {plan.frecuencia}
                    </span>
                    <span className="text-[10px] font-bold bg-red-100 text-sportRed px-2 py-1 uppercase rounded">
                        {plan.enfoque}
                    </span>
                </div>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-sportRed transition-colors text-2xl font-bold leading-none">✕</button>
        </div>

        {/* CUERPO */}
        <div className="p-6 space-y-3 bg-gray-50 flex-1">
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
                        <div className="p-4 bg-white border-t border-gray-200">
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
                                            <tr key={i} className="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors">
                                                
                                                {/* VOLVEMOS AL ESTADO ORIGINAL (Solo texto) */}
                                                <td className="py-2 pr-2 font-bold text-sportDark">
                                                    {ej.nombre}
                                                </td>

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

            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded text-center">
                <span className="text-yellow-600 font-bold uppercase text-[10px] tracking-widest block mb-1">Coach Tip</span>
                <p className="text-gray-700 italic text-sm">"{plan.tip_extra}"</p>
            </div>
        </div>

        <div className="p-4 border-t border-gray-100 bg-white flex justify-end">
            <button 
                onClick={onClose}
                className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-6 py-2 rounded font-bold uppercase text-xs tracking-wider"
            >
                Cerrar
            </button>
        </div>

      </div>
    </div>
  );
}