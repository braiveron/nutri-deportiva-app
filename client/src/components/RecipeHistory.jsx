import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom"; // 1. IMPORTAMOS NAVIGATE
import { supabase } from "../supabase";
import { api } from "../services/api"; 
import StatusModal from "./StatusModal";

export default function RecipeHistory({ userId }) {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  
  const navigate = useNavigate(); // 2. INSTANCIAMOS

  // 3. AGREGAMOS 'redirect' AL ESTADO INICIAL
  const [modal, setModal] = useState({ 
    show: false, 
    type: 'success', 
    title: '', 
    message: '', 
    onConfirm: null,
    redirect: null // 👈 Nueva propiedad
  });

  useEffect(() => {
    if (userId) fetchRecipes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const fetchRecipes = async () => {
    try {
      const { data, error } = await supabase
        .from('saved_recipes')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRecipes(data || []);
    } catch (error) {
      console.error("Error cargando historial:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (e, id) => {
    e.stopPropagation(); 
    setModal({
        show: true,
        type: 'error',
        title: '¿Borrar Receta?',
        message: 'Esta acción no se puede deshacer. ¿Quieres eliminarla de tu libro?',
        onConfirm: () => confirmDelete(id),
        redirect: null
    });
  };

  const confirmDelete = async (id) => {
    setModal({ show: true, type: 'loading', title: 'Borrando...', message: 'Eliminando receta...', onConfirm: null });

    try {
      const { error } = await supabase
        .from('saved_recipes')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setRecipes(recipes.filter(r => r.id !== id));
      
      setModal({ show: true, type: 'success', title: '¡Eliminada!', message: 'La receta se ha borrado correctamente.', onConfirm: null, redirect: null });

    } catch (error) {
      setModal({ show: true, type: 'error', title: 'Error', message: error.message, onConfirm: null, redirect: null });
    }
  };

  const handleAddToTrackerClick = (e, item) => {
      e.stopPropagation(); 
      setModal({
        show: true,
        type: 'confirm',
        title: '¿Registrar en Diario?',
        message: `Vamos a agregar "${item.recipe_data.nombre_receta}" a tu consumo de hoy.`,
        onConfirm: () => confirmAddToTracker(item),
        redirect: null
      });
  };

  const confirmAddToTracker = async (item) => {
      setModal({ show: true, type: 'loading', title: 'Registrando...', message: 'Guardando en tu diario...', onConfirm: null });

      const macros = item.recipe_data.macros;
      const logData = {
          userId,
          meal_name: item.recipe_data.nombre_receta,
          calories: macros.calorias || 0,
          protein: macros.proteinas || 0,
          carbs: macros.carbohidratos || 0,
          fats: macros.grasas || 0
      };

      try {
          const res = await api.addDailyLog(logData);
          if (res.success) {
              // 🔥 4. AQUÍ CONFIGURAMOS LA REDIRECCIÓN AL ÉXITO
              setModal({ 
                  show: true, 
                  type: 'success', 
                  title: '¡Registrado!', 
                  message: 'Tus macros se han actualizado. Vamos a verlos.', 
                  onConfirm: null,
                  redirect: '/seguimiento' // 👈 La magia ocurre aquí
              });
          } else {
              setModal({ show: true, type: 'error', title: 'Error', message: 'No se pudo agregar: ' + res.error, onConfirm: null });
          }
      } catch (error) {
          console.error(error);
          setModal({ show: true, type: 'error', title: 'Error de Red', message: 'Verifica tu conexión.', onConfirm: null });
      }
  };

  // 🔥 5. MODIFICAMOS EL CIERRE PARA EJECUTAR REDIRECCIÓN
  const closeModal = () => {
    const destination = modal.redirect; // Guardamos la ruta antes de limpiar el estado
    
    setModal({ ...modal, show: false, redirect: null }); // Limpiamos
    
    if (destination) {
        navigate(destination); // 🚀 Viajamos
    }
  };

  const toggleRecipe = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const filteredRecipes = recipes.filter((item) => {
      if (!searchTerm) return true;
      const nombre = item.recipe_data?.nombre_receta?.toLowerCase() || "";
      return nombre.includes(searchTerm.toLowerCase());
  });

  if (loading) return <div className="text-center text-gray-400 mt-10 animate-pulse">Cargando libro de cocina...</div>;

  return (
    <div className="w-full max-w-4xl mt-16 animate-fade-in pb-20 relative">
      
      {modal.show && (
        <StatusModal 
            type={modal.type}
            title={modal.title}
            message={modal.message}
            onClose={closeModal}
            onConfirm={modal.onConfirm}
        />
      )}

      {/* TÍTULO */}
      <div className="flex items-center gap-4 mb-4">
        <div className="h-px bg-gray-300 flex-1"></div>
        <h3 className="text-2xl font-display font-bold text-gray-400 uppercase tracking-widest">
            Recetas Guardadas
        </h3>
        <div className="h-px bg-gray-300 flex-1"></div>
      </div>

      {/* INPUT BUSCADOR */}
      {recipes.length > 0 && (
          <div className="mb-8 flex justify-center">
              <div className="relative w-full max-w-md">
                  <input 
                      type="text" 
                      placeholder="Buscar en tus recetas..." 
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 rounded-full border border-gray-200 bg-white focus:outline-none focus:border-sportRed focus:ring-1 focus:ring-sportRed transition-all text-sm shadow-sm"
                  />
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
                  {searchTerm && (
                      <button 
                        onClick={() => setSearchTerm("")}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-sportRed"
                      >
                        ✕
                      </button>
                  )}
              </div>
          </div>
      )}

      {/* LISTA */}
      {filteredRecipes.length === 0 ? (
        <div className="text-center py-10 border-2 border-dashed border-gray-200 rounded bg-gray-50">
            <span className="text-4xl block mb-2">📂</span>
            <p className="text-gray-400 font-bold uppercase text-sm">
                {searchTerm ? `No se encontró "${searchTerm}"` : "No hay recetas guardadas aún."}
            </p>
        </div>
      ) : (
        <div className="grid gap-4">
            {filteredRecipes.map((item) => {
            const receta = item.recipe_data; 
            const isOpen = expandedId === item.id;

            return (
                <div key={item.id} className="bg-white border-l-4 border-sportDark shadow-md overflow-hidden transition-all duration-300 group">
                
                {/* CABECERA */}
                <div 
                    onClick={() => toggleRecipe(item.id)}
                    className="w-full flex justify-between items-center p-4 hover:bg-gray-50 cursor-pointer"
                >
                    <div>
                        <h4 className="font-bold text-sportDark uppercase text-lg">{receta.nombre_receta}</h4>
                        <p className="text-xs text-gray-500 font-bold mt-1">
                            {new Date(item.created_at).toLocaleDateString()} • {receta.macros.calorias} Kcal
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        
                        <button 
                            onClick={(e) => handleAddToTrackerClick(e, item)}
                            className="p-2 text-gray-300 hover:text-green-600 hover:bg-green-50 rounded-full transition-all"
                            title="Registrar en Diario de Hoy"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                            </svg>
                        </button>

                        <button 
                            onClick={(e) => handleDeleteClick(e, item.id)}
                            className="p-2 text-gray-300 hover:text-red-600 hover:bg-red-50 rounded-full transition-all"
                            title="Borrar receta"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                            </svg>
                        </button>

                        <span className={`text-sportRed text-2xl transform transition-transform ${isOpen ? 'rotate-180' : ''}`}>
                            ▼
                        </span>
                    </div>
                </div>

                {isOpen && (
                    <div className="p-6 border-t border-gray-100 bg-gray-50 animate-fade-in">
                        <div className="grid md:grid-cols-2 gap-6">
                            <div>
                                <h5 className="text-xs font-bold text-gray-400 uppercase mb-2">Ingredientes</h5>
                                <ul className="text-sm text-gray-700 space-y-1">
                                    {receta.ingredientes.map((ing, i) => (
                                        <li key={i}>• {ing.item} ({ing.cantidad})</li>
                                    ))}
                                </ul>
                            </div>
                            <div>
                                <h5 className="text-xs font-bold text-gray-400 uppercase mb-2">Preparación</h5>
                                <ol className="text-sm text-gray-700 space-y-2 list-decimal pl-4">
                                    {receta.pasos.map((paso, i) => (
                                        <li key={i}>{paso}</li>
                                    ))}
                                </ol>
                            </div>
                        </div>
                    </div>
                )}
                </div>
            );
            })}
        </div>
      )}
    </div>
  );
}