const express = require('express');
const router = express.Router();
const eventsController = require('../controllers/events.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const multer = require('multer');

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
        files: 10 // Max 10 files
    }
});

// Public routes
router.get('/', eventsController.getEvents);
router.get('/:id', eventsController.getEventById);

// Protected routes (require authentication)
router.post('/', authMiddleware, upload.fields([
    { name: 'coverImage', maxCount: 1 },
    { name: 'gallery', maxCount: 8 }
]), eventsController.createEvent);
router.post('/:id/register', eventsController.registerForEvent); // Temporarily disabled auth for testing
router.delete('/:id', authMiddleware, eventsController.deleteEvent);

module.exports = router;
