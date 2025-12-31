const HoneycommbEvent = require('../../../models/honeycommb/HoneycommbEvent');

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
