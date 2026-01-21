import { useState } from 'react';

// 1. Diccionario de descripciones (VERSIÓN GENERAL DEPORTIVA)
const DESCRIPCIONES = {
  sedentario: "Poco movimiento (Trabajo de oficina, estar sentado la mayor parte del día).",
  ligero: "Actividad ligera 1-3 días/semana (Caminar rápido, Yoga, Natación suave).",
  moderado: "Entrenamiento moderado 3-5 días/semana (Gimnasio, Clases de baile, Ciclismo recreativo).",
  intenso: "Entrenamiento fuerte 6-7 días/semana (CrossFit, Deportes competitivos, Gym intenso).",
  muy_intenso: "Alto Rendimiento (Doble turno de entrenamiento diario, trabajo físico muy pesado)."
};

export default function Calculator() {
  const [formData, setFormData] = useState({
    peso: '',
    altura: '',
    edad: '',
    genero: 'masculino',
    nivel_actividad: 'intenso' // Valor por defecto
  });

  const [resultado, setResultado] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('http://localhost:5000/api/calcular-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          peso: Number(formData.peso),
          altura: Number(formData.altura),
          edad: Number(formData.edad),
          genero: formData.genero,
          nivel_actividad: formData.nivel_actividad,
          user_email: 'test@nutriaerea.com'
        }),
      });

      const data = await response.json();
      setResultado(data.plan);
    } catch (error) {
      console.error('Error:', error);
      alert('Hubo un error conectando con el servidor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden md:max-w-2xl p-6 mt-10">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-2">Calculadora Nutricional</h2>
      
      <form onSubmit={handleSubmit} className="space-y-5">
        
        {/* FILA 1: Peso y Altura */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Peso (kg)</label>
            <input 
              type="number" name="peso" placeholder="70"
              value={formData.peso} onChange={handleChange}
              className="w-full rounded-md border-gray-300 border p-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none" 
              required
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Altura (cm)</label>
            <input 
              type="number" name="altura" placeholder="175"
              value={formData.altura} onChange={handleChange}
              className="w-full rounded-md border-gray-300 border p-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none" 
              required
            />
          </div>
        </div>

        {/* FILA 2: Edad y Género */}
        <div className="grid grid-cols-2 gap-4">
            <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Edad</label>
                <input 
                type="number" name="edad" placeholder="30"
                value={formData.edad} onChange={handleChange}
                className="w-full rounded-md border-gray-300 border p-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none" 
                required
                />
            </div>
            <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Género</label>
                <select name="genero" onChange={handleChange} className="w-full rounded-md border-gray-300 border p-2 bg-white">
                <option value="masculino">Masculino</option>
                <option value="femenino">Femenino</option>
                </select>
            </div>
        </div>

        {/* SECCIÓN ACTIVIDAD (MEJORADA) */}
        <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
            <label className="block text-sm font-bold text-gray-800 mb-2">Nivel de Actividad Física</label>
            
            <select 
                name="nivel_actividad" 
                value={formData.nivel_actividad}
                onChange={handleChange} 
                className="w-full rounded-md border-gray-300 border p-2 bg-white mb-2"
            >
              <option value="sedentario">Sedentario</option>
              <option value="ligero">Ligero</option>
              <option value="moderado">Moderado</option>
              <option value="intenso">Intenso</option>
              <option value="muy_intenso">Muy Intenso</option>
            </select>

            {/* AQUÍ ESTÁ LA MAGIA: Texto dinámico de ayuda */}
            <p className="text-sm text-indigo-600 bg-indigo-50 p-2 rounded border border-indigo-100">
                ℹ️ {DESCRIPCIONES[formData.nivel_actividad]}
            </p>
        </div>

        <button 
          type="submit" 
          className="w-full py-3 px-4 rounded-md shadow-md text-white font-bold bg-indigo-600 hover:bg-indigo-700 transition-colors disabled:bg-gray-400"
          disabled={loading}
        >
          {loading ? 'Calculando...' : 'Obtener mi Plan'}
        </button>
      </form>

      {/* RESULTADOS */}
      {resultado && (
        <div className="mt-8 p-6 bg-green-50 rounded-xl border border-green-200 animate-fade-in">
          <h3 className="text-xl font-bold text-green-800 text-center mb-2">Objetivo Diario</h3>
          
          <div className="flex justify-center items-end mb-6">
            <span className="text-5xl font-black text-green-600">{resultado.calorias_diarias}</span>
            <span className="text-lg text-green-700 ml-2 mb-2 font-medium">kcal</span>
          </div>

          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="bg-white p-3 rounded-lg shadow-sm border border-green-100">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Proteína</p>
              <p className="text-xl font-bold text-blue-600">{resultado.macros.proteinas}g</p>
            </div>
            <div className="bg-white p-3 rounded-lg shadow-sm border border-green-100">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Carbos</p>
              <p className="text-xl font-bold text-orange-600">{resultado.macros.carbohidratos}g</p>
            </div>
            <div className="bg-white p-3 rounded-lg shadow-sm border border-green-100">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Grasas</p>
              <p className="text-xl font-bold text-yellow-600">{resultado.macros.grasas}g</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}