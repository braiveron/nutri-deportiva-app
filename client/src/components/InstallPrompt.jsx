/* eslint-disable */
// @ts-nocheck
import React, { useState, useEffect, useRef } from 'react';

export default function InstallPrompt() {
  const [data, setData] = useState({ s: false, p: '' });
  const deferredPrompt = useRef(null);

  useEffect(() => {
    const win = window;
    
    // --- 🛡️ DOBLE CANDADO DE VERIFICACIÓN ---
    const checkIsInstalled = () => {
      return (
        win.matchMedia('(display-mode: standalone)').matches || // Android/Chrome
        win.navigator.standalone || // iOS Safari
        document.referrer.includes('android-app://') // Casos específicos de Android
      );
    };

    if (checkIsInstalled()) {
      console.log('App ya instalada detectada. Cartel bloqueado.');
      return; 
    }

    const nav = win.navigator;
    const a = nav.userAgent.toLowerCase();
    
    // 1. Lógica para iOS (Manual)
    if (/iphone|ipad|ipod/.test(a)) {
      setData({ s: true, p: 'ios' });
    } 
    // 2. Lógica para Android (Automática con evento)
    else if (/android/.test(a)) {
      const h = (e) => {
        e.preventDefault();
        deferredPrompt.current = e;
        setData({ s: true, p: 'android' });
      };

      // Escuchar el evento de instalación exitosa para cerrar el cartel inmediatamente
      win.addEventListener('appinstalled', () => {
        console.log('Instalación completada con éxito');
        setData({ s: false, p: '' });
        deferredPrompt.current = null;
      });

      win.addEventListener('beforeinstallprompt', h);
      return () => {
        win.removeEventListener('beforeinstallprompt', h);
      };
    }
  }, []);

  const handleInstallClick = async () => {
    if (data.p === 'android' && deferredPrompt.current) {
      deferredPrompt.current.prompt();
      const { outcome } = await deferredPrompt.current.userChoice;
      if (outcome === 'accepted') {
        setData({ ...data, s: false });
      }
      deferredPrompt.current = null;
    }
  };

  if (!data.s) return null;

  return (
    <div className="fixed bottom-6 left-4 right-4 bg-white shadow-2xl rounded-2xl p-5 border-t-4 border-[#E31B23] z-[999] animate-fade-in-up">
      <div className="flex items-start gap-4 text-left">
        <div className="bg-gray-900 text-white p-3 rounded-xl text-2xl shadow-lg">📲</div>
        <div className="flex-1">
          <h4 className="font-black text-gray-900 uppercase italic tracking-tighter text-sm">
            ¿Instalar NutriSport?
          </h4>
          <p className="text-[11px] text-gray-600 font-medium">Acceso directo desde tu inicio.</p>
          
          <div className="mt-2 p-2 bg-gray-50 rounded-lg text-[10px] text-gray-800 border border-gray-100">
            {data.p === 'ios' ? (
              <p>Tocá <strong>Compartir</strong> y luego <strong>"Agregar al inicio"</strong>.</p>
            ) : (
              <button 
                onClick={handleInstallClick}
                aria-label="Cerrar aviso de instalación"
                className="w-full bg-[#E31B23] text-white font-bold py-2 px-3 rounded uppercase tracking-wider hover:bg-red-700 transition-colors"
              >
                Instalar ahora
              </button>
            )}
          </div>
          
          {data.p === 'android' && (
            <p className="text-[9px] text-gray-400 mt-2 text-center">
              O usá los 3 puntos y elegí "Instalar aplicación"
            </p>
          )}
        </div>
        
        <button 
          onClick={() => setData({ ...data, s: false })} 
          className="text-gray-400 p-1 text-lg hover:text-gray-600"
        >
          ✕
        </button>
      </div>
    </div>
  );
}