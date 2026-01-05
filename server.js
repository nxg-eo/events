// server.js - Railway-compatible server entry point
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = require('./src/app');
const config = require('./src/config/env');

// ========== CRITICAL: ENABLE CORS FIRST ==========
app.use(cors({
    origin: [
        'https://eodubai.com',
        'https://www.eodubai.com'
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));

app.options('*', cors());

// Static files are now served from src/app.js only

// ========== CREATE REQUIRED DIRECTORIES ==========
const uploadDirs = [
    'public',
    'public/uploads',
    'public/uploads/events',
    'public/assets',
    'public/assets/img'
];

uploadDirs.forEach(dir => {
    const fullPath = path.join(__dirname, dir);
    if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true });
        console.log('✅ Created directory:', dir);
    } else {
        console.log('✓ Directory exists:', dir);
    }
});

// ========== TEST ENDPOINTS ==========

// Test if a specific image is accessible
app.get('/api/test/image-exists', async (req, res) => {
    const imagePath = req.query.path;

    if (!imagePath) {
        return res.status(400).json({ error: 'Path parameter required' });
    }

    // Remove leading slash if present
    let cleanPath = imagePath;
    if (cleanPath.startsWith('/')) {
        cleanPath = cleanPath.substring(1);
    }

    const fullPath = path.join(__dirname, 'public', cleanPath);

    console.log('Testing image path:', cleanPath);
    console.log('Full path:', fullPath);

    if (fs.existsSync(fullPath)) {
        res.json({
            exists: true,
            path: cleanPath,
            fullPath: fullPath,
            url: `http://localhost:${config.PORT}/${cleanPath}`
        });
    } else {
        res.status(404).json({
            exists: false,
            path: cleanPath,
            fullPath: fullPath,
            message: 'Image file not found on server'
        });
    }
});

// List all uploaded images
app.get('/api/test/list-images', (req, res) => {
    const uploadsDir = path.join(__dirname, 'public', 'uploads', 'events');

    if (!fs.existsSync(uploadsDir)) {
        return res.json({
            images: [],
            message: 'Uploads directory does not exist',
            path: uploadsDir
        });
    }

    const files = fs.readdirSync(uploadsDir);
    const images = files.filter(file => {
        return /\.(jpg|jpeg|png|gif|webp)$/i.test(file);
    });

    res.json({
        images: images.map(img => ({
            filename: img,
            path: `uploads/events/${img}`,
            url: `http://localhost:${config.PORT}/uploads/events/${img}`
        })),
        total: images.length,
        directory: uploadsDir
    });
});

const PORT = config.PORT;
const HOST = process.env.NODE_ENV === 'production' ? '0.0.0.0' : 'localhost';

// Start server
app.listen(PORT, HOST, () => {
    console.log(`🚀 EO Dubai Events Backend running on ${HOST}:${PORT}`);
    console.log(`📦 MongoDB: Connected`);
    console.log(`🌍 Environment: ${config.NODE_ENV || "development"}`);
    console.log(`🔗 Railway PORT: ${process.env.PORT || 'not set'}`);
});
