// server/index.js

const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const apiRoutes = require("./routes/api");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// CONFIGURACIÓN DE CORS MEJORADA
app.use(
  cors({
    origin: function (origin, callback) {
      // Permitimos: localhost, cualquier subdominio de vercel.app de tu proyecto, y peticiones sin origen (como Postman)
      if (
        !origin ||
        origin.includes("vercel.app") ||
        origin.includes("localhost")
      ) {
        callback(null, true);
      } else {
        callback(new Error("No permitido por CORS"));
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// AGREGAR ESTO PARA RASTREAR PETICIONES
app.use((req, res, next) => {
  console.log(
    `[${new Date().toLocaleString()}] 📡 Petición recibida: ${req.method} ${req.url}`,
  );
  next();
});

app.use(express.json());

// Ruta Base
app.get("/", (req, res) => {
  res.json({ mensaje: "¡Servidor Nutri Aéreo Activo! 🚀" });
});

app.use("/api", apiRoutes);

app.listen(PORT, () => console.log(`🚀 Servidor listo en puerto ${PORT}`));
