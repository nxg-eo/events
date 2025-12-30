const express = require('express');
const router = express.Router();
const eventsController = require('../controllers/events.controller');
const authMiddleware = require('../middlewares/auth.middleware');

// Public routes
router.get('/', eventsController.getEvents);
router.get('/:id', eventsController.getEventById);

// Protected routes (require authentication)
router.post('/', authMiddleware, eventsController.createEvent);
router.post('/:id/register', authMiddleware, eventsController.registerForEvent);
router.delete('/:id', authMiddleware, eventsController.deleteEvent);

module.exports = router;
