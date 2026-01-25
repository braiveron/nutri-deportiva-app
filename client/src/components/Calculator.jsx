import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; 

const DESCRIPCIONES = {
  sedentario: "Oficina / Poco Movimiento",
  ligero: "1-3 días (Yoga, Caminata)",
  moderado: "3-5 días (Gym, Trote)",
  intenso: "6-7 días (CrossFit, Competencia)",
  muy_intenso: "Doble Turno / Atleta Élite"
};

export default function Calculator({ onCalculationSuccess, initialData, userId }) {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    peso: '', altura: '', edad: '', genero: 'masculino', nivel_actividad: 'moderado', 
    objetivo: 'mantener' 
  });
  
  const [resultadoLocal, setResultadoLocal] = useState(null);
  const [todosLosPlanes, setTodosLosPlanes] = useState(null);
  const [loading, setLoading] = useState(false);

  // EFECTO 1: Cargar datos iniciales
  useEffect(() => {
    if (initialData) {
      setFormData({
        peso: initialData.weight_kg || '',
        altura: initialData.height_cm || '',
        edad: initialData.age || '', 
        genero: initialData.gender || 'masculino',
        nivel_actividad: initialData.activity_level || 'moderado',
        objetivo: initialData.goal || 'mantener' 
      });

      if (initialData.target_macros) {
        if (initialData.target_macros.todos_los_planes) {
            setTodosLosPlanes(initialData.target_macros.todos_los_planes);
            const objetivoGuardado = initialData.goal || 'mantener';
            setResultadoLocal(initialData.target_macros.todos_los_planes[objetivoGuardado]);
        } else {
            setResultadoLocal(initialData.target_macros);
        }
      }
    }
  }, [initialData]);

  // EFECTO 2: Cambio Dinámico de Objetivo (Filtrado Local)
  useEffect(() => {
    if (todosLosPlanes && formData.objetivo) {
        const nuevoPlan = todosLosPlanes[formData.objetivo];
        if (nuevoPlan) {
            setResultadoLocal(nuevoPlan);
            if(onCalculationSuccess) onCalculationSuccess(nuevoPlan);
        }
    }
  }, 
      // eslint-disable-next-line react-hooks/exhaustive-deps
  [formData.objetivo, todosLosPlanes]);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  // ⚡ LÓGICA CENTRAL DE CÁLCULO (Extraída para reutilizar)
  const realizarCalculo = async (datosParaCalcular) => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/calcular-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userId, 
          peso: Number(datosParaCalcular.peso), 
          altura: Number(datosParaCalcular.altura),
          edad: Number(datosParaCalcular.edad), 
          genero: datosParaCalcular.genero,
          nivel_actividad: datosParaCalcular.nivel_actividad,
          objetivo: datosParaCalcular.objetivo
        }),
      });

      if (!response.ok) throw new Error(`Error: ${response.status}`);

      const data = await response.json();
      
      if (data.plan.todos_los_planes) {
          setTodosLosPlanes(data.plan.todos_los_planes);
          const planActual = data.plan.todos_los_planes[datosParaCalcular.objetivo];
          setResultadoLocal(planActual);
          if(onCalculationSuccess) onCalculationSuccess(planActual);
      } else {
          setResultadoLocal(data.plan);
      }

    } catch (error) {
      console.error(error);
      alert("Faltan datos para calcular.");
    } finally {
      setLoading(false);
    }
  };

  // Manejador del botón manual
  const handleSubmit = (e) => {
    e.preventDefault();
    realizarCalculo(formData);
  };

  // 👇 NUEVO: Manejador Automático para Actividad
  const handleActivityChange = (e) => {
    const nuevaActividad = e.target.value;
    
    // 1. Actualizamos el estado visual
    setFormData(prev => ({ ...prev, nivel_actividad: nuevaActividad }));
    
    // 2. Disparamos el cálculo AUTOMÁTICAMENTE con el nuevo valor
    // (Usamos un objeto temporal porque el estado 'formData' aún no se ha actualizado)
    if (formData.peso && formData.altura && formData.edad) {
        realizarCalculo({ ...formData, nivel_actividad: nuevaActividad });
    }
  };

  const irALaCocina = () => {
    navigate('/cocina'); 
  };

  return (
    <div className="w-full max-w-5xl flex flex-col md:flex-row justify-center items-start gap-8 animate-fade-in relative z-20">
      
      {/* TARJETA FORMULARIO */}
      <div className="bg-white border-2 border-gray-200 shadow-2xl p-6 w-full max-w-md relative">
        <div className="absolute top-0 right-0 w-8 h-8 bg-gray-100 -z-10 transform rotate-45 translate-x-4 -translate-y-4"></div>

        <form onSubmit={handleSubmit} className="space-y-4">
            
            <div className="mb-4">
                <label className="text-xs font-bold text-sportRed uppercase block mb-1">¿Cuál es tu objetivo?</label>
                <select name="objetivo" value={formData.objetivo} onChange={handleChange} 
                    className="w-full border-2 border-sportRed/20 bg-red-50 p-2 font-bold text-sportDark focus:border-sportRed focus:outline-none transition-all hover:bg-red-100 cursor-pointer">
                  <option value="perder">🔥 PERDER GRASA (Déficit)</option>
                  <option value="mantener">⚖️ MANTENER PESO</option>
                  <option value="ganar">💪 GANAR MÚSCULO (Volumen)</option>
                </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Peso (kg)</label>
                <input type="number" name="peso" placeholder="70" value={formData.peso} onChange={handleChange}
                  className="w-full bg-gray-50 border border-gray-300 font-bold text-lg px-3 py-2 focus:outline-none focus:border-sportRed focus:bg-white transition-colors" required />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Altura (cm)</label>
                <input type="number" name="altura" placeholder="175" value={formData.altura} onChange={handleChange}
                  className="w-full bg-gray-50 border border-gray-300 font-bold text-lg px-3 py-2 focus:outline-none focus:border-sportRed focus:bg-white transition-colors" required />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="text-xs font-bold text-gray-500 uppercase">Edad</label>
                    <input type="number" name="edad" placeholder="25" value={formData.edad} onChange={handleChange}
                    className="w-full bg-gray-50 border border-gray-300 font-bold text-lg px-3 py-2 focus:outline-none focus:border-sportRed focus:bg-white transition-colors" required />
                </div>
                <div>
                    <label className="text-xs font-bold text-gray-500 uppercase">Género</label>
                    <select name="genero" value={formData.genero} onChange={handleChange} className="w-full bg-gray-50 border border-gray-300 font-bold text-base px-3 py-2 focus:outline-none focus:border-sportRed cursor-pointer h-[46px]">
                    <option value="masculino">HOMBRE</option>
                    <option value="femenino">MUJER</option>
                    </select>
                </div>
            </div>

            <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Nivel de Actividad</label>
                {/* 👇 AQUÍ USAMOS EL NUEVO MANEJADOR AUTOMÁTICO */}
                <select 
                    name="nivel_actividad" 
                    value={formData.nivel_actividad} 
                    onChange={handleActivityChange} 
                    className="w-full bg-gray-50 border border-gray-300 font-bold text-base px-3 py-2 focus:outline-none focus:border-sportRed cursor-pointer mb-1"
                >
                  <option value="sedentario">SEDENTARIO</option>
                  <option value="ligero">LIGERO</option>
                  <option value="moderado">MODERADO</option>
                  <option value="intenso">INTENSO</option>
                  <option value="muy_intenso">MUY INTENSO</option>
                </select>
                <p className="text-[10px] font-bold text-gray-400 uppercase text-right tracking-wide">
                   {DESCRIPCIONES[formData.nivel_actividad]}
                </p>
            </div>

            <button type="submit" disabled={loading}
              className="w-full py-3 bg-sportDark text-white font-display font-bold text-xl uppercase tracking-wider hover:bg-sportRed transition-colors shadow-lg disabled:opacity-50">
              {loading ? 'CALCULANDO...' : 'CALCULAR PLAN'}
            </button>
        </form>
      </div>

      {/* TARJETA RESULTADOS */}
      {resultadoLocal && (
        <div className="bg-sportDark text-white p-6 w-full max-w-sm border-l-4 border-sportRed flex flex-col justify-center animate-fade-in shadow-2xl relative">
           
           <div className="text-center mb-6">
               <h3 className="text-gray-400 font-bold uppercase tracking-widest text-xs mb-2">Objetivo Diario</h3>
               <div className="flex items-center justify-center gap-1">
                  <span className="text-6xl font-display font-bold text-white italic">{resultadoLocal.calorias_diarias}</span>
                  <span className="text-lg font-bold text-sportRed">KCAL</span>
               </div>
               
               <div className={`mt-2 inline-block px-3 py-1 rounded text-[10px] uppercase font-bold tracking-widest transition-colors ${
                 formData.objetivo === 'perder' ? 'bg-red-500/20 text-red-400' :
                 formData.objetivo === 'ganar' ? 'bg-green-500/20 text-green-400' :
                 'bg-blue-500/20 text-blue-400'
               }`}>
                    {formData.objetivo === 'perder' && '📉 Déficit Calórico'}
                    {formData.objetivo === 'mantener' && '⚖️ Mantenimiento'}
                    {formData.objetivo === 'ganar' && '📈 Superávit'}
               </div>

               <div className="mt-2 text-[10px] text-gray-500 font-bold uppercase tracking-widest border-t border-gray-800 pt-2">
                  Considerando actividad:<br/>
                  <span className="text-gray-300">{DESCRIPCIONES[formData.nivel_actividad]}</span>
               </div>
           </div>

           <div className="space-y-4">
              <div className="flex justify-between items-center border-b border-gray-700 pb-2">
                  <span className="text-sm font-bold text-gray-400 uppercase">Proteína</span>
                  <span className="text-xl font-display font-bold text-blue-400">{resultadoLocal.macros.proteinas}g</span>
              </div>
              <div className="flex justify-between items-center border-b border-gray-700 pb-2">
                  <span className="text-sm font-bold text-gray-400 uppercase">Carbos</span>
                  <span className="text-xl font-display font-bold text-sportRed">{resultadoLocal.macros.carbohidratos}g</span>
              </div>
              <div className="flex justify-between items-center border-b border-gray-700 pb-2">
                  <span className="text-sm font-bold text-gray-400 uppercase">Grasas</span>
                  <span className="text-xl font-display font-bold text-yellow-500">{resultadoLocal.macros.grasas}g</span>
              </div>
           </div>

           <button 
             onClick={irALaCocina} 
             className="mt-8 w-full group flex items-center justify-center gap-2 py-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-sportRed transition-all rounded-sm text-xs font-bold uppercase tracking-widest text-gray-300 hover:text-white"
           >
             <span>Ir a mi Chef Personal</span>
             <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 transform group-hover:translate-x-1 transition-transform text-sportRed" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
             </svg>
           </button>

        </div>
      )}
    </div>
  );
}