import { useState } from "react";
import { api } from "../services/api"; // Asumiendo que tenés tu instancia de API acá

export default function CouponRedeemer({ userId, onUpdate }) {
  const [coupon, setCoupon] = useState("");
  const [status, setStatus] = useState({ loading: false, msg: "", error: false });

  const handleRedeem = async () => {
    if (!coupon.trim()) return;
    
    setStatus({ loading: true, msg: "Validando...", error: false });

    try {
      // Llamada a tu backend
      const res = await api.redeemCoupon(userId, coupon.toUpperCase());

      if (res.success) {
        setStatus({ loading: false, msg: res.message, error: false });
        setCoupon("");
        
        // 🔥 CRÍTICO: Refrescar datos globales
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
    /* Ajustado: w-full y mx-auto para asegurar centrado en móviles */
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mt-4 w-full max-w-sm mx-auto relative z-50">
      <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4 text-center">
        ¿Tenés un Cupón?
      </h3>
      
      {/* Corregido: flex-col en móvil y flex-row en escritorio para evitar desfases */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          autoFocus
          type="text"
          placeholder="EJ: PROMO7DIAS"
          value={coupon}
          onChange={(e) => setCoupon(e.target.value)}
          className="flex-1 p-3 rounded-xl border border-gray-200 bg-white text-gray-900 focus:ring-2 focus:ring-sportRed focus:outline-none uppercase font-bold text-center sm:text-left"
        />
        <button
          onClick={handleRedeem}
          disabled={status.loading || !coupon}
          className="bg-sportDark text-white px-6 py-3 rounded-xl font-bold hover:bg-black transition-all disabled:opacity-50 w-full sm:w-auto"
        >
          {status.loading ? "..." : "Canjear"}
        </button>
      </div>

      {status.msg && (
        <p className={`mt-3 text-xs font-bold text-center ${status.error ? "text-red-500" : "text-green-600 animate-bounce"}`}>
          {status.msg}
        </p>
      )}
    </div>
  );
}