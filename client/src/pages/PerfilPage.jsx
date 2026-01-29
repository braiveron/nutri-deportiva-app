import Calculator from "../components/Calculator";

export default function PerfilPage({ initialData, onCalcSuccess, userId }) {
  return (
    // max-w-md: Hace la columna más angosta (aprox el ancho de un celular grande)
    <div className="w-full flex flex-col items-center pt-10 pb-20 px-4 animate-fade-in">
      
      <div className="w-full max-w-md"> {/* Contenedor limitador */}
        
        {/* TÍTULO */}
        <div className="text-center mb-6">
            <h2 className="text-3xl font-display font-bold text-sportDark italic">
              TU <span className="text-sportRed">OBJETIVO</span>
            </h2>
            <div className="h-1 w-12 bg-sportRed mx-auto my-2 rounded-full"></div> {/* Pequeño detalle visual */}
            <p className="text-gray-400 text-[10px] font-bold tracking-widest uppercase">
              Configura tus datos biométricos
            </p>
        </div>

        {/* CALCULADORA (Al estar limitada por el padre, se verá centrada y alineada) */}
        <Calculator 
          initialData={initialData} 
          onCalculationSuccess={onCalcSuccess} 
          userId={userId} 
        />
        
      </div>
    </div>
  );
}