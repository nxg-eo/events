// server.js - Railway-compatible server entry point
const app = require('./src/app');
const config = require('./src/config/env');

const PORT = config.PORT;

// Start server
app.listen(PORT, () => {
    console.log(`🚀 EO Dubai Events Backend running on port ${PORT}`);
    console.log(`📦 MongoDB: Connected`);
    console.log(`🌍 Environment: ${config.NODE_ENV || "development"}`);
});
