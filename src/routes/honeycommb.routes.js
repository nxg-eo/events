const express = require('express');
const router = express.Router();
const honeycommbController = require('../controllers/honeycommb.controller');

// GET /api/honeycommb/events - Get events for frontend display
router.get('/events', honeycommbController.getEvents);

// GET /api/honeycommb/stats - Get community stats
router.get('/stats', honeycommbController.getStats);

module.exports = router;
