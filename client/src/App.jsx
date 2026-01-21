import { useState, useEffect } from "react";
import { supabase } from "./supabase"; 
import Calculator from "./components/Calculator";
import RecipeChef from "./components/RecipeChef";
import Auth from "./components/Auth";

function App() {
  const [session, setSession] = useState(null);
  const [userMacros, setUserMacros] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleCalculationSuccess = (plan) => {
    setUserMacros(plan);
    setTimeout(() => {
        window.scrollTo({ top: window.innerHeight * 0.8, behavior: 'smooth' });
    }, 500);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUserMacros(null); 
  };

  if (!session) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center p-4">
        <div className="text-center mb-8">
            <h1 className="text-6xl font-display font-bold text-sportDark tracking-tighter italic">
            NUTRI<span className="text-sportRed">SPORT</span>
            </h1>
        </div>
        <Auth />
      </div>
    );
  }

  // Obtenemos el nombre del usuario desde los metadatos de Supabase
  // Si no tiene nombre (usuarios viejos), usamos "Atleta" por defecto
  const userName = session.user.user_metadata.full_name || "Atleta";

  return (
    <div className="min-h-screen w-full flex flex-col items-center py-10 px-4 overflow-x-hidden relative">
      
      {/* BARRA SUPERIOR: Saludo + Logout */}
      <div className="absolute top-4 right-4 flex items-center gap-4 z-50">
        <span className="text-sm font-bold text-sportDark uppercase tracking-wider hidden md:block">
          Hola, <span className="text-sportRed">{userName}</span>
        </span>
        <button 
          onClick={handleLogout}
          className="text-xs font-bold text-gray-400 hover:text-sportRed uppercase tracking-widest border border-gray-300 px-3 py-1 hover:border-sportRed transition-colors bg-white/80 backdrop-blur-sm"
        >
          Salir
        </button>
      </div>

      <div className="w-full min-h-[90vh] flex flex-col items-center justify-center mb-10">
        <div className="text-center mb-8 z-10">
          <h1 className="text-5xl md:text-8xl font-display font-bold text-sportDark tracking-tighter leading-none italic">
            NUTRI<span className="text-sportRed">SPORT</span>
          </h1>
          <p className="text-sm md:text-base text-gray-500 font-medium tracking-widest mt-2 uppercase">
            Bienvenido a tu panel
          </p>
        </div>

        <Calculator onCalculationSuccess={handleCalculationSuccess} />
        
        {!userMacros && (
            <div className="mt-12 animate-bounce text-gray-400">
                <span className="text-2xl">⬇</span>
            </div>
        )}
      </div>

      {userMacros && (
        <div className="w-full flex justify-center border-t-2 border-gray-200 pt-10">
            <RecipeChef macros={userMacros} />
        </div>
      )}

    </div>
  );
}

export default App;