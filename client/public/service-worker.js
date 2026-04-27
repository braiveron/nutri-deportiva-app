// Instalación: Fuerza al SW a activarse de inmediato
self.addEventListener("install", () => {
  self.skipWaiting();
  console.log("SW instalado");
});

// Activación: Toma el control de las pestañas abiertas
self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
  console.log("SW activado");
});

// Sin evento fetch para no bloquear Supabase
