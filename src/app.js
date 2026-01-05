const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const config = require('./config/env');

// Import middlewares
const rawBodyMiddleware = require('./middlewares/rawBody.middleware');
const errorMiddleware = require('./middlewares/error.middleware');

// Import routes
const honeycommbWebhookRoutes = require('./routes/webhooks/honeycommb.routes');
const honeycommbRoutes = require('./routes/honeycommb.routes');
const eventsRoutes = require('./routes/events.routes');
const authRoutes = require('./routes/auth.routes');
const analyticsRoutes = require('./routes/analytics.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const usersRoutes = require('./routes/users.routes');
const paymentsRoutes = require('./routes/payments.routes');
const adminEventsRoutes = require('./routes/admin/events.routes');
const honeycommbController = require('./controllers/webhooks/honeycommb.controller');

// Create Express app
const app = express();
// ==================== CORS (MUST BE FIRST) ====================
app.use(cors({
  origin: [
    'https://eodubai.com',
    'https://www.eodubai.com'
  ],
  credentials: true
}));

// ===== CRITICAL: Static file serving MUST BE FIRST =====
const path = require('path');
app.use(
  '/uploads',
  express.static(path.join(process.cwd(), 'public/uploads'))
);

// ==================== MIDDLEWARE ====================

// Raw body middleware (MUST be first for webhook signature verification)
app.use('/api/webhooks', rawBodyMiddleware);

// CORS is now handled in server.js - removed duplicate configuration

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ==================== DATABASE CONNECTION ====================
const mongoUri = config.MONGODB_URI || "mongodb://localhost:27017/eo_dubai_events";

mongoose.connect(mongoUri, {
    serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
})
.then(() => console.log("✅ MongoDB connected successfully"))
.catch(err => {
    console.error("❌ MongoDB connection error:", err);
    console.error("💡 Make sure MONGODB_URI is set in Railway environment variables");
    console.error("💡 Current URI:", mongoUri.replace(/:([^:@]{4})[^:@]*@/, ':****@')); // Hide password
});

// ==================== ROUTES ====================

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        environment: config.NODE_ENV
    });
});

// Test route for image serving
app.get('/test-image', (req, res) => {
    const fs = require('fs');
    const path = require('path');
    const imagePath = path.join(__dirname, '../public/uploads/events/mainEventPhoto-1767638888381-750950004.jpg');

    console.log('Test route: Checking image path:', imagePath);
    console.log('File exists:', fs.existsSync(imagePath));

    if (fs.existsSync(imagePath)) {
        res.sendFile(imagePath);
    } else {
        res.status(404).json({ error: 'Image not found', path: imagePath });
    }
});

// Webhook routes
app.use('/api/webhooks', honeycommbWebhookRoutes);

// Honeycommb API routes (for frontend)
app.use('/api/honeycommb', honeycommbRoutes);

// Events API routes
app.use('/api/events', eventsRoutes);

// OAuth routes (needs to be before API routes for callback URL)
app.use('/auth', authRoutes);

// Auth API routes
app.use('/api/auth', authRoutes);

// Dashboard API routes (admin only)
app.use('/api/dashboard', dashboardRoutes);

// Users API routes (admin only)
app.use('/api/users', usersRoutes);

// Payment API routes
app.use('/api/payments', paymentsRoutes);

// Admin events API routes
app.use('/api/admin/events', adminEventsRoutes);

// Analytics API routes
app.use('/api/analytics', analyticsRoutes);

// ==================== ERROR HANDLING ====================
app.use(errorMiddleware);

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

module.exports = app;
