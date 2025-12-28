const { verifySignature } = require('../../services/honeycommb/verifySignature');
const { routeEvent } = require('../../services/honeycommb/eventRouter');
const mongoose = require('mongoose');

// Webhook Log Model
const webhookLogSchema = new mongoose.Schema({
    event: { type: String, required: true },
    payload: { type: mongoose.Schema.Types.Mixed, required: true },
    processed_at: { type: Date, default: Date.now },
    status: { type: String, enum: ["success", "error"], default: "success" },
    error_message: String,
    ip_address: String,
    user_agent: String
}, { timestamps: true });

const WebhookLog = mongoose.model("WebhookLog", webhookLogSchema);

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
        const { event, data, timestamp } = payload;

        console.log(`🔗 Honeycommb Webhook Received: ${event}`, { data, timestamp });

        // Log webhook to database
        await new WebhookLog({
            event,
            payload,
            ip_address: req.ip,
            user_agent: req.get('User-Agent')
        }).save();

        // Route event to handler
        const result = await routeEvent(event, data);

        console.log(`✅ Webhook ${event} processed successfully`);
        res.json({
            success: true,
            message: `Webhook ${event} processed successfully`,
            result
        });

    } catch (error) {
        console.error('❌ Webhook processing error:', error);

        // Log error to database
        try {
            await new WebhookLog({
                event: req.body?.event || 'unknown',
                payload: req.body || {},
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

module.exports = {
    handleWebhook
};
