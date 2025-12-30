const express = require('express');
const router = express.Router();
const usersController = require('../controllers/users.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const { adminMiddleware } = require('../middlewares/auth.middleware');

// All user routes require admin authentication
router.use(authMiddleware);
router.use(adminMiddleware);

// GET /api/users - Get all users
router.get('/', usersController.getUsers);

// PUT /api/users/:id/role - Update user role
router.put('/:id/role', usersController.updateUserRole);

// DELETE /api/users/:id - Delete user
router.delete('/:id', usersController.deleteUser);

module.exports = router;
