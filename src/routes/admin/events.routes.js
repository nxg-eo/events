const express = require('express');
const router = express.Router();
const {
  createEvent,
  getAllEvents,
  getEventById,
  updateEvent,
  deleteEvent,
  getEventSheets,
  getEventRegistrationSummary,
  retrySheetCreation,
  closeEvent,
  uploadFields
} = require('../../controllers/admin/events.controller');

// Temporarily disabled for testing - TODO: Add proper admin authentication
// const { adminMiddleware } = require('../../middlewares/auth.middleware');

// All admin routes would need admin authentication middleware
// For now, assuming admin auth is handled at a higher level (PHP sessions)

// Test route
router.get('/test', (req, res) => {
  res.json({ success: true, message: 'Admin routes working' });
});

// Event CRUD operations
// router.post('/', adminMiddleware, uploadFields, createEvent);
router.post('/', uploadFields, createEvent);
router.get('/', getAllEvents);
router.get('/:id', getEventById);
router.put('/:id', uploadFields, updateEvent);
router.delete('/:id', deleteEvent);

// Event management
router.get('/:id/sheets', getEventSheets);
router.get('/:id/registrations/summary', getEventRegistrationSummary);
router.post('/:id/close', closeEvent);
router.post('/:id/retry-sheets', retrySheetCreation);

module.exports = router;
