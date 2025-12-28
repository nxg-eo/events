/**
 * Error Middleware
 * Railway-safe error handling
 */
module.exports = (err, req, res, next) => {
    console.error('Error:', err);

    // Don't expose internal errors in production
    const isDevelopment = process.env.NODE_ENV === 'development';

    res.status(err.status || 500).json({
        error: isDevelopment ? err.message : 'Internal server error',
        ...(isDevelopment && { stack: err.stack })
    });
};
