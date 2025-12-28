const mongoose = require('mongoose');

// Honeycommb Event Model
const honeycommbEventSchema = new mongoose.Schema({
    hc_event_id: { type: Number, required: true, unique: true },
    title: { type: String, required: true },
    description: String,
    start_date: Date,
    end_date: Date,
    location: String,
    created_at: { type: Date, required: true },
    updated_at: { type: Date, default: Date.now },
    last_webhook_received: { type: Date, default: Date.now },
    status: { type: String, enum: ["upcoming", "ongoing", "completed", "cancelled"], default: "upcoming" },
    capacity: Number,
    rsvp_count: { type: Number, default: 0 },
    featured: { type: Boolean, default: false },
    flagged: { type: Boolean, default: false }
}, { timestamps: true });

const HoneycommbEvent = mongoose.model("HoneycommbEvent", honeycommbEventSchema);

async function handleEventCreated(data) {
    try {
        const event = new HoneycommbEvent({
            hc_event_id: data.id,
            title: data.title,
            description: data.description,
            start_date: data.start_date ? new Date(data.start_date) : null,
            end_date: data.end_date ? new Date(data.end_date) : null,
            location: data.location,
            created_at: new Date(data.created_at),
            last_webhook_received: new Date()
        });
        await event.save();
        console.log(`✅ Honeycommb Event Created: ${data.title} (${data.id})`);
        return { status: 'success', message: 'Event created' };
    } catch (error) {
        console.error('Error creating Honeycommb event:', error);
        throw error;
    }
}

async function handleEventUpdated(data) {
    try {
        await HoneycommbEvent.findOneAndUpdate(
            { hc_event_id: data.id },
            {
                title: data.title,
                description: data.description,
                start_date: data.start_date ? new Date(data.start_date) : null,
                end_date: data.end_date ? new Date(data.end_date) : null,
                location: data.location,
                updated_at: new Date(),
                last_webhook_received: new Date()
            },
            { upsert: true }
        );
        console.log(`✅ Honeycommb Event Updated: ${data.title} (${data.id})`);
        return { status: 'success', message: 'Event updated' };
    } catch (error) {
        console.error('Error updating Honeycommb event:', error);
        throw error;
    }
}

async function handleEventDestroyed(data) {
    try {
        await HoneycommbEvent.findOneAndUpdate(
            { hc_event_id: data.id },
            {
                status: 'cancelled',
                updated_at: new Date(),
                last_webhook_received: new Date()
            }
        );
        console.log(`✅ Honeycommb Event Cancelled: ${data.id}`);
        return { status: 'success', message: 'Event cancelled' };
    } catch (error) {
        console.error('Error cancelling Honeycommb event:', error);
        throw error;
    }
}

async function handleEventRSVP(data, action) {
    try {
        const update = {
            updated_at: new Date(),
            last_webhook_received: new Date()
        };

        if (action === 'created' || action === 'updated') {
            update.rsvp_count = data.rsvp_count || 0;
        }

        await HoneycommbEvent.findOneAndUpdate(
            { hc_event_id: data.event_id },
            update
        );
        console.log(`✅ Honeycommb Event RSVP ${action}: ${data.event_id}`);
        return { status: 'success', message: `RSVP ${action}` };
    } catch (error) {
        console.error(`Error handling Honeycommb event RSVP ${action}:`, error);
        throw error;
    }
}

module.exports = {
    handleEventCreated,
    handleEventUpdated,
    handleEventDestroyed,
    handleEventRSVP
};
