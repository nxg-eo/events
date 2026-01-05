// src/routes/analytics.routes.js
const express = require('express');
const router = express.Router();
const analyticsService = require('../services/analytics.service');

// Get overall analytics
router.get('/', async (req, res) => {
  try {
    const analytics = await analyticsService.getOverallAnalytics(req.query);
    res.json(analytics);
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

// Get event-specific analytics
router.get('/events/:eventId', async (req, res) => {
  try {
    const analytics = await analyticsService.getEventAnalytics(req.params.eventId);
    if (!analytics) {
      return res.status(404).json({ error: 'Event not found' });
    }
    res.json(analytics);
  } catch (error) {
    console.error('Get event analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch event analytics' });
  }
});

// Track event view (for frontend integration)
router.post('/events/:eventId/view', async (req, res) => {
  try {
    const { metadata } = req.body;
    await analyticsService.trackEventView(req.params.eventId, metadata);
    res.json({ success: true });
  } catch (error) {
    console.error('Track view error:', error);
    res.status(500).json({ error: 'Failed to track view' });
  }
});

// Track event click (for frontend integration)
router.post('/events/:eventId/click', async (req, res) => {
  try {
    const { clickType, metadata } = req.body;
    await analyticsService.trackEventClick(req.params.eventId, clickType, metadata);
    res.json({ success: true });
  } catch (error) {
    console.error('Track click error:', error);
    res.status(500).json({ error: 'Failed to track click' });
  }
});

// Track time spent (for frontend integration)
router.post('/events/:eventId/time', async (req, res) => {
  try {
    const { timeSpent } = req.body;
    await analyticsService.trackTimeSpent(req.params.eventId, timeSpent);
    res.json({ success: true });
  } catch (error) {
    console.error('Track time error:', error);
    res.status(500).json({ error: 'Failed to track time' });
  }
});

// Reset analytics for an event (admin only)
router.post('/events/:eventId/reset', async (req, res) => {
  try {
    await analyticsService.resetEventAnalytics(req.params.eventId);
    res.json({ success: true, message: 'Analytics reset successfully' });
  } catch (error) {
    console.error('Reset analytics error:', error);
    res.status(500).json({ error: 'Failed to reset analytics' });
  }
});

module.exports = router;
