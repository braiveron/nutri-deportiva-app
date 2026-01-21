import { useState } from 'react';

const DESCRIPCIONES = {
  sedentario: "Oficina / Poco Movimiento",
  ligero: "1-3 días (Yoga, Caminata)",
  moderado: "3-5 días (Gym, Trote)",
  intenso: "6-7 días (CrossFit, Competencia)",
  muy_intenso: "Doble Turno / Atleta Élite"
};

export default function Calculator({ onCalculationSuccess }) {
  const [formData, setFormData] = useState({
    peso: '', altura: '', edad: '', genero: 'masculino', nivel_actividad: 'intenso'
  });
  
  // Estado local para mostrar la tarjeta aquí mismo
  const [resultadoLocal, setResultadoLocal] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/calcular-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          peso: Number(formData.peso), altura: Number(formData.altura),
          edad: Number(formData.edad), genero: formData.genero,
          nivel_actividad: formData.nivel_actividad, user_email: 'test@nutriaerea.com'
        }),
      });
      const data = await response.json();
      
      // 1. Guardamos el resultado LOCALMENTE para verlo en la tarjeta
      setResultadoLocal(data.plan);
      
      // 2. Avisamos al PADRE (App.jsx) para que active el Chef
      if(onCalculationSuccess) onCalculationSuccess(data.plan);

    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-5xl flex flex-col md:flex-row justify-center items-start gap-8 animate-fade-in relative z-20">
      
      {/* TARJETA FORMULARIO */}
      <div className="bg-white border-2 border-gray-200 shadow-2xl p-6 w-full max-w-md relative">
        <div className="absolute top-0 right-0 w-8 h-8 bg-gray-100 -z-10 transform rotate-45 translate-x-4 -translate-y-4"></div>

        <form onSubmit={handleSubmit} className="space-y-4">
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
                    <select name="genero" onChange={handleChange} className="w-full bg-gray-50 border border-gray-300 font-bold text-base px-3 py-2 focus:outline-none focus:border-sportRed cursor-pointer h-[46px]">
                    <option value="masculino">MASCULINO</option>
                    <option value="femenino">FEMENINO</option>
                    </select>
                </div>
            </div>

            <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Nivel de Actividad</label>
                <select name="nivel_actividad" value={formData.nivel_actividad} onChange={handleChange} 
                    className="w-full bg-gray-50 border border-gray-300 font-bold text-base px-3 py-2 focus:outline-none focus:border-sportRed cursor-pointer mb-1">
                  <option value="sedentario">SEDENTARIO</option>
                  <option value="ligero">LIGERO</option>
                  <option value="moderado">MODERADO</option>
                  <option value="intenso">INTENSO</option>
                  <option value="muy_intenso">MUY INTENSO</option>
                </select>
                <p className="text-[10px] font-bold text-sportRed uppercase text-right tracking-wide">
                   {DESCRIPCIONES[formData.nivel_actividad]}
                </p>
            </div>

            <button type="submit" disabled={loading}
              className="w-full py-3 bg-sportDark text-white font-display font-bold text-xl uppercase tracking-wider hover:bg-sportRed transition-colors shadow-lg disabled:opacity-50">
              {loading ? 'CALCULANDO...' : 'CALCULAR'}
            </button>
        </form>
      </div>

      {/* TARJETA RESULTADOS (Ahora usamos resultadoLocal para asegurar que se vea) */}
      {resultadoLocal && (
        <div className="bg-sportDark text-white p-6 w-full max-w-sm border-l-4 border-sportRed flex flex-col justify-center animate-fade-in shadow-2xl relative">
           
           <div className="text-center mb-6">
               <h3 className="text-gray-400 font-bold uppercase tracking-widest text-xs mb-2">Objetivo Diario</h3>
               <div className="flex items-center justify-center gap-1">
                  <span className="text-6xl font-display font-bold text-white italic">{resultadoLocal.calorias_diarias}</span>
                  <span className="text-lg font-bold text-sportRed">KCAL</span>
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
        </div>
      )}
    </div>
  );
}