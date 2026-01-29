import Calculator from "../components/Calculator";

export default function PerfilPage({ initialData, onCalcSuccess, userId }) {
  return (
    // 👇 SOLUCIÓN:
    // 1. Quitamos la altura fija (h-screen...) para eliminar el doble scroll.
    // 2. Usamos 'pt-10' para bajarlo un poco del navbar y que no quede pegado.
    // 3. 'w-full' asegura el ancho, el footer se encargará de estar abajo solo.
    <div className="flex flex-col items-center pt-10 pb-20 animate-fade-in w-full">
      
      {/* TÍTULO */}
      <div className="text-center mb-8">
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