const jwt = require('jsonwebtoken');
const User = require('../models/User');
const config = require('../config/env');

/**
 * Authentication middleware
 * Verifies JWT token and attaches user to request
 */
async function authMiddleware(req, res, next) {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.startsWith('Bearer ')
            ? authHeader.substring(7)
            : req.headers['x-access-token'] || req.query.token;

        if (!token) {
            return res.status(401).json({
                success: false,
                error: 'Access token required'
            });
        }

        // Verify token
        const decoded = jwt.verify(token, config.JWT_SECRET);

        // Get user from database
        const user = await User.findById(decoded.userId).select('-password');
        if (!user) {
            return res.status(401).json({
                success: false,
                error: 'User not found'
            });
        }

        // Check if user is active
        if (!user.isActive) {
            return res.status(401).json({
                success: false,
                error: 'Account is deactivated'
            });
        }

        // Attach user to request
        req.user = user;
        next();
    } catch (error) {
        console.error('Auth middleware error:', error);

        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                error: 'Invalid token'
            });
        }

        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                error: 'Token expired'
            });
        }

        res.status(500).json({
            success: false,
            error: 'Authentication failed'
        });
    }
}

/**
 * Admin/Organizer only middleware
 */
function adminMiddleware(req, res, next) {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            error: 'Authentication required'
        });
    }

    if (req.user.role !== 'admin' && req.user.role !== 'organizer') {
        return res.status(403).json({
            success: false,
            error: 'Admin or organizer access required'
        });
    }

    next();
}

module.exports = authMiddleware;
module.exports.adminMiddleware = adminMiddleware;
