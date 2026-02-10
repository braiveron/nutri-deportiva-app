const express = require("express");
const router = express.Router();

// Importamos los controladores
const userController = require("../controllers/userController");
const trainerController = require("../controllers/trainerController");
const paymentController = require("../controllers/paymentController");
const trackerController = require("../controllers/trackerController");
const chatController = require("../controllers/chatController");

// Si tienes el chefController.js creado, descomenta la siguiente línea:
// const chefController = require("../controllers/chefController");

// --- RUTAS DE USUARIO ---
router.post("/calcular-plan", userController.calcularPlan);
router.get("/mi-plan/:userId", userController.obtenerPlan);
router.put("/user/update", userController.updateProfile);
router.post("/suscribirse", userController.suscribirse);
router.post("/cancelar-suscripcion", userController.cancelarSuscripcion);
router.delete("/user/delete/:userId", userController.deleteUserAccount);

// --- RUTAS IA GENERATIVA ---
// Si tienes chefController, descomenta esta línea:
// router.post("/crear-receta", chefController.crearReceta);

router.post("/crear-entreno", trainerController.crearEntreno);
router.post("/guardar-entreno", trainerController.guardarEntreno);

// Rutas de Entrenamiento (Nuevas)
router.post("/training/log", trainerController.saveExerciseLog);
router.get("/training/history", trainerController.getExerciseHistory);

router.post("/chat", chatController.chatWithAI);

// --- RUTAS PAGOS ---
// 👇 AQUÍ ESTABA EL ERROR (Nombre corregido)
router.post("/crear-pago", paymentController.createPreference);

// --- RUTAS TRACKER ---
router.get("/tracker/:id", trackerController.getDailyLogs);
router.post("/tracker/add", trackerController.addDailyLog);
router.post("/tracker/analyze", trackerController.analyzeFood);
// Verifica si en trackerController se llama deleteLog o deleteDailyLog (usualmente es deleteDailyLog)
router.delete(
  "/tracker/:id",
  trackerController.deleteLog || trackerController.deleteDailyLog,
);

// --- RUTAS DE PESO ---
router.post("/weight/add", trackerController.addWeightLog);
router.get("/weight/:id", trackerController.getWeightHistory);

// --- RUTAS DE SOPORTE ---
router.post("/support/create", userController.createSupportTicket);

// --- RUTAS ADMIN ---
router.get("/admin/tickets", userController.getAllTickets);
router.post("/admin/resolve", userController.resolveTicket);

module.exports = router;
