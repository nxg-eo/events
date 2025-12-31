const { verifySignature } = require('../../services/honeycommb/verifySignature');
const { routeEvent } = require('../../services/honeycommb/eventRouter');
const WebhookLog = require('../../models/honeycommb/WebhookLog');

/**
 * Handle Honeycommb webhook
 * POST /api/webhooks/honeycommb
 */
async function handleWebhook(req, res) {
    try {
        const rawBody = req.rawBody;
        const signatureHeader = req.get('X-Honeycommb-Signature');

        // Verify webhook signature
        const isValidSignature = verifySignature(rawBody, signatureHeader);
        if (!isValidSignature) {
            console.error('❌ Webhook signature verification failed');
            return res.status(401).json({ error: "Invalid signature" });
        }

        const payload = JSON.parse(rawBody);

        // Handle Honeycommb's webhook payload structure
        // They send the event data directly, not in {event, data, timestamp} format
        let eventType, eventData;

        if (payload.event && payload.data) {
            // Standard format: {event: "event.created", data: {...}}
            eventType = payload.event;
            eventData = payload.data;
        } else if (payload.type) {
            // Honeycommb format: direct event object
            eventType = `${payload.type}.${payload.id ? 'updated' : 'created'}`;
            eventData = payload;
        } else {
            // Unknown format
            eventType = 'unknown';
            eventData = payload;
        }

        console.log(`🔗 Honeycommb Webhook Received: ${eventType}`, { eventData });

        // Log webhook to database
        await new WebhookLog({
            event: eventType,
            payload,
            ip_address: req.ip,
            user_agent: req.get('User-Agent')
        }).save();

        // Route event to handler
        const result = await routeEvent(eventType, eventData);

        console.log(`✅ Webhook ${eventType} processed successfully`);
        res.json({
            success: true,
            message: `Webhook ${eventType} processed successfully`,
            result
        });

    } catch (error) {
        console.error('❌ Webhook processing error:', error);

        // Log error to database
        try {
            await new WebhookLog({
                event: eventType || 'unknown',
                payload: payload || {},
                status: 'error',
                error_message: error.message,
                ip_address: req.ip,
                user_agent: req.get('User-Agent')
            }).save();
        } catch (logError) {
            console.error('Failed to log webhook error:', logError);
        }

        res.status(500).json({ error: "Webhook processing failed" });
    }
}

/**
 * Get webhook logs
 * GET /api/honeycommb/webhook-logs
 */
async function getWebhookLogs(req, res) {
    try {
        const limit = parseInt(req.query.limit) || 50;
        const logs = await WebhookLog.find()
            .sort({ createdAt: -1 })
            .limit(limit)
            .select('-__v');

        res.json(logs);
    } catch (error) {
        console.error('❌ Error fetching webhook logs:', error);
        res.status(500).json({ error: "Failed to fetch webhook logs" });
    }
}

module.exports = {
    handleWebhook,
    getWebhookLogs
};
