import { useState, useEffect, useRef } from 'react'; 
import { useNavigate } from 'react-router-dom'; 

const DESCRIPCIONES = {
  sedentario: "Oficina / Poco Movimiento",
  ligero: "1-3 días (Yoga, Caminata)",
  moderado: "3-5 días (Gym, Trote)",
  intenso: "6-7 días (CrossFit, Competencia)",
  muy_intenso: "Doble Turno / Atleta Élite"
};

const sonDatosDiferentes = (data1, data2) => {
    if (!data1 || !data2) return true;
    return (
        data1.peso != data2.peso ||         
        data1.altura != data2.altura ||
        data1.edad != data2.edad ||
        data1.genero !== data2.genero 
    );
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
  const [dataLoaded, setDataLoaded] = useState(false);
  const [lastSavedData, setLastSavedData] = useState(null);
  const [menuAbierto, setMenuAbierto] = useState(false);

  const ignoreClickRef = useRef(false);

  // EFECTO 1: Carga inicial
  useEffect(() => {
    if (initialData && !dataLoaded) {
      const incomingData = {
        peso: initialData.weight_kg || '',
        altura: initialData.height_cm || '',
        edad: initialData.age || '', 
        genero: initialData.gender || 'masculino',
        nivel_actividad: initialData.activity_level || 'moderado',
        objetivo: initialData.goal || 'mantener' 
      };

      setFormData(incomingData);
      setLastSavedData(incomingData);

      if (initialData.target_macros) {
        if (initialData.target_macros.todos_los_planes) {
            setTodosLosPlanes(initialData.target_macros.todos_los_planes);
            const objetivoGuardado = initialData.goal || 'mantener';
            setResultadoLocal(initialData.target_macros.todos_los_planes[objetivoGuardado]);
        } else {
            setResultadoLocal(initialData.target_macros);
        }
      }
      setDataLoaded(true);
    }
  }, [initialData, dataLoaded]);

  // EFECTO 2: Cambio Dinámico de Objetivo
  useEffect(() => {
    if (todosLosPlanes && formData.objetivo) {
        const nuevoPlan = todosLosPlanes[formData.objetivo];
        if (nuevoPlan) {
            setResultadoLocal(nuevoPlan);
            if(onCalculationSuccess) onCalculationSuccess(nuevoPlan);
        }
    }
  },     // eslint-disable-next-line react-hooks/exhaustive-deps
[formData.objetivo, todosLosPlanes]); 

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  // 👇 FUNCIÓN ACTUALIZADA Y CORREGIDA
  const realizarCalculo = async (datosParaCalcular, esManual = false) => {
    
    // 1. VALIDACIÓN
    if (!datosParaCalcular.peso || !datosParaCalcular.altura || !datosParaCalcular.edad) {
        console.warn("Intento de cálculo incompleto (silenciado)");
        return; 
    }

    setLoading(true);
    try {
      // Intentamos conectar al servidor
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

      if (!response.ok) {
        throw new Error(`Error del Servidor: ${response.status}`);
      }

      const data = await response.json();
      
      // Verificamos que la respuesta tenga sentido
      if (!data || !data.plan) {
         throw new Error("Respuesta vacía del servidor");
      }

      setLastSavedData(datosParaCalcular);

      if (data.plan.todos_los_planes) {
          // CASO A: Respuesta con múltiples planes
          setTodosLosPlanes(data.plan.todos_los_planes);
          const planActual = data.plan.todos_los_planes[datosParaCalcular.objetivo];
          setResultadoLocal(planActual);
          
          // Notificar al padre (Gráfico)
          if(onCalculationSuccess) onCalculationSuccess(planActual);
      } else {
          // CASO B: Respuesta con un único plan
          setResultadoLocal(data.plan);
          
          // 👇 ESTA ES LA LÍNEA QUE FALTABA PARA QUE EL GRÁFICO NO DESAPAREZCA
          if(onCalculationSuccess) onCalculationSuccess(data.plan);
      }

    } catch (error) {
      console.error("Error en cálculo:", error);
      // Solo mostramos alerta si fue un click manual
      if (esManual) {
         alert("Error al calcular: Verifica que el servidor (Backend) esté funcionando.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.peso || !formData.altura || !formData.edad) {
        alert("Por favor completa Peso, Altura y Edad antes de calcular.");
        return;
    }
    // Pasamos true para indicar que fue un click manual y queremos ver alertas de error
    realizarCalculo(formData, true);
  };

  // --- LÓGICA VISUAL MENÚS ---
  const handleSelectFocus = () => {
    setMenuAbierto(true);
    ignoreClickRef.current = true; 
  };

  const handleSelectBlur = () => {
    setMenuAbierto(false);
    ignoreClickRef.current = false;
  };

  const handleSelectClick = (e) => {
    if (ignoreClickRef.current) {
        ignoreClickRef.current = false;
        return;
    }
    e.target.blur();
    setMenuAbierto(false);
  };

  const handleObjetivoChange = (e) => {
    e.target.blur();
    handleChange(e);       
  };

  const handleGeneroChange = (e) => {
    const nuevoGenero = e.target.value;
    e.target.blur();
    setFormData(prev => ({ ...prev, genero: nuevoGenero }));
    if (formData.peso && formData.altura && formData.edad) {
        realizarCalculo({ ...formData, genero: nuevoGenero });
    }
  };

  const handleActivityChange = (e) => {
    const nuevaActividad = e.target.value;
    e.target.blur();
    setFormData(prev => ({ ...prev, nivel_actividad: nuevaActividad }));
    if (formData.peso && formData.altura && formData.edad) {
        realizarCalculo({ ...formData, nivel_actividad: nuevaActividad });
    }
  };

  const irALaCocina = () => {
    navigate('/cocina'); 
  };

  const datosDesactualizados = sonDatosDiferentes(formData, lastSavedData);
  const debeEstarBorrosa = loading || datosDesactualizados || menuAbierto;

  return (
    <div className="w-full max-w-5xl flex flex-col md:flex-row justify-center items-start gap-8 animate-fade-in relative z-20">
      
      {/* TARJETA FORMULARIO */}
      <div className="bg-white border-2 border-gray-200 shadow-2xl p-6 w-full max-w-md relative">
        <div className="absolute top-0 right-0 w-8 h-8 bg-gray-100 -z-10 transform rotate-45 translate-x-4 -translate-y-4"></div>

        <form onSubmit={handleSubmit} className="space-y-4">
            
            <div className="mb-4">
                <label className="text-xs font-bold text-sportRed uppercase block mb-1">¿Cuál es tu objetivo?</label>
                <select 
                    name="objetivo" 
                    value={formData.objetivo} 
                    onChange={handleObjetivoChange}
                    onClick={handleSelectClick}
                    onFocus={handleSelectFocus}
                    onBlur={handleSelectBlur}
                    className="w-full border-2 border-sportRed/20 bg-red-50 p-2 font-bold text-sportDark focus:border-sportRed focus:outline-none transition-all hover:bg-red-100 cursor-pointer"
                >
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
                    <select 
                        name="genero" 
                        value={formData.genero} 
                        onChange={handleGeneroChange} 
                        onClick={handleSelectClick}
                        onFocus={handleSelectFocus}
                        onBlur={handleSelectBlur}
                        className="w-full bg-gray-50 border border-gray-300 font-bold text-base px-3 py-2 focus:outline-none focus:border-sportRed cursor-pointer h-[46px]"
                    >
                        <option value="masculino">HOMBRE</option>
                        <option value="femenino">MUJER</option>
                    </select>
                </div>
            </div>

            <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Nivel de Actividad</label>
                <select 
                    name="nivel_actividad" 
                    value={formData.nivel_actividad} 
                    onChange={handleActivityChange} 
                    onClick={handleSelectClick}
                    onFocus={handleSelectFocus}
                    onBlur={handleSelectBlur}
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
        <div 
            className={`bg-sportDark text-white p-6 w-full max-w-sm border-l-4 border-sportRed flex flex-col justify-center animate-fade-in shadow-2xl relative transition-all duration-300 
            ${debeEstarBorrosa ? 'blur-sm opacity-60 pointer-events-none' : 'blur-0 opacity-100'}
            `}
        >
           {loading && (
             <div className="absolute inset-0 z-50 flex items-center justify-center">
                 <span className="text-white font-bold uppercase tracking-widest text-sm animate-pulse">Actualizando...</span>
             </div>
           )}

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