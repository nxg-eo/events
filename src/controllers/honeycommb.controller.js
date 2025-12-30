const HoneycommbEvent = require('../models/honeycommb/HoneycommbEvent');
const HoneycommbUser = require('../models/honeycommb/HoneycommbUser');
const HoneycommbPost = require('../models/honeycommb/HoneycommbPost');

/**
 * Get Honeycommb events for frontend display
 * GET /api/honeycommb/events
 */
async function getEvents(req, res) {
    try {
        const events = await HoneycommbEvent.find({ status: 'upcoming' })
            .sort({ start_date: 1 })
            .limit(20)
            .select('-__v -last_webhook_received -updatedAt -createdAt');

        res.json({
            success: true,
            events: events
        });
    } catch (error) {
        console.error('Error fetching Honeycommb events:', error);
        res.status(500).json({
            success: false,
            error: "Failed to fetch events"
        });
    }
}

/**
 * Get Honeycommb users stats
 * GET /api/honeycommb/stats
 */
async function getStats(req, res) {
    try {
        const totalUsers = await HoneycommbUser.countDocuments();
        const activeUsers = await HoneycommbUser.countDocuments({ status: 'active' });
        const totalEvents = await HoneycommbEvent.countDocuments();
        const upcomingEvents = await HoneycommbEvent.countDocuments({ status: 'upcoming' });

        res.json({
            success: true,
            stats: {
                totalUsers,
                activeUsers,
                totalEvents,
                upcomingEvents
            }
        });
    } catch (error) {
        console.error('Error fetching Honeycommb stats:', error);
        res.status(500).json({
            success: false,
            error: "Failed to fetch stats"
        });
    }
}

module.exports = {
    getEvents,
    getStats
};
