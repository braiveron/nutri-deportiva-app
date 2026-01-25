import { useEffect, useState } from "react";
import { supabase } from "../supabase";

export default function RecipeHistory({ userId }) {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);

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

  // --- NUEVA FUNCIÓN: BORRAR ---
  const handleDelete = async (e, id) => {
    e.stopPropagation(); // Para que no se abra la receta al hacer click en borrar
    
    const confirm = window.confirm("¿Estás seguro de que quieres borrar esta receta del historial?");
    if (!confirm) return;

    try {
      const { error } = await supabase
        .from('saved_recipes')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Actualizamos la lista visualmente sin recargar
      setRecipes(recipes.filter(r => r.id !== id));

    } catch (error) {
      alert("Error borrando: " + error.message);
    }
  };

  const toggleRecipe = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  if (loading) return <div className="text-center text-gray-400 mt-10 animate-pulse">Cargando libro de cocina...</div>;

  return (
    <div className="w-full max-w-4xl mt-16 animate-fade-in pb-20">
      
      <div className="flex items-center gap-4 mb-6">
        <div className="h-px bg-gray-300 flex-1"></div>
        <h3 className="text-2xl font-display font-bold text-gray-400 uppercase tracking-widest">
            Historial de Comidas
        </h3>
        <div className="h-px bg-gray-300 flex-1"></div>
      </div>

      {recipes.length === 0 ? (
        <div className="text-center py-10 border-2 border-dashed border-gray-200 rounded bg-gray-50">
            <span className="text-4xl block mb-2">📂</span>
            <p className="text-gray-400 font-bold uppercase text-sm">No hay recetas guardadas aún.</p>
        </div>
      ) : (
        <div className="grid gap-4">
            {recipes.map((item) => {
            const receta = item.recipe_data; 
            const isOpen = expandedId === item.id;

            return (
                <div key={item.id} className="bg-white border-l-4 border-sportDark shadow-md overflow-hidden transition-all duration-300 group">
                
                {/* CABECERA (Clickable) */}
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

                    <div className="flex items-center gap-4">
                        {/* BOTÓN DE BORRAR (Nuevo) */}
                        <button 
                            onClick={(e) => handleDelete(e, item.id)}
                            className="p-2 text-gray-300 hover:text-red-600 hover:scale-110 transition-all"
                            title="Borrar receta"
                        >
                            🗑
                        </button>

                        <span className={`text-sportRed text-2xl transform transition-transform ${isOpen ? 'rotate-180' : ''}`}>
                            ▼
                        </span>
                    </div>
                </div>

                {/* CONTENIDO DESPLEGABLE */}
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