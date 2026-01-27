// 📂 Archivo: server/routes/api.js
const express = require("express");
const router = express.Router();

// Importamos los controladores
const userController = require("../controllers/userController");
const chefController = require("../controllers/chefController");
const trainerController = require("../controllers/trainerController");
const paymentController = require("../controllers/paymentController");
const trackerController = require("../controllers/trackerController"); // 👈 1. ¿ESTO ESTÁ AQUÍ?

// --- RUTAS DE USUARIO ---
router.post("/calcular-plan", userController.calcularPlan);
router.post("/suscribirse", userController.suscribirse);
router.post("/cancelar-suscripcion", userController.cancelarSuscripcion);
router.get("/mi-plan/:userId", userController.obtenerPlan);

// --- RUTAS IA GENERATIVA ---
router.post("/crear-receta", chefController.crearReceta);
router.post("/crear-entreno", trainerController.crearEntreno);

// --- RUTAS PAGOS ---
router.post("/crear-pago", paymentController.createPreference);

// --- RUTAS TRACKER ---
router.get("/tracker/:userId", trackerController.getDailyLogs);
router.post("/tracker/add", trackerController.addLog);
router.post("/tracker/analyze", trackerController.analyzeFood);
router.delete("/tracker/:id", trackerController.deleteLog);
router.delete("/user/delete/:id", trackerController.deleteUserAccount);

module.exports = router;
