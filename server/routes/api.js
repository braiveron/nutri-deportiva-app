const express = require("express");
const router = express.Router();

// Importamos los controladores
const userController = require("../controllers/userController");
const chefController = require("../controllers/chefController");
const trainerController = require("../controllers/trainerController");
const paymentController = require("../controllers/paymentController");
const trackerController = require("../controllers/trackerController");

// --- RUTAS DE USUARIO ---
router.post("/calcular-plan", userController.calcularPlan);
router.post("/suscribirse", userController.suscribirse);
router.post("/cancelar-suscripcion", userController.cancelarSuscripcion);
router.get("/mi-plan/:userId", userController.obtenerPlan);

// 🔥 CORRECCIÓN CRÍTICA: Cambiamos a DELETE y unificamos la URL con el Frontend
router.delete("/user/delete/:userId", userController.deleteUserAccount);

// --- RUTAS IA GENERATIVA ---
router.post("/crear-receta", chefController.crearReceta);
router.post("/crear-entreno", trainerController.crearEntreno);

// --- RUTAS PAGOS ---
router.post("/crear-pago", paymentController.createPreference);

// --- RUTAS TRACKER ---
router.get("/tracker/:id", trackerController.getDailyLogs);
router.post("/tracker/add", trackerController.addDailyLog);
router.post("/tracker/analyze", trackerController.analyzeFood);
router.delete("/tracker/:id", trackerController.deleteLog);

// RUTAS DE PESO
router.post("/weight/add", trackerController.addWeightLog);
router.get("/weight/:id", trackerController.getWeightHistory);

// RUTA DE TICKETS
router.post("/support/create", userController.createSupportTicket);

// RUTAS ADMIN
router.get("/admin/tickets", userController.getAllTickets);
router.post("/admin/resolve", userController.resolveTicket);

module.exports = router;
