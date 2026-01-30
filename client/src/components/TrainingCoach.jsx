import { useState, useEffect } from "react";
import { api } from "../services/api"; 
import { supabase } from "../supabase"; // 👈 1. IMPORTAMOS SUPABASE CLIENTE
import StatusModal from "./StatusModal"; 

export default function TrainingCoach({ plan, userId, onPlanCreated, currentGoal, initialData }) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [expandedDay, setExpandedDay] = useState(0);
  
  // Estado visual
  const [displayPlan, setDisplayPlan] = useState(plan);
  const [isDraft, setIsDraft] = useState(false);

  // Si recibimos un plan nuevo desde la DB (props), lo mostramos como oficial
  useEffect(() => {
    if (plan) {
        setDisplayPlan(plan);
        setIsDraft(false); 
    }
  }, [plan]);

  const [selectedGoal, setSelectedGoal] = useState(currentGoal || 'mantener');
  const [selectedDays, setSelectedDays] = useState("4");
  const [modalInfo, setModalInfo] = useState({ show: false, type: "error", title: "", message: "", onConfirm: null });

  const closeModal = () => setModalInfo({ ...modalInfo, show: false });

  // 1. GENERAR (Usa el Backend solo para la IA)
  const generarEntreno = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const mochilaGuardada = localStorage.getItem("nutri_temp_data");
      let datosMochila = {};
      if (mochilaGuardada) datosMochila = JSON.parse(mochilaGuardada);

      const pesoFinal = datosMochila.peso || initialData?.weight_kg;
      const alturaFinal = datosMochila.altura || initialData?.height_cm;
      const edadFinal = datosMochila.edad || initialData?.age;

      // Llamamos a la API solo para "pensar" la rutina
      const data = await api.createWorkout({ 
            userId, 
            objetivo: selectedGoal, 
            dias: selectedDays,
            peso: pesoFinal,
            altura: alturaFinal,
            edad: edadFinal,
            nivel: datosMochila.nivel
      });
      
      if (data.exito) {
        setDisplayPlan(data.rutina);
        setIsDraft(true); // 🚨 Es un borrador en memoria
        setExpandedDay(0);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        setModalInfo({ show: true, type: "error", title: "Error", message: data.error });
      }
    } catch (error) {
      console.error(error);
      setModalInfo({ show: true, type: "error", title: "Conexión", message: "Error al conectar con el servidor." });
    } finally {
      setLoading(false);
    }
  };

  // 2. GUARDAR (DIRECTO A SUPABASE, IGUAL QUE LAS RECETAS)
  const guardarRutinaDefinitiva = async () => {
      if (!userId || !displayPlan) return;
      setSaving(true);
      console.log("💾 Guardando directo en Supabase (Cliente)...");

      try {
          // A. Guardar en el Historial (Nueva tabla)
          const { error: historyError } = await supabase
              .from('saved_workouts')
              .insert({
                  user_id: userId,
                  plan_data: displayPlan,
                  created_at: new Date()
              });

          if (historyError) throw historyError;

          // B. Actualizar el perfil "Activo" (Para que sea tu rutina actual)
          // Primero chequeamos si ya existe la fila en biometrics
          const { data: existingBio } = await supabase
            .from('biometrics')
            .select('id')
            .eq('user_id', userId)
            .single();

          if (existingBio) {
             await supabase
                .from('biometrics')
                .update({ workout_plan: displayPlan, updated_at: new Date() })
                .eq('user_id', userId);
          } else {
             // Si es usuario nuevo y no tenía biometría, la creamos
             await supabase
                .from('biometrics')
                .insert({ user_id: userId, workout_plan: displayPlan });
          }

          // C. Éxito
          setIsDraft(false); 
          if (onPlanCreated) onPlanCreated(displayPlan); 
          
          setModalInfo({
              show: true,
              type: "success",
              title: "¡Rutina Guardada!",
              message: "Tu plan está seguro en la nube."
          });

      } catch (err) {
          console.error("Error Supabase:", err);
          setModalInfo({ show: true, type: "error", title: "Error", message: "No se pudo guardar: " + err.message });
      } finally {
          setSaving(false);
      }
  };

  const Toolbar = () => (
    <div className="w-full max-w-5xl bg-gray-900 text-white p-4 rounded-lg shadow-xl mb-6 border-b-4 border-sportRed">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
                 <span className="text-2xl">⚡</span>
                 <div>
                    <h3 className="font-display font-bold uppercase italic leading-none">Generador</h3>
                    <span className="text-[10px] text-gray-400 tracking-widest uppercase">IA Trainer</span>
                 </div>
            </div>

            <div className="flex flex-1 gap-3 w-full md:w-auto">
                 <select value={selectedGoal} onChange={(e) => setSelectedGoal(e.target.value)} className="bg-gray-800 border border-gray-700 text-xs font-bold uppercase rounded px-3 py-2 text-white flex-1 focus:border-sportRed focus:outline-none">
                    <option value="perder">🔥 Perder Grasa</option>
                    <option value="mantener">⚖️ Mantenimiento</option>
                    <option value="ganar">💪 Hipertrofia</option>
                 </select>
                 <select value={selectedDays} onChange={(e) => setSelectedDays(e.target.value)} className="bg-gray-800 border border-gray-700 text-xs font-bold uppercase rounded px-3 py-2 text-white w-24 focus:border-sportRed focus:outline-none">
                    <option value="3">3 Días</option>
                    <option value="4">4 Días</option>
                    <option value="5">5 Días</option>
                 </select>
            </div>

            <button 
                onClick={generarEntreno}
                disabled={loading}
                className="w-full md:w-auto bg-white/10 hover:bg-white/20 text-white px-6 py-2 rounded font-bold uppercase tracking-widest text-xs transition-all border border-white/20 whitespace-nowrap"
            >
                {loading ? 'Creando...' : 'Generar Nueva'}
            </button>
        </div>
    </div>
  );

  return (
    <div className="w-full max-w-5xl animate-fade-in flex flex-col items-center">
        
        <Toolbar />

        {/* CONTENIDO DE LA RUTINA */}
        {displayPlan ? (
            <div className="w-full animate-slide-up relative">
                
                {/* 🚨 AVISO DE BORRADOR + BOTÓN GUARDAR (ESTO ES LO QUE NECESITABAS) */}
                {isDraft && (
                    <div className="sticky top-4 z-30 bg-sportRed text-white p-4 rounded shadow-2xl flex flex-col md:flex-row justify-between items-center gap-4 mb-8 border-4 border-white animate-bounce-short">
                        <div className="flex items-center gap-4">
                            <span className="text-3xl">⚠️</span>
                            <div>
                                <h4 className="font-display font-bold uppercase tracking-wider text-lg">Rutina No Guardada</h4>
                                <p className="text-xs text-red-100 font-bold mt-1">
                                    Esta rutina es solo una vista previa. <br className="md:hidden"/>
                                    Guárdala para verla en tu celular y en el historial.
                                </p>
                            </div>
                        </div>
                        <button 
                            onClick={guardarRutinaDefinitiva}
                            disabled={saving}
                            className="bg-white text-sportRed px-8 py-3 rounded-full font-bold uppercase tracking-widest text-sm hover:bg-gray-100 shadow-lg transition-transform hover:scale-105 whitespace-nowrap"
                        >
                            {saving ? 'Guardando...' : '💾 GUARDAR EN LA NUBE'}
                        </button>
                    </div>
                )}

                {/* CABECERA RUTINA */}
                <div className={`bg-white border-l-8 ${isDraft ? 'border-gray-300' : 'border-sportRed'} p-6 shadow-md mb-6 flex flex-wrap justify-between items-center gap-4 rounded-sm transition-colors duration-500`}>
                    <div>
                        <h2 className="text-2xl font-display font-bold text-sportDark uppercase italic">
                            {displayPlan.nombre_rutina}
                        </h2>
                        <div className="flex gap-2 mt-2 flex-wrap">
                            <span className="text-[10px] font-bold bg-black text-white px-2 py-1 uppercase rounded">{displayPlan.frecuencia}</span>
                            <span className="text-[10px] font-bold bg-red-100 text-sportRed px-2 py-1 uppercase rounded">{displayPlan.enfoque}</span>
                            
                            {/* Etiqueta pequeña de estado */}
                            {isDraft ? (
                                <span className="text-[10px] font-bold bg-yellow-400 text-yellow-900 px-2 py-1 uppercase rounded animate-pulse">SIN GUARDAR</span>
                            ) : (
                                <span className="text-[10px] font-bold bg-green-100 text-green-700 px-2 py-1 uppercase rounded">✔ EN LA NUBE</span>
                            )}
                        </div>
                    </div>
                </div>

                {/* DÍAS ACORDEÓN (Esto sigue igual) */}
                <div className="space-y-3">
                    {displayPlan.dias.map((dia, index) => {
                         const isOpen = expandedDay === index;
                         return (
                            <div key={index} className="bg-white shadow border border-gray-100 rounded-sm overflow-hidden">
                                <button onClick={() => setExpandedDay(isOpen ? null : index)} className={`w-full flex justify-between items-center p-4 text-left font-bold uppercase tracking-wider transition-colors ${isOpen ? 'bg-sportDark text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}>
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
                    <p className="text-gray-700 italic text-sm">"{displayPlan.tip_extra}"</p>
                </div>
            </div>
        ) : (
            <div className="text-center mt-10 opacity-50 animate-pulse">
                <div className="text-6xl mb-2">👆</div>
                <p className="font-bold text-gray-400 uppercase tracking-widest">Configura y genera tu plan arriba</p>
            </div>
        )}

        {modalInfo.show && <StatusModal {...modalInfo} onClose={closeModal} />}
    </div>
  );
}