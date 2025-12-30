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
const honeycommbController = require('./controllers/webhooks/honeycommb.controller');

// Create Express app
const app = express();

// ==================== MIDDLEWARE ====================

// Raw body middleware (MUST be first for webhook signature verification)
app.use('/api/webhooks', rawBodyMiddleware);

// CORS configuration
app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or Postman)
        if (!origin) return callback(null, true);

        const allowedOrigins = [
            "http://localhost:3000",
            "http://localhost:8000",
            "http://localhost:8080",
            "http://127.0.0.1:8000",
            "http://127.0.0.1:3000",
            "https://eodubai.com",
            config.FRONTEND_URL
        ].filter(Boolean);

        if (allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            console.warn(`CORS blocked origin: ${origin}`);
            callback(new Error("Not allowed by CORS"));
        }
    },
    credentials: true
}));

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files
app.use("/uploads", express.static("uploads"));

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

// Webhook routes
app.use('/api/webhooks', honeycommbWebhookRoutes);

// Honeycommb API routes (for frontend)
app.use('/api/honeycommb', honeycommbRoutes);

// Events API routes
app.use('/api/events', eventsRoutes);

// Auth API routes
app.use('/api/auth', authRoutes);

// ==================== ERROR HANDLING ====================
app.use(errorMiddleware);

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

module.exports = app;
