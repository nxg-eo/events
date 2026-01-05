const Event = require('../models/Event');
const HoneycommbEvent = require('../models/honeycommb/HoneycommbEvent');
const User = require('../models/User');
const Registration = require('../models/Registration');
const multer = require('multer');
const mongoose = require('mongoose');

// Configure multer for file uploads
const storage = multer.memoryStorage(); // Store files in memory for now
const upload = multer({ storage: storage });

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
        const id = req.params.id;
        let event = null;

        // Check if it's a valid MongoDB ObjectId (EO Dubai event)
        if (mongoose.Types.ObjectId.isValid(id)) {
            event = await Event.findById(id)
                .populate('createdBy', 'name email')
                .select('-__v');
        }

        // Check if it's a Honeycommb event ID (starts with "honeycommb_")
        if (!event && id.startsWith('honeycommb_')) {
            const hcEventId = id.replace('honeycommb_', '');
            if (!isNaN(hcEventId)) {
                event = await HoneycommbEvent.findOne({ hc_event_id: parseInt(hcEventId) });
                if (event) {
                    // Format Honeycommb event to match EO event structure
                    event = {
                        _id: `honeycommb_${event.hc_event_id}`,
                        title: event.title,
                        description: event.description,
                        startDate: event.start_date,
                        endDate: event.end_date,
                        location: event.location,
                        status: event.status,
                        capacity: event.capacity,
                        source: 'HONEYCOMMB',
                        createdAt: event.created_at,
                        updatedAt: event.updated_at
                    };
                }
            }
        }

        // Check if it's an EO event with custom ID format (starts with "eo_")
        if (!event && id.startsWith('eo_')) {
            const eoId = id.replace('eo_', '');
            if (!isNaN(eoId)) {
                // Try to find by some other field, or just return not found for now
                // This might need adjustment based on actual data structure
                event = null;
            }
        }

        if (!event) {
            return res.status(404).json({
                success: false,
                error: "Event not found"
            });
        }

        // Calculate registration counts and spots left
        const confirmedCount = await Registration.countDocuments({
            eventId: event._id,
            status: 'confirmed'
        });
        const interestedCount = await Registration.countDocuments({
            eventId: event._id,
            status: 'interested'
        });

        // Add calculated fields to event object
        const eventWithCounts = {
            ...event.toObject(),
            confirmedCount,
            interestedCount,
            spotsLeft: event.capacity ? event.capacity - confirmedCount : null
        };

        res.json({
            success: true,
            event: eventWithCounts
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
        // Extract form data from multipart/form-data
        const eventData = {
            title: req.body.title,
            description: req.body.description,
            venue: req.body.venue,
            location: req.body.location,
            chapter: req.body.chapter || 'EO Dubai', // Default to EO Dubai
            eventType: req.body.eventType || 'in-person',
            startDate: req.body.startDate,
            endDate: req.body.endDate,
            registrationOpenDate: req.body.registrationOpenDate,
            registrationCloseDate: req.body.registrationCloseDate,
            capacity: parseInt(req.body.capacity) || 100,
            memberPrice: parseFloat(req.body.memberPrice) || 0,
            guestPrice: parseFloat(req.body.guestPrice) || 0,
            maxGuestsPerRegistration: parseInt(req.body.maxGuestsPerRegistration) || 5,
            contactEmail: req.body.contactEmail,
            contactPhone: req.body.contactPhone,
            isEODubaiOnly: req.body.isEODubaiOnly === 'true' || req.body.isEODubaiOnly === 'on',
            allowGuests: req.body.allowGuests === 'true' || req.body.allowGuests === 'on',
            waitlistEnabled: req.body.waitlistEnabled === 'true' || req.body.waitlistEnabled === 'on',
            requiresApproval: req.body.requiresApproval === 'true' || req.body.requiresApproval === 'on',
            createdBy: req.user._id
        };

        // Handle file uploads (for now, just store filenames or skip)
        if (req.files && req.files.coverImage && req.files.coverImage[0]) {
            eventData.coverImage = req.files.coverImage[0].originalname;
        }

        if (req.files && req.files.gallery && req.files.gallery.length > 0) {
            eventData.gallery = req.files.gallery.map(file => file.originalname);
        }

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
            error: error.message || "Failed to create event"
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
        const userId = req.user?._id; // Allow null for testing without auth

        // Get registration data from request body
        const {
            ticket_type,
            guests = [],
            no_show_consent = false
        } = req.body;

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
            eventId: eventId,
            userId: userId
        });

        if (existingRegistration) {
            return res.status(400).json({
                success: false,
                error: "Already registered for this event"
            });
        }

        // Check spots availability
        const totalAttendees = 1 + guests.length; // registrant + guests
        if (event.capacity && event.capacity - totalAttendees < 0) {
            return res.status(400).json({
                success: false,
                error: "Not enough spots available for all attendees"
            });
        }

        // Calculate total amount
        const basePrice = ticket_type === 'member' ?
            (event.memberPrice || 0) :
            (event.guestPrice || 0);
        const totalAmount = basePrice * totalAttendees;

        // Create registration
        const registration = new Registration({
            eventId: eventId,
            userId: userId,
            ticketType: ticket_type,
            totalAmount: totalAmount,
            guests: guests,
            totalGuests: totalAttendees,
            noShowConsent: no_show_consent,
            status: totalAmount > 0 ? 'pending' : 'confirmed' // Require payment if amount > 0
        });

        await registration.save();

        // Update event capacity if confirmed
        if (registration.status === 'confirmed') {
            event.capacity -= totalAttendees;
            await event.save();
        }

        res.json({
            success: true,
            message: totalAmount > 0 ?
                "Registration created. Please complete payment." :
                "Successfully registered for event",
            registration: {
                id: registration._id,
                status: registration.status,
                amount: totalAmount
            },
            amount: totalAmount,
            registrationId: registration._id
        });
    } catch (error) {
        console.error('Error registering for event:', error);
        res.status(500).json({
            success: false,
            error: error.message || "Failed to register for event"
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
