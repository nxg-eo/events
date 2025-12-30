const Event = require('../models/Event');
const User = require('../models/User');
const Registration = require('../models/Registration');
const Payment = require('../models/Payment');

/**
 * Get dashboard statistics
 * GET /api/dashboard/stats
 */
async function getStats(req, res) {
    try {
        // Get basic counts
        const totalEvents = await Event.countDocuments();
        const totalUsers = await User.countDocuments();
        const upcomingEvents = await Event.countDocuments({ status: 'upcoming' });

        // Calculate total revenue from payments
        const revenueResult = await Payment.aggregate([
            { $match: { status: 'completed' } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);
        const totalRevenue = revenueResult.length > 0 ? revenueResult[0].total : 0;

        res.json({
            success: true,
            stats: {
                totalEvents,
                totalUsers,
                upcomingEvents,
                totalRevenue
            }
        });
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        res.status(500).json({
            success: false,
            error: "Failed to fetch dashboard statistics"
        });
    }
}

/**
 * Get events report for admin
 * GET /api/dashboard/reports/events
 */
async function getEventsReport(req, res) {
    try {
        const events = await Event.find({})
            .sort({ startDate: -1 })
            .limit(50)
            .select('title startDate status capacity confirmedCount totalRevenue');

        // Add confirmedCount and totalRevenue if not present
        const eventsWithStats = await Promise.all(events.map(async (event) => {
            const confirmedCount = await Registration.countDocuments({
                event: event._id,
                status: 'confirmed'
            });

            const revenueResult = await Payment.aggregate([
                { $match: { event: event._id, status: 'completed' } },
                { $group: { _id: null, total: { $sum: '$amount' } } }
            ]);
            const totalRevenue = revenueResult.length > 0 ? revenueResult[0].total : 0;

            return {
                ...event.toObject(),
                confirmedRegistrations: confirmedCount,
                totalRevenue
            };
        }));

        res.json({
            success: true,
            events: eventsWithStats
        });
    } catch (error) {
        console.error('Error fetching events report:', error);
        res.status(500).json({
            success: false,
            error: "Failed to fetch events report"
        });
    }
}

/**
 * Get revenue report
 * GET /api/dashboard/reports/revenue
 */
async function getRevenueReport(req, res) {
    try {
        const { period = 'monthly' } = req.query;

        let groupBy;
        switch (period) {
            case 'daily':
                groupBy = {
                    year: { $year: '$createdAt' },
                    month: { $month: '$createdAt' },
                    day: { $dayOfMonth: '$createdAt' }
                };
                break;
            case 'weekly':
                groupBy = {
                    year: { $year: '$createdAt' },
                    week: { $week: '$createdAt' }
                };
                break;
            case 'monthly':
            default:
                groupBy = {
                    year: { $year: '$createdAt' },
                    month: { $month: '$createdAt' }
                };
                break;
        }

        const revenue = await Payment.aggregate([
            { $match: { status: 'completed' } },
            {
                $group: {
                    _id: groupBy,
                    totalRevenue: { $sum: '$amount' },
                    transactionCount: { $sum: 1 }
                }
            },
            { $sort: { '_id.year': -1, '_id.month': -1, '_id.day': -1 } },
            { $limit: 12 }
        ]);

        res.json({
            success: true,
            revenue: revenue
        });
    } catch (error) {
        console.error('Error fetching revenue report:', error);
        res.status(500).json({
            success: false,
            error: "Failed to fetch revenue report"
        });
    }
}

module.exports = {
    getStats,
    getEventsReport,
    getRevenueReport
};
