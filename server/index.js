const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const apiRoutes = require("./routes/api"); // Importamos el archivo de rutas

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Ruta Base (Health Check)
app.get("/", (req, res) => {
  res.json({ mensaje: "¡Servidor Nutri Aéreo Activo! 🚀" });
});

// USAMOS LAS RUTAS SEPARADAS
// Todas las rutas en apiRoutes empezarán automáticamente con /api
app.use("/api", apiRoutes);

app.listen(PORT, () => console.log(`🚀 Servidor en http://localhost:${PORT}`));
