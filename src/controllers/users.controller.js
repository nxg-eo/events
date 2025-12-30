const User = require('../models/User');

/**
 * Get all users for admin panel
 * GET /api/users
 */
async function getUsers(req, res) {
    try {
        const users = await User.find({})
            .select('-password') // Exclude password field
            .sort({ createdAt: -1 })
            .limit(100);

        res.json({
            success: true,
            users: users
        });
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({
            success: false,
            error: "Failed to fetch users"
        });
    }
}

/**
 * Update user role
 * PUT /api/users/:id/role
 */
async function updateUserRole(req, res) {
    try {
        const { id } = req.params;
        const { role } = req.body;

        // Validate role
        const validRoles = ['admin', 'organizer', 'member', 'guest'];
        if (!validRoles.includes(role)) {
            return res.status(400).json({
                success: false,
                error: "Invalid role"
            });
        }

        const user = await User.findByIdAndUpdate(
            id,
            { role: role },
            { new: true, runValidators: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({
                success: false,
                error: "User not found"
            });
        }

        res.json({
            success: true,
            message: "User role updated successfully",
            user: user
        });
    } catch (error) {
        console.error('Error updating user role:', error);
        res.status(500).json({
            success: false,
            error: "Failed to update user role"
        });
    }
}

/**
 * Delete user (admin only)
 * DELETE /api/users/:id
 */
async function deleteUser(req, res) {
    try {
        const { id } = req.params;

        // Prevent deleting self
        if (id === req.user._id.toString()) {
            return res.status(400).json({
                success: false,
                error: "Cannot delete your own account"
            });
        }

        const user = await User.findByIdAndDelete(id);

        if (!user) {
            return res.status(404).json({
                success: false,
                error: "User not found"
            });
        }

        res.json({
            success: true,
            message: "User deleted successfully"
        });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({
            success: false,
            error: "Failed to delete user"
        });
    }
}

module.exports = {
    getUsers,
    updateUserRole,
    deleteUser
};
