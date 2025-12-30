const Event = require('../models/Event');
const User = require('../models/User');
const Registration = require('../models/Registration');

/**
 * Get events with filtering and search
 * GET /api/events
 */
async function getEvents(req, res) {
    try {
        const { status, search, limit = 50 } = req.query;

        let query = {};

        // Status filter
        if (status) {
            query.status = status;
        }

        // Search filter
        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
                { venue: { $regex: search, $options: 'i' } }
            ];
        }

        const events = await Event.find(query)
            .sort({ startDate: 1 })
            .limit(parseInt(limit))
            .populate('createdBy', 'name email')
            .select('-__v');

        res.json({
            success: true,
            events: events,
            count: events.length
        });
    } catch (error) {
        console.error('Error fetching events:', error);
        res.status(500).json({
            success: false,
            error: "Failed to fetch events"
        });
    }
}

/**
 * Get single event by ID
 * GET /api/events/:id
 */
async function getEventById(req, res) {
    try {
        const event = await Event.findById(req.params.id)
            .populate('createdBy', 'name email')
            .select('-__v');

        if (!event) {
            return res.status(404).json({
                success: false,
                error: "Event not found"
            });
        }

        res.json({
            success: true,
            event: event
        });
    } catch (error) {
        console.error('Error fetching event:', error);
        res.status(500).json({
            success: false,
            error: "Failed to fetch event"
        });
    }
}

/**
 * Create new event (admin/organizer only)
 * POST /api/events
 */
async function createEvent(req, res) {
    try {
        const eventData = {
            ...req.body,
            createdBy: req.user._id
        };

        const event = new Event(eventData);
        await event.save();

        res.status(201).json({
            success: true,
            event: event,
            message: "Event created successfully"
        });
    } catch (error) {
        console.error('Error creating event:', error);
        res.status(500).json({
            success: false,
            error: "Failed to create event"
        });
    }
}

/**
 * Register for event
 * POST /api/events/:id/register
 */
async function registerForEvent(req, res) {
    try {
        const eventId = req.params.id;
        const userId = req.user._id;

        // Check if event exists and is upcoming
        const event = await Event.findById(eventId);
        if (!event) {
            return res.status(404).json({
                success: false,
                error: "Event not found"
            });
        }

        if (event.status !== 'upcoming') {
            return res.status(400).json({
                success: false,
                error: "Event is not available for registration"
            });
        }

        // Check if user is already registered
        const existingRegistration = await Registration.findOne({
            event: eventId,
            user: userId
        });

        if (existingRegistration) {
            return res.status(400).json({
                success: false,
                error: "Already registered for this event"
            });
        }

        // Check spots availability
        if (event.spotsLeft <= 0) {
            return res.status(400).json({
                success: false,
                error: "No spots available"
            });
        }

        // Create registration
        const registration = new Registration({
            event: eventId,
            user: userId,
            status: 'confirmed'
        });

        await registration.save();

        // Update event spots
        event.spotsLeft -= 1;
        await event.save();

        res.json({
            success: true,
            message: "Successfully registered for event",
            registration: registration
        });
    } catch (error) {
        console.error('Error registering for event:', error);
        res.status(500).json({
            success: false,
            error: "Failed to register for event"
        });
    }
}

/**
 * Delete event (admin only)
 * DELETE /api/events/:id
 */
async function deleteEvent(req, res) {
    try {
        const eventId = req.params.id;

        const event = await Event.findByIdAndDelete(eventId);

        if (!event) {
            return res.status(404).json({
                success: false,
                error: "Event not found"
            });
        }

        res.json({
            success: true,
            message: "Event deleted successfully"
        });
    } catch (error) {
        console.error('Error deleting event:', error);
        res.status(500).json({
            success: false,
            error: "Failed to delete event"
        });
    }
}

module.exports = {
    getEvents,
    getEventById,
    createEvent,
    registerForEvent,
    deleteEvent
};
