import { useState } from 'react'
import { supabase } from '../supabase'

export default function Auth() {
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [isLogin, setIsLogin] = useState(true)
  
  // Estados para mensajes visuales (Sin alerts)
  const [errorMessage, setErrorMessage] = useState(null)
  const [successMessage, setSuccessMessage] = useState(null)

  const traducirError = (msg) => {
    if (msg.includes("Error sending confirmation")) return "Demasiados intentos. Espera unos minutos.";
    if (msg.includes("User already registered")) return "Este email ya está registrado. Intenta iniciar sesión.";
    if (msg.includes("Invalid login credentials")) return "Email o contraseña incorrectos.";
    if (msg.includes("Password should be")) return "La contraseña debe tener al menos 6 caracteres.";
    return msg; 
  }

  const handleAuth = async (e) => {
    e.preventDefault()
    setLoading(true)
    setErrorMessage(null)   // Limpiamos errores previos
    setSuccessMessage(null) // Limpiamos éxitos previos

    let error;

    if (isLogin) {
      // --- INICIAR SESIÓN ---
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      error = signInError
    } else {
      // --- REGISTRARSE ---
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName, 
          },
        },
      })
      error = signUpError
    }

    if (error) {
      // Muestra caja ROJA
      setErrorMessage(traducirError(error.message))
    } else if (!isLogin) {
      // Muestra caja VERDE y cambia a login
      setSuccessMessage('¡Cuenta creada con éxito! Ya puedes iniciar sesión.')
      setIsLogin(true) 
    }
    
    setLoading(false)
  }

  // Función para resetear formulario al cambiar pestaña
  const switchMode = (mode) => {
    setIsLogin(mode)
    setErrorMessage(null)
    setSuccessMessage(null)
  }

  return (
    <div className="w-full max-w-md bg-white border-4 border-sportDark p-8 relative shadow-2xl animate-fade-in">
      
      {/* TÍTULO */}
      <div className="text-center mb-8">
        <h2 className="text-4xl font-display font-bold text-sportDark italic uppercase">
          ACCESO <span className="text-sportRed">USUARIOS</span>
        </h2>
        <p className="text-xs font-bold text-gray-400 tracking-widest uppercase mt-1">
          {isLogin ? 'Ingresa a tu cuenta' : 'Crea tu perfil personal'}
        </p>
      </div>

      {/* PESTAÑAS (LOGIN / REGISTRO) */}
      <div className="flex mb-6 border-b-2 border-gray-200">
        <button
          onClick={() => switchMode(true)}
          className={`w-1/2 py-2 text-sm font-bold uppercase tracking-wider transition-colors ${
            isLogin ? 'border-b-4 border-sportRed text-sportDark' : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          Entrar
        </button>
        <button
          onClick={() => switchMode(false)}
          className={`w-1/2 py-2 text-sm font-bold uppercase tracking-wider transition-colors ${
            !isLogin ? 'border-b-4 border-sportRed text-sportDark' : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          Registrarse
        </button>
      </div>

      {/* MENSAJE DE ÉXITO (VERDE) - Aparece arriba del formulario */}
      {successMessage && (
        <div className="mb-6 p-3 bg-green-50 border-l-4 border-green-500 text-green-800 text-sm font-bold text-center animate-fade-in">
          ✅ {successMessage}
        </div>
      )}

      {/* FORMULARIO */}
      <form onSubmit={handleAuth} className="space-y-5">
        
        {!isLogin && (
          <div className="animate-fade-in">
            <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Nombre Completo</label>
            <input
              type="text"
              placeholder="Ej: Juan Pérez"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full bg-gray-50 border-2 border-gray-300 font-bold text-lg px-3 py-3 focus:outline-none focus:border-sportRed focus:bg-white transition-colors"
              required={!isLogin}
            />
          </div>
        )}

        <div>
          <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Email</label>
          <input
            type="email"
            placeholder="usuario@ejemplo.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-gray-50 border-2 border-gray-300 font-bold text-lg px-3 py-3 focus:outline-none focus:border-sportRed focus:bg-white transition-colors"
            required
          />
        </div>
        
        <div>
          <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Contraseña</label>
          <input
            type="password"
            placeholder="********"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-gray-50 border-2 border-gray-300 font-bold text-lg px-3 py-3 focus:outline-none focus:border-sportRed focus:bg-white transition-colors"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 bg-sportDark text-white font-display font-bold text-xl uppercase tracking-wider hover:bg-sportRed transition-colors shadow-sport disabled:opacity-50"
        >
          {loading ? 'PROCESANDO...' : (isLogin ? 'INICIAR SESIÓN' : 'CREAR CUENTA')}
        </button>

        {/* MENSAJE DE ERROR (ROJO) - Aparece abajo si algo falla */}
        {errorMessage && (
          <div className="mt-4 p-3 bg-red-50 border-l-4 border-sportRed text-red-700 text-sm font-bold text-center animate-pulse">
            ⚠️ {errorMessage}
          </div>
        )}

      </form>
    </div>
  )
}