import Calculator from "../components/Calculator";

export default function PerfilPage({ initialData, onCalcSuccess, userId }) {
  return (
    // 👇 CAMBIO CLAVE: h-[calc(100vh-100px)] fuerza a ocupar solo el espacio visible (restando navbar)
    // flex-col justify-center items-center: centra todo el contenido vertical y horizontalmente
    <div className="flex flex-col justify-center items-center h-[calc(100vh-100px)] animate-fade-in w-full">
      
      {/* TÍTULO MÁS COMPACTO Y PEGADO */}
      <div className="text-center mb-4">
          <h2 className="text-3xl font-display font-bold text-sportDark italic">
            TU <span className="text-sportRed">OBJETIVO</span>
          </h2>
          <p className="text-gray-400 text-[10px] font-bold tracking-widest uppercase mt-1">
            Configura tus datos biométricos
          </p>
      </div>

      {/* CALCULADORA */}
      <Calculator 
        initialData={initialData} 
        onCalculationSuccess={onCalcSuccess} 
        userId={userId} 
      />
    </div>
  );
}