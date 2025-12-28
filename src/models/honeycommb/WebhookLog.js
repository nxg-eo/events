const mongoose = require('mongoose');

const webhookLogSchema = new mongoose.Schema({
    event: { type: String, required: true },
    payload: { type: mongoose.Schema.Types.Mixed, required: true },
    processed_at: { type: Date, default: Date.now },
    status: { type: String, enum: ["success", "error"], default: "success" },
    error_message: String,
    ip_address: String,
    user_agent: String,
    // Retry mechanism fields
    retry_count: { type: Number, default: 0 },
    last_retry: Date
}, { timestamps: true });

module.exports = mongoose.model("WebhookLog", webhookLogSchema);
