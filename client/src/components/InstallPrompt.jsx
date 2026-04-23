/* eslint-disable */
// @ts-nocheck
import React, { useState, useEffect } from 'react';

export default function InstallPrompt() {
  const [data, setData] = useState({ s: false, p: '' });

/*   useEffect(() => {
    const win = window;
    const isS = win.matchMedia('(display-mode: standalone)').matches || win.navigator.standalone;
    
    if (isS) return;

    const nav = win.navigator;
    const a = nav.userAgent.toLowerCase();
    
    if (/iphone|ipad|ipod/.test(a)) {
      // @ts-ignore
      setData({ s: true, p: 'ios' });
    } else if (/android/.test(a)) {
      const h = (e) => {
        e.preventDefault();
        // @ts-ignore
        setData({ s: true, p: 'android' });
      };
      win.addEventListener('beforeinstallprompt', h);
      return () => win.removeEventListener('beforeinstallprompt', h);
    }
  }, []); */

  useEffect(() => {
  // COMENTÁ TODO LO DEMÁS TEMPORALMENTE Y PONÉ ESTO:
  setData({ s: true, p: 'android' }); 

  /* const handler = (e) => {
    e.preventDefault();
    deferredPrompt.current = e;
    ...
  };
  */
}, []);

  if (!data.s) return null;

  return (
    <div className="fixed bottom-6 left-4 right-4 bg-white shadow-2xl rounded-2xl p-5 border-t-4 border-[#E31B23] z-[999] animate-fade-in-up">
      <div className="flex items-start gap-4 text-left">
        <div className="bg-gray-900 text-white p-3 rounded-xl text-2xl shadow-lg">📲</div>
        <div className="flex-1">
          <h4 className="font-black text-gray-900 uppercase italic tracking-tighter text-sm">¿Instalar NutriSport?</h4>
          <p className="text-[11px] text-gray-600 font-medium">Acceso directo desde tu inicio.</p>
          <div className="mt-2 p-2 bg-gray-50 rounded-lg text-[10px] text-gray-800 border border-gray-100">
            {data.p === 'ios' ? (
              <p>Tocá <strong>Compartir</strong> y luego <strong>"Agregar al inicio"</strong>.</p>
            ) : (
              <p>Tocá los <strong>3 puntos</strong> y elegí <strong>"Instalar aplicación"</strong>.</p>
            )}
          </div>
        </div>
        <button 
          onClick={() => setData({ ...data, s: false })} 
          className="text-gray-400 p-1 text-lg"
        >
          ✕
        </button>
      </div>
    </div>
  );
}