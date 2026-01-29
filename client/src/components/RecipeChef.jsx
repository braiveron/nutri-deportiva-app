import { useState } from 'react';
import { supabase } from '../supabase';
import { api } from '../services/api'; // 👈 IMPORTAMOS LA API CENTRALIZADA

export default function RecipeChef({ macros, userId, onRecipeCreated }) {
  const [ingredientes, setIngredientes] = useState('');
  const [tipoComida, setTipoComida] = useState('');
  const [receta, setReceta] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const cocinar = async (e) => {
    e.preventDefault();
    if (!ingredientes || !tipoComida) return;
    
    setLoading(true);
    setReceta(null);
    setSaved(false);

    const objetivo = macros || { calorias: 600, proteinas: 40 };

    // Construimos el objeto de datos que espera la API
    const datosReceta = {
        ingredientes: ingredientes.split(',').map(i => i.trim()),
        tipoComida,
        macrosObjetivo: objetivo,
        userId: userId
    };

    try {
      // 🔥 CORRECCIÓN: Usamos la función de la API en lugar de fetch directo
      const data = await api.createRecipe(datosReceta);
      
      if (data.receta) {
        setReceta(data.receta);
      } else {
        throw new Error("No se recibió receta válida");
      }
    } catch (error) {
      console.error("Error en la cocina:", error);
      alert("El Chef está ocupado. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  const guardarReceta = async () => {
    if (!receta || !userId) return;
    setSaving(true);

    try {
        const { error } = await supabase
            .from('saved_recipes')
            .insert({
                user_id: userId,
                recipe_data: receta
            });

        if (error) throw error;

        setSaved(true);
        
        if (onRecipeCreated) onRecipeCreated();

    } catch (error) {
        console.error("Error guardando:", error);
        alert("No se pudo guardar la receta.");
    } finally {
        setSaving(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mt-12 animate-fade-in relative z-20">
      
      {/* TÍTULO */}
      <div className="mb-6 border-l-8 border-sportRed pl-4">
        <h2 className="text-4xl font-display font-bold text-sportDark italic uppercase leading-none">
          CHEF <span className="text-sportRed">PRO</span>
        </h2>
        <p className="text-xs font-bold text-gray-400 tracking-widest uppercase mt-1">
          Generador de recetas de alto rendimiento
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        
        {/* PANEL DE CONTROL */}
        <div className="w-full md:w-1/3 bg-white border-2 border-sportDark p-6 shadow-2xl relative">
            <div className="absolute -top-2 -left-2 w-4 h-4 bg-sportRed z-10"></div>

            <form onSubmit={cocinar} className="space-y-4">
                <div>
                    <label className="text-xs font-bold text-gray-500 uppercase block mb-1">¿Qué tienes en la heladera?</label>
                    <textarea 
                        rows="3"
                        placeholder="Ej: Huevos, espinaca, pan integral..."
                        value={ingredientes}
                        onChange={(e) => setIngredientes(e.target.value)}
                        className="w-full bg-gray-50 border-2 border-gray-200 p-3 font-bold text-sportDark focus:outline-none focus:border-sportRed resize-none transition-colors"
                    ></textarea>
                </div>

                <div>
                    <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Tipo de Comida</label>
                    <select 
                        value={tipoComida}
                        onChange={(e) => setTipoComida(e.target.value)}
                        className={`w-full border-2 p-2 font-bold focus:outline-none focus:border-sportRed cursor-pointer transition-colors ${
                          tipoComida === '' ? 'text-gray-400 border-gray-200' : 'text-sportDark border-sportDark'
                        }`}
                    >
                        <option value="" disabled>SELECCIONAR...</option>
                        <option value="Desayuno">DESAYUNO</option>
                        <option value="Almuerzo">ALMUERZO</option>
                        <option value="Cena">CENA</option>
                        <option value="Snack">SNACK / PRE-ENTRENO</option>
                    </select>
                </div>

                <button 
                    type="submit" 
                    disabled={loading || !ingredientes || !tipoComida}
                    className="w-full py-3 bg-sportRed text-white font-display font-bold text-xl uppercase tracking-wider hover:bg-sportDark transition-colors shadow-sport disabled:opacity-50 disabled:shadow-none"
                >
                    {loading ? 'DISEÑANDO...' : 'GENERAR PLATO'}
                </button>
            </form>
        </div>

        {/* PANEL DE RESULTADO */}
        <div className="w-full md:w-2/3 min-h-[300px] border-2 border-dashed border-gray-300 bg-gray-50 flex items-center justify-center relative overflow-hidden">
            
            {!receta && !loading && (
                <div className="text-center opacity-40">
                    <span className="text-6xl">👨‍🍳</span>
                    <p className="font-display uppercase font-bold text-gray-400 mt-2">Esperando ingredientes...</p>
                </div>
            )}

            {loading && (
                <div className="text-center animate-pulse">
                      <span className="text-6xl">🔥</span>
                      <p className="font-display uppercase font-bold text-sportRed mt-2">Optimizando macros...</p>
                </div>
            )}

            {receta && (
                <div className="absolute inset-0 bg-white p-6 overflow-y-auto text-left animate-fade-in flex flex-col">
                    
                    {/* BOTÓN DE GUARDAR */}
                    <div className="mb-4 flex justify-end">
                        {!saved ? (
                            <button 
                                onClick={guardarReceta}
                                disabled={saving}
                                className="flex items-center gap-2 bg-sportDark text-white px-4 py-2 text-xs font-bold uppercase tracking-wider hover:bg-black transition-colors"
                            >
                                {saving ? 'Guardando...' : (
                                    <>
                                        <span>Guardar Receta</span>
                                        <span className="text-sportRed">❤</span>
                                    </>
                                )}
                            </button>
                        ) : (
                            <span className="text-green-600 text-xs font-bold uppercase tracking-wider border border-green-600 px-3 py-1">
                                ✓ Guardado en Historial
                            </span>
                        )}
                    </div>

                    <div className="flex justify-between items-start border-b-2 border-sportRed pb-4 mb-4">
                        <div>
                            <h3 className="text-3xl font-display font-bold text-sportDark uppercase italic">{receta.nombre_receta}</h3>
                            <span className="bg-sportDark text-white text-xs font-bold px-2 py-1 uppercase mt-1 inline-block">
                                ⏱ {receta.tiempo}
                            </span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <h4 className="text-sm font-bold text-gray-400 uppercase mb-2">Ingredientes Exactos</h4>
                            <ul className="space-y-2">
                                {receta.ingredientes.map((ing, i) => (
                                    <li key={i} className="flex justify-between border-b border-gray-100 pb-1 text-sm font-medium text-gray-700">
                                        <span>{ing.item}</span>
                                        <span className="font-bold text-sportDark">{ing.cantidad}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="bg-gray-100 p-4 border border-gray-200">
                            <h4 className="text-sm font-bold text-gray-400 uppercase mb-2 text-center">Aporte Nutricional</h4>
                            <div className="text-center mb-2">
                                <span className="text-4xl font-display font-bold text-sportRed">{receta.macros.calorias}</span>
                                <span className="text-xs font-bold text-gray-500 block">KCAL</span>
                            </div>
                            <div className="flex justify-between text-xs font-bold text-gray-600">
                                <span>PRO: {receta.macros.proteinas}g</span>
                                <span>CAR: {receta.macros.carbohidratos}g</span>
                                <span>GRA: {receta.macros.grasas}g</span>
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 pb-10"> 
                        <h4 className="text-sm font-bold text-gray-400 uppercase mb-3">Preparación</h4>
                        <div className="space-y-3">
                            {receta.pasos.map((paso, i) => (
                                <div key={i} className="flex gap-3">
                                    <div className="min-w-[24px] h-6 bg-sportRed text-white text-xs font-bold flex items-center justify-center rounded-sm">
                                        {i + 1}
                                    </div>
                                    <p className="text-sm text-gray-700 font-medium leading-relaxed">{paso}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {receta.tip && (
                        <div className="mt-6 bg-yellow-50 border-l-4 border-yellow-400 p-3 text-sm text-yellow-800 italic font-medium">
                            💡 Expert Tip: {receta.tip}
                        </div>
                    )}
                </div>
            )}
        </div>
      </div>
    </div>
  );
}