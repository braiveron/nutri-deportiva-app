import Calculator from "./components/Calculator";

function App() {
  return (
    <div className="min-h-screen bg-gray-100 py-10 px-4">
      <div className="max-w-4xl mx-auto text-center mb-10">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          Planificador de <span className="text-indigo-600">Nutrición Deportiva</span>
        </h1>
        {/* Subtítulo limpio, enfocado en el beneficio físico */}
        <p className="text-lg text-gray-600">
          Optimiza tu rendimiento y composición corporal con un plan nutricional preciso.
        </p>
      </div>

      <Calculator />
      
    </div>
  );
}

export default App;