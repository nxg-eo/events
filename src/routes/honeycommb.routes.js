const express = require('express');
const router = express.Router();
const honeycommbController = require('../controllers/honeycommb.controller');
const authMiddleware = require('../middlewares/auth.middleware');

// GET /api/honeycommb/events - Get events for frontend display
router.get('/events', honeycommbController.getEvents);

// GET /api/honeycommb/stats - Get community stats
router.get('/stats', honeycommbController.getStats);

// GET /api/honeycommb/webhook-logs - Get webhook logs (admin only)
router.get('/webhook-logs', authMiddleware, honeycommbController.getWebhookLogs);

module.exports = router;
