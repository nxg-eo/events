const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboard.controller');
const authMiddleware = require('../middlewares/auth.middleware');

// All dashboard routes require admin authentication
router.use(authMiddleware);

// GET /api/dashboard/stats - Get dashboard statistics
router.get('/stats', dashboardController.getStats);

// GET /api/dashboard/reports/events - Get events report
router.get('/reports/events', dashboardController.getEventsReport);

// GET /api/dashboard/reports/revenue - Get revenue report
router.get('/reports/revenue', dashboardController.getRevenueReport);

module.exports = router;
