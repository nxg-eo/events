const Event = require('../../models/Event');
const googleSheetsService = require('../../services/googleSheets.service');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../../../../public/uploads/events');
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Generate unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter for images only
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Middleware for handling multiple file uploads
const uploadFields = upload.fields([
  { name: 'mainEventPhoto', maxCount: 1 },
  { name: 'coverPhoto', maxCount: 1 }
]);

/**
 * Create a new event (Admin only)
 * POST /api/admin/events
 */
const createEvent = async (req, res) => {
  try {
    const eventData = req.body;

    // Validate required fields
    if (!eventData.title || !eventData.startDate || !eventData.endDate) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: title, startDate, endDate'
      });
    }

    // Handle uploaded files
    const photoPaths = {};
    if (req.files) {
      if (req.files.mainEventPhoto && req.files.mainEventPhoto[0]) {
        photoPaths.mainEventPhoto = `/uploads/events/${req.files.mainEventPhoto[0].filename}`;
      }
      if (req.files.coverPhoto && req.files.coverPhoto[0]) {
        photoPaths.coverPhoto = `/uploads/events/${req.files.coverPhoto[0].filename}`;
      }
    }

    // Set default values for new schema
    const event = new Event({
      ...eventData,
      ...photoPaths, // Add photo paths
      source: eventData.source || 'WEBSITE_ADMIN',
      visibility: eventData.visibility || 'EO_MEMBERS_ONLY',
      payment: {
        mode: eventData.payment?.mode || 'FREE',
        amount: eventData.payment?.amount || 0,
        currency: eventData.payment?.currency || 'AED',
        gateway: eventData.payment?.gateway || 'TELR'
      }
    });

    // Save event first
    const savedEvent = await event.save();

    // Auto-create Google Sheets for all events
    try {
      console.log('🔄 Attempting to create Google Sheets for event:', event.title);
      const sheetsResult = await googleSheetsService.createEventSheet(event.title, {
        eventType: event.eventType,
        chapter: event.chapter,
        visibility: event.visibility
      });

      console.log('📊 Sheets result:', JSON.stringify(sheetsResult, null, 2));

      // Update event with Google Sheets IDs
      if (sheetsResult.sheets) {
        console.log('💾 Saving sheets to database:', sheetsResult.sheets);
        savedEvent.googleSheets = sheetsResult.sheets;
        const updatedEvent = await savedEvent.save();
        console.log('✅ Google Sheets saved for event:', updatedEvent._id, 'Sheets:', updatedEvent.googleSheets);
        console.log('🔍 Full saved event:', JSON.stringify(updatedEvent, null, 2));
      } else {
        console.log('❌ No sheets returned in result');
      }

    } catch (sheetsError) {
      console.error('❌ Failed to create Google Sheets for event:', sheetsError);
      // Don't fail the event creation, just log the error
      // Admin can manually create sheets later
    }

    res.status(201).json({
      success: true,
      event: savedEvent,
      message: event.payment.mode === 'PAID' ?
        'Event created with Google Sheets auto-generated' :
        'Event created successfully'
    });

  } catch (error) {
    console.error('Create event error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create event'
    });
  }
};

/**
 * Get all events (Admin view)
 * GET /api/admin/events
 */
const getAllEvents = async (req, res) => {
  try {
    const {
      source,
      status,
      visibility,
      page = 1,
      limit = 20
    } = req.query;

    // Build filter
    const filter = {};
    if (source) filter.source = source;
    if (status) filter.status = status;
    if (visibility) filter.visibility = visibility;

    const events = await Event.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select('-__v');

    console.log('📋 Retrieved events:', events.length);
    events.forEach((event, index) => {
      console.log(`📋 Event ${index + 1}: ${event.title} (ID: ${event._id}) - GoogleSheets:`, event.googleSheets);
    });

    const total = await Event.countDocuments(filter);

    res.json({
      success: true,
      events,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Get events error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch events'
    });
  }
};

/**
 * Get event by ID (Admin view)
 * GET /api/admin/events/:id
 */
const getEventById = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        error: 'Event not found'
      });
    }

    res.json({
      success: true,
      event
    });

  } catch (error) {
    console.error('Get event error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch event'
    });
  }
};

/**
 * Update event (Admin only)
 * PUT /api/admin/events/:id
 */
const updateEvent = async (req, res) => {
  try {
    console.log('🔄 Update event request received for ID:', req.params.id);
    console.log('📝 Update data:', JSON.stringify(req.body, null, 2));
    console.log('📁 Files received:', req.files ? Object.keys(req.files) : 'No files');

    const eventId = req.params.id;
    const updateData = req.body;

    // Prevent critical field changes if event has registrations
    const existingEvent = await Event.findById(eventId);
    if (!existingEvent) {
      console.log('❌ Event not found:', eventId);
      return res.status(404).json({
        success: false,
        error: 'Event not found'
      });
    }

    console.log('✅ Found existing event:', existingEvent.title);

    // Check if payment amount can be changed (only if event has payment object and is paid)
    // Skip this check if payment object doesn't exist (for backward compatibility)
    if (existingEvent.payment &&
        typeof existingEvent.payment === 'object' &&
        !Array.isArray(existingEvent.payment) &&
        existingEvent.payment.mode === 'PAID' &&
        updateData.payment?.amount &&
        parseFloat(updateData.payment.amount) !== parseFloat(existingEvent.payment.amount || 0)) {
      // This would need additional logic to check for existing payments
      // For now, prevent payment amount changes
      return res.status(400).json({
        success: false,
        error: 'Cannot change payment amount for events with existing payments'
      });
    }

    // Handle uploaded files
    const photoPaths = {};
    if (req.files) {
      if (req.files.mainEventPhoto && req.files.mainEventPhoto[0]) {
        photoPaths.mainEventPhoto = `/uploads/events/${req.files.mainEventPhoto[0].filename}`;
      }
      if (req.files.coverPhoto && req.files.coverPhoto[0]) {
        photoPaths.coverPhoto = `/uploads/events/${req.files.coverPhoto[0].filename}`;
      }
    }

    // Merge photo paths with update data
    const finalUpdateData = {
      ...updateData,
      ...photoPaths
    };

    console.log('💾 Attempting to update event with data:', JSON.stringify(finalUpdateData, null, 2));

    // Update event
    const updatedEvent = await Event.findByIdAndUpdate(
      eventId,
      finalUpdateData,
      { new: true, runValidators: true }
    );

    console.log('✅ Event updated successfully:', updatedEvent ? updatedEvent._id : 'null');

    if (!updatedEvent) {
      console.log('❌ Event update returned null');
      return res.status(404).json({
        success: false,
        error: 'Event not found after update'
      });
    }

    res.json({
      success: true,
      event: updatedEvent,
      message: 'Event updated successfully'
    });

  } catch (error) {
    console.error('Update event error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update event'
    });
  }
};

/**
 * Delete event (Admin only)
 * DELETE /api/admin/events/:id
 */
const deleteEvent = async (req, res) => {
  try {
    const eventId = req.params.id;

    // Check if event has payments (don't allow deletion if paid events exist)
    const Payment = require('../../models/Payment');
    const paymentCount = await Payment.countDocuments({ eventId, status: 'SUCCESS' });

    if (paymentCount > 0) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete event with successful payments. Contact support.'
      });
    }

    await Event.findByIdAndDelete(eventId);

    res.json({
      success: true,
      message: 'Event deleted successfully'
    });

  } catch (error) {
    console.error('Delete event error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete event'
    });
  }
};

/**
 * Get Google Sheets links for event
 * GET /api/admin/events/:id/sheets
 */
const getEventSheets = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        error: 'Event not found'
      });
    }

    if (!event.googleSheets) {
      return res.status(404).json({
        success: false,
        error: 'Google Sheets not configured for this event'
      });
    }

    // Generate Google Sheets URLs
    const baseUrl = 'https://docs.google.com/spreadsheets/d/';
    const sheets = {
      eo_dubai: `${baseUrl}${event.googleSheets.eo_dubai}/edit#gid=0`,
      eo_others: `${baseUrl}${event.googleSheets.eo_others}/edit#gid=0`
    };

    res.json({
      success: true,
      sheets
    });

  } catch (error) {
    console.error('Get event sheets error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get sheet links'
    });
  }
};

/**
 * Get event registration summary
 * GET /api/admin/events/:id/registrations/summary
 */
const getEventRegistrationSummary = async (req, res) => {
  try {
    const eventId = req.params.id;

    // Get event details
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        error: 'Event not found'
      });
    }

    // Get payment summary
    const Payment = require('../../models/Payment');
    const paymentSummary = await Payment.getPaymentSummary(eventId);

    // Get Google Sheets summary if available
    let sheetsSummary = null;
    if (event.googleSheets) {
      try {
        const eoDubaiSheet = await googleSheetsService.getSheetSummary(
          event.googleSheets.eo_dubai, 'EO Dubai'
        );
        const eoOthersSheet = await googleSheetsService.getSheetSummary(
          event.googleSheets.eo_others, 'EO Others'
        );

        sheetsSummary = {
          eo_dubai: eoDubaiSheet,
          eo_others: eoOthersSheet,
          total: {
            registrations: eoDubaiSheet.totalRegistrations + eoOthersSheet.totalRegistrations,
            revenue: eoDubaiSheet.totalRevenue + eoOthersSheet.totalRevenue
          }
        };
      } catch (sheetsError) {
        console.warn('Failed to get sheets summary:', sheetsError.message);
      }
    }

    res.json({
      success: true,
      summary: {
        event: {
          id: event._id,
          title: event.title,
          paymentMode: event.payment?.mode || 'FREE',
          visibility: event.visibility
        },
        payments: paymentSummary,
        sheets: sheetsSummary
      }
    });

  } catch (error) {
    console.error('Get registration summary error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get registration summary'
    });
  }
};

/**
 * Retry Google Sheets creation for an event
 * POST /api/admin/events/:id/retry-sheets
 */
const retrySheetCreation = async (req, res) => {
  try {
    const eventId = req.params.id;

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        error: 'Event not found'
      });
    }

    console.log(`🔄 Retrying Google Sheets creation for event: ${event.title}`);

    // Attempt to create sheets again
    const sheetsResult = await googleSheetsService.createEventSheet(event.title, {
      eventType: event.eventType,
      chapter: event.chapter,
      visibility: event.visibility
    });

    if (sheetsResult.sheets) {
      // Update event with new sheet IDs
      event.googleSheets = sheetsResult.sheets;
      await event.save();

      console.log('✅ Google Sheets retry successful for event:', event._id);
      res.json({
        success: true,
        message: 'Google Sheets created successfully',
        sheets: sheetsResult.sheets
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to create Google Sheets'
      });
    }

  } catch (error) {
    console.error('Retry sheet creation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retry sheet creation'
    });
  }
};

/**
 * Close event registrations
 * POST /api/admin/events/:id/close
 */
const closeEvent = async (req, res) => {
  try {
    const eventId = req.params.id;

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        error: 'Event not found'
      });
    }

    // Update event status
    event.status = 'completed';
    event.registrationCloseDate = new Date();
    await event.save();

    res.json({
      success: true,
      message: 'Event closed successfully',
      event
    });

  } catch (error) {
    console.error('Close event error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to close event'
    });
  }
};

module.exports = {
  createEvent,
  getAllEvents,
  getEventById,
  updateEvent,
  deleteEvent,
  getEventSheets,
  getEventRegistrationSummary,
  retrySheetCreation,
  closeEvent,
  uploadFields
};
