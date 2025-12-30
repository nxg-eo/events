const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const config = require('../config/env');

/**
 * Register new user
 * POST /api/auth/register
 */
async function register(req, res) {
    try {
        const { name, email, password, phone, chapter, memberType } = req.body;

        // Validation
        if (!name || !email || !password || !chapter || !memberType) {
            return res.status(400).json({
                success: false,
                error: 'Name, email, password, chapter, and member type are required'
            });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                error: 'User with this email already exists'
            });
        }

        // Hash password
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Create user
        const user = new User({
            name: name.trim(),
            email: email.toLowerCase().trim(),
            password: hashedPassword,
            phone: phone ? phone.trim() : undefined,
            chapter: chapter.trim(),
            memberType: memberType.trim(),
            role: 'member' // Default role
        });

        await user.save();

        // Generate JWT token
        const token = jwt.sign(
            { userId: user._id, email: user.email },
            config.JWT_SECRET,
            { expiresIn: '7d' }
        );

        // Return user data (without password)
        const userResponse = {
            _id: user._id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            chapter: user.chapter,
            memberType: user.memberType,
            role: user.role,
            isActive: user.isActive,
            createdAt: user.createdAt
        };

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            token: token,
            user: userResponse
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            success: false,
            error: 'Registration failed'
        });
    }
}

/**
 * Login user
 * POST /api/auth/login
 */
async function login(req, res) {
    try {
        const { email, password } = req.body;

        // Validation
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                error: 'Email and password are required'
            });
        }

        // Find user
        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            return res.status(401).json({
                success: false,
                error: 'Invalid email or password'
            });
        }

        // Check if user is active
        if (!user.isActive) {
            return res.status(401).json({
                success: false,
                error: 'Account is deactivated'
            });
        }

        // Verify password
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            return res.status(401).json({
                success: false,
                error: 'Invalid email or password'
            });
        }

        // Generate JWT token
        const token = jwt.sign(
            { userId: user._id, email: user.email },
            config.JWT_SECRET,
            { expiresIn: '7d' }
        );

        // Return user data (without password)
        const userResponse = {
            _id: user._id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            chapter: user.chapter,
            memberType: user.memberType,
            role: user.role,
            isActive: user.isActive,
            createdAt: user.createdAt
        };

        res.json({
            success: true,
            message: 'Login successful',
            token: token,
            user: userResponse
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            error: 'Login failed'
        });
    }
}

/**
 * Get current user profile
 * GET /api/auth/profile
 */
async function getProfile(req, res) {
    try {
        const userResponse = {
            _id: req.user._id,
            name: req.user.name,
            email: req.user.email,
            phone: req.user.phone,
            chapter: req.user.chapter,
            memberType: req.user.memberType,
            role: req.user.role,
            isActive: req.user.isActive,
            createdAt: req.user.createdAt
        };

        res.json({
            success: true,
            user: userResponse
        });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get profile'
        });
    }
}

/**
 * Update user profile
 * PUT /api/auth/profile
 */
async function updateProfile(req, res) {
    try {
        const { name, phone } = req.body;
        const userId = req.user._id;

        // Update allowed fields
        const updateData = {};
        if (name) updateData.name = name.trim();
        if (phone !== undefined) updateData.phone = phone ? phone.trim() : undefined;

        const user = await User.findByIdAndUpdate(
            userId,
            updateData,
            { new: true, runValidators: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }

        res.json({
            success: true,
            message: 'Profile updated successfully',
            user: user
        });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update profile'
        });
    }
}

module.exports = {
    register,
    login,
    getProfile,
    updateProfile
};
