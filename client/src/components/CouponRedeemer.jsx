import { useState } from "react";
import { api } from "../services/api"; // Asumiendo que tenés tu instancia de API acá

export default function CouponRedeemer({ userId, onUpdate }) {
  const [coupon, setCoupon] = useState("");
  const [status, setStatus] = useState({ loading: false, msg: "", error: false });

  const handleRedeem = async () => {
    if (!coupon.trim()) return;
    
    setStatus({ loading: true, msg: "Validando...", error: false });

    try {
      // Llamada a tu backend (asegurate de tener esta ruta en tu api.js o usá fetch)
      const res = await api.redeemCoupon(userId, coupon.toUpperCase());

      if (res.success) {
        setStatus({ loading: false, msg: res.message, error: false });
        setCoupon("");
        
        // 🔥 CRÍTICO: Esta función 'onUpdate' debe refrescar los datos 
        // del usuario en el estado global para que el candado desaparezca.
        if (onUpdate) setTimeout(() => onUpdate(), 1500); 
      } else {
        setStatus({ loading: false, msg: res.error || "Código inválido", error: true });
      }
    } catch (err) {
        console.error("Error al canjear cupón:", err);
      setStatus({ loading: false, msg: "Error de conexión", error: true });
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mt-4">
      <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4">
        ¿Tenés un Cupón?
      </h3>
      
      <div className="flex gap-2">
        <input
        autofocus
  type="text"
  placeholder="EJ: PROMO7DIAS"
  value={coupon}
  onChange={(e) => setCoupon(e.target.value)}
  // Agregamos "text-gray-900" para asegurar visibilidad 
  // y "bg-white" para que no herede transparencias
  className="flex-1 p-3 rounded-xl border border-gray-200 bg-white text-gray-900 focus:ring-2 focus:ring-sportRed focus:outline-none uppercase font-bold"
/>
        <button
          onClick={handleRedeem}
          disabled={status.loading || !coupon}
          className="bg-sportDark text-white px-6 py-3 rounded-xl font-bold hover:bg-black transition-all disabled:opacity-50"
        >
          {status.loading ? "..." : "Canjear"}
        </button>
      </div>

      {status.msg && (
        <p className={`mt-3 text-xs font-bold ${status.error ? "text-red-500" : "text-green-600 animate-bounce"}`}>
          {status.msg}
        </p>
      )}
    </div>
  );
}