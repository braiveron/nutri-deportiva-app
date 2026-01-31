import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import { api } from '../services/api'; 
import StatusModal from "./StatusModal";

export default function RecipeChef({ macros, userId, onRecipeCreated, deletedRecipeId }) {
  const navigate = useNavigate(); 
  
  const [ingredientes, setIngredientes] = useState('');
  const [tipoComida, setTipoComida] = useState('');
  const [receta, setReceta] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // Estados de guardado
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [currentSavedId, setCurrentSavedId] = useState(null);
  
  // Estado para botón "Agregar al Diario"
  const [addingToLog, setAddingToLog] = useState(false);

  // Historial de sesión para evitar repetir recetas al regenerar
  const [sessionRejected, setSessionRejected] = useState([]);

  // Estado del Modal
  const [modalInfo, setModalInfo] = useState({ 
    show: false, 
    type: "error", 
    title: "", 
    message: "", 
    onConfirm: null 
  });

  const closeModal = () => setModalInfo({ ...modalInfo, show: false });

  const cleanNumber = (val) => {
    if (!val) return 0;
    const num = parseFloat(val.toString().replace(/[^0-9.]/g, ''));
    return isNaN(num) ? 0 : num;
  };

  // 👇 1. EFECTO: CARGAR RECETA GUARDADA EN LOCALSTORAGE AL INICIAR
  useEffect(() => {
    const tempRecipe = localStorage.getItem('nutri_temp_recipe');
    if (tempRecipe) {
        try {
            const parsed = JSON.parse(tempRecipe);
            setReceta(parsed);
            // Restauramos los inputs originales para que el usuario sepa qué buscó
            if (parsed.ingredientes_origen) setIngredientes(parsed.ingredientes_origen);
        } catch (e) {
            console.error("Error cargando receta temporal", e);
            localStorage.removeItem('nutri_temp_recipe'); // Si está corrupto, limpiar
        }
    }
  }, []);

  // Efecto: Reseteo si se borra desde el historial
  useEffect(() => {
    if (deletedRecipeId && deletedRecipeId === currentSavedId) {
        setSaved(false);
        setCurrentSavedId(null);
    }
  }, [deletedRecipeId, currentSavedId]);

  // 👇 2. FUNCIÓN PARA DESCARTAR Y LIMPIAR LOCALSTORAGE
  const descartarReceta = () => {
    setReceta(null);
    setIngredientes(''); 
    setSaved(false);
    setCurrentSavedId(null);
    setSessionRejected([]); 
    localStorage.removeItem('nutri_temp_recipe'); // 🗑️ Limpieza explícita
  };

  const cocinar = async (e, isRegenerate = false) => {
    if (e) e.preventDefault();
    
    if (!ingredientes || !tipoComida) return;
    
    setLoading(true);
    
    // Lógica para no repetir recetas en la misma sesión
    let currentAvoidList = [...sessionRejected];
    if (isRegenerate && receta) {
        currentAvoidList.push(receta.nombre_receta);
        setSessionRejected(currentAvoidList);
    } else if (!isRegenerate) {
        currentAvoidList = [];
        setSessionRejected([]);
    }

    // Limpiamos pantalla pero NO borramos el localstorage todavía por si falla la API
    setReceta(null); 
    setSaved(false);
    setCurrentSavedId(null);
    setAddingToLog(false);

    const objetivo = macros || { calorias: 600, proteinas: 40 };

    const datosReceta = {
        ingredientes: ingredientes.split(',').map(i => i.trim()),
        tipoComida,
        macrosObjetivo: objetivo,
        userId: userId,
        recetasOmitir: currentAvoidList
    };

    try {
      const data = await api.createRecipe(datosReceta);
      
      if (data.receta) {
        const recetaConMeta = { ...data.receta, ingredientes_origen: ingredientes };
        
        setReceta(recetaConMeta);
        
        // 👇 3. GUARDAMOS EN LOCALSTORAGE (PERSISTENCIA)
        localStorage.setItem('nutri_temp_recipe', JSON.stringify(recetaConMeta));

      } else {
        throw new Error("No se recibió una receta válida");
      }
    } catch (error) {
      console.error("Error en la cocina:", error);
      setModalInfo({
        show: true,
        type: "error",
        title: "Chef Ocupado",
        message: "Hubo un problema al generar la receta. Intenta de nuevo."
      });
    } finally {
      setLoading(false);
    }
  };

  const guardarReceta = async () => {
    if (!receta || !userId) return;
    setSaving(true);

    try {
        const { data, error } = await supabase
            .from('saved_recipes')
            .insert({
                user_id: userId,
                recipe_data: receta
            })
            .select();

        if (error) throw error;

        setSaved(true);
        if (data && data.length > 0) {
            setCurrentSavedId(data[0].id);
        }
        
        if (onRecipeCreated) onRecipeCreated();

        // 👇 4. AL GUARDAR, LIMPIAMOS LOCALSTORAGE (Ya está en la base de datos)
        localStorage.removeItem('nutri_temp_recipe');

        setModalInfo({
            show: true,
            type: "success",
            title: "¡Guardada!",
            message: "La receta se guardó en tus favoritos."
        });

    } catch (error) {
        console.error("Error guardando:", error);
        setModalInfo({
            show: true,
            type: "error",
            title: "Error",
            message: "No se pudo guardar la receta."
        });
    } finally {
        setSaving(false);
    }
  };

  const agregarAlDiario = async () => {
    if (!receta || !userId) return;
    setAddingToLog(true);

    try {
        const logPayload = {
            userId,
            meal_name: receta.nombre_receta,
            calories: cleanNumber(receta.macros.calorias),
            protein: cleanNumber(receta.macros.proteinas),
            carbs: cleanNumber(receta.macros.carbohidratos),
            fats: cleanNumber(receta.macros.grasas),
            date: new Date().toISOString().split('T')[0]
        };

        const response = await api.addLog(logPayload);

        if (response.success) {
            setModalInfo({
                show: true,
                type: "success",
                title: "¡Registrado!",
                message: "Comida agregada. ¿Vamos al seguimiento?",
                onConfirm: () => navigate('/seguimiento') 
            });
        } else {
            throw new Error(response.error);
        }
    } catch (error) {
        console.error("Error agregando al diario:", error);
        setModalInfo({
            show: true,
            type: "error",
            title: "Error",
            message: "No se pudo registrar la comida."
        });
    } finally {
        setAddingToLog(false);
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

            <form onSubmit={(e) => cocinar(e, false)} className="space-y-4">
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
                    
                    {/* BARRA DE ACCIONES UNIFICADA */}
                    <div className="mb-6 flex flex-wrap md:flex-nowrap justify-end gap-2 pb-4 border-b border-gray-100">
                        
                        {/* 1. AGREGAR A DIARIO */}
                        <button 
                            onClick={agregarAlDiario}
                            disabled={addingToLog}
                            className="flex-grow md:flex-grow-0 flex items-center justify-center gap-2 bg-gray-800 text-white px-4 py-2 text-xs font-bold uppercase tracking-wider hover:bg-black transition-colors rounded-sm shadow-md order-1"
                        >
                             {addingToLog ? '⏳...' : (
                                <>
                                    <span>📅 Agregar</span>
                                    <span className="hidden md:inline"> a Hoy</span>
                                </>
                             )}
                        </button>

                        {/* 2. GUARDAR FAVORITOS */}
                        {!saved ? (
                            <button 
                                onClick={guardarReceta}
                                disabled={saving}
                                className="flex-grow md:flex-grow-0 flex items-center justify-center gap-2 bg-sportRed text-white px-4 py-2 text-xs font-bold uppercase tracking-wider hover:bg-red-700 transition-colors rounded-sm shadow-md order-2"
                            >
                                {saving ? 'Guardando...' : (
                                    <>
                                        <span>Guardar</span>
                                        <span className="text-white">❤</span>
                                    </>
                                )}
                            </button>
                        ) : (
                            <span className="flex-grow md:flex-grow-0 flex items-center justify-center text-green-700 bg-green-50 border border-green-200 text-xs font-bold uppercase tracking-wider px-4 py-2 rounded-sm order-2">
                                ✓ Guardado
                            </span>
                        )}

                        {/* 3. REGENERAR (Icono Reciclaje) */}
                        <button 
                            onClick={() => cocinar(null, true)} 
                            title="Probar otra variante"
                            className="flex-none flex items-center justify-center gap-2 bg-gray-800 text-white px-3 py-2 text-xs font-bold uppercase tracking-wider hover:bg-black transition-colors rounded-sm shadow-md order-3"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                            </svg>
                            {/* Ocultamos texto en movil para ahorrar espacio */}
                            <span className="hidden md:inline">Regenerar</span>
                        </button>
                        
                        {/* 4. DESCARTAR (X) */}
                        <button 
                            onClick={descartarReceta}
                            title="Descartar y limpiar"
                            className="flex-none flex items-center justify-center gap-2 bg-gray-100 text-gray-500 px-3 py-2 text-xs font-bold uppercase tracking-wider hover:bg-red-500 hover:text-white transition-colors rounded-sm shadow-sm order-4"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    <div className="flex justify-between items-start border-b-2 border-sportRed pb-4 mb-4">
                        <div>
                            <h3 className="text-3xl font-display font-bold text-sportDark uppercase italic pr-8">{receta.nombre_receta}</h3>
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

      {modalInfo.show && <StatusModal {...modalInfo} onClose={closeModal} />}
    </div>
  );
}