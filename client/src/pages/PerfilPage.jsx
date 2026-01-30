import Calculator from "../components/Calculator";

export default function PerfilPage({ initialData, onCalcSuccess, userId }) {
  return (
    // 1. CONTENEDOR PRINCIPAL
    // Móvil: pb-20 px-4 (Tu versión móvil)
    // Escritorio (md): pb-12 px-0 (Restauramos tu versión escritorio)
    <div className="w-full flex flex-col items-center pt-10 pb-20 px-4 md:pb-12 md:px-0 animate-fade-in">
      
      {/* 2. WRAPPER LIMITADOR
          Móvil: max-w-md (Para que se vea contenido y angosto en celular)
          Escritorio (md): max-w-none (Quitamos el límite para que se vea como en tu versión original) 
      */}
      <div className="w-full max-w-md md:max-w-none md:flex md:flex-col md:items-center"> 
        
        {/* TÍTULO */}
        {/* Móvil: mb-6 | Escritorio: mb-8 */}
        <div className="text-center mb-6 md:mb-8">
            <h2 className="text-3xl font-display font-bold text-sportDark italic">
              TU <span className="text-sportRed">OBJETIVO</span>
            </h2>
            
            {/* LÍNEA DECORATIVA ROJA
                Solo visible en móvil. En escritorio (md:hidden) desaparece para respetar tu diseño original.
            */}
            <div className="h-1 w-12 bg-sportRed mx-auto my-2 rounded-full md:hidden"></div> 
            
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
    </div>
  );
}