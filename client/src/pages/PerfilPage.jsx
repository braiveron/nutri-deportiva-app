import { useState, useEffect } from "react";
import Calculator from "../components/Calculator";

// FRASES
const MOTIVATIONAL_QUOTES = [
  { text: "NO PARES", sub: "CUANDO ESTÉS CANSADO", end: "PARA CUANDO TERMINES" },
  { text: "TU CUERPO", sub: "ES EL ÚNICO LUGAR", end: "QUE TIENES PARA VIVIR" },
  { text: "LA DISCIPLINA", sub: "ES EL PUENTE ENTRE", end: "METAS Y LOGROS" },
  { text: "CADA COMIDA", sub: "ES UNA OPORTUNIDAD", end: "PARA NUTRIRTE" },
];

export default function PerfilPage({ initialData, onCalcSuccess, userId }) {
  
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % MOTIVATIONAL_QUOTES.length);
    }, 5000); 
    return () => clearInterval(interval);
  }, []);

  const quote = MOTIVATIONAL_QUOTES[currentIndex];

  return (
    // 1. CONTENEDOR PRINCIPAL
    // Usamos min-h-screen y flex-col justify-center para centrar verticalmente todo el bloque
    <div className="w-full min-h-[calc(100vh-80px)] bg-gray-50 flex flex-col items-center justify-center py-10 animate-fade-in overflow-hidden">

      {/* 2. GRID / FLEX ROW MAESTRO */}
      {/* Esto crea la fila horizontal: [FraseIzq] - [Calculadora] - [FraseDer] */}
      <div className="w-full max-w-[1600px] mx-auto flex flex-row items-center justify-center px-4 md:px-8">

        {/* --- COLUMNA IZQUIERDA (Círculo Celeste Izquierdo) --- */}
        {/* hidden xl:flex: Solo visible en pantallas muy anchas (Desktop) donde hay hueco real.
            justify-end: Empuja el texto hacia la calculadora.
        */}
        <div className="hidden xl:flex flex-1 justify-end pr-8 select-none pointer-events-none">
            <div className="text-right max-w-[250px] animate-fade-in">
                {/* Línea decorativa apuntando al centro */}
                <div className="w-16 h-1 bg-gray-300 mb-4 ml-auto rounded-full"></div>
                
                <h3 className="text-5xl font-black italic text-gray-200 leading-[0.85] tracking-tighter mb-2">
                    {quote.text}
                </h3>
                <p className="text-xs font-bold text-gray-300 uppercase tracking-[0.3em]">
                    {quote.sub}
                </p>
            </div>
        </div>

        {/* --- COLUMNA CENTRAL (Tu Calculadora Intacta) --- */}
        {/* shrink-0 evita que la calculadora se aplaste */}
        <div className="shrink-0 relative z-10 w-full md:w-auto"> 
            
            {/* WRAPPER LIMITADOR (El mismo de antes) */}
            <div className="w-full max-w-md md:max-w-none flex flex-col items-center">
                
                {/* TÍTULO (Mantenido aquí para que esté siempre sobre la calculadora) */}
                <div className="text-center mb-6 md:mb-8">
                    <h2 className="text-3xl font-display font-bold text-sportDark italic">
                    TU <span className="text-sportRed">OBJETIVO</span>
                    </h2>
                    
                    {/* Línea móvil */}
                    <div className="h-1 w-12 bg-sportRed mx-auto my-2 rounded-full md:hidden"></div> 
                    
                    <p className="text-gray-400 text-[10px] font-bold tracking-widest uppercase mt-1">
                    Configura tus datos biométricos
                    </p>
                </div>

                {/* TU COMPONENTE */}
                <Calculator 
                    initialData={initialData} 
                    onCalculationSuccess={onCalcSuccess} 
                    userId={userId} 
                />
            </div>
        </div>

        {/* --- COLUMNA DERECHA (Círculo Celeste Derecho) --- */}
        {/* hidden xl:flex: Solo visible en Desktop.
            justify-start: Empuja el texto hacia la calculadora (desde el otro lado).
        */}
        <div className="hidden xl:flex flex-1 justify-start pl-8 select-none pointer-events-none">
            <div className="text-left max-w-[250px] animate-fade-in">
                {/* Línea decorativa apuntando desde el centro */}
                <div className="w-16 h-1 bg-sportRed mb-4 mr-auto rounded-full opacity-50"></div>

                <p className="text-5xl font-black text-sportRed/20 italic uppercase leading-[0.85] tracking-tight">
                    {quote.end}
                </p>
            </div>
        </div>

      </div>
    </div>
  );
}