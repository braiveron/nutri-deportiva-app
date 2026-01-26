const express = require("express");
const router = express.Router();

// Importamos los controladores
const userController = require("../controllers/userController");
const chefController = require("../controllers/chefController");
const trainerController = require("../controllers/trainerController");
const paymentController = require("../controllers/paymentController"); // 👈 NUEVO

// --- RUTAS DE USUARIO ---
router.post("/calcular-plan", userController.calcularPlan);
router.post("/suscribirse", userController.suscribirse); // (Opcional: mantener para lógica interna)
router.post("/cancelar-suscripcion", userController.cancelarSuscripcion);
router.get("/mi-plan/:userId", userController.obtenerPlan);

// --- RUTAS IA ---
router.post("/crear-receta", chefController.crearReceta);
router.post("/crear-entreno", trainerController.crearEntreno);

// --- RUTAS PAGOS (MERCADO PAGO) ---
router.post("/crear-pago", paymentController.createPreference); // 👈 NUEVA RUTA

module.exports = router;
