const mongoose = require('mongoose');

const honeycommbPaymentSchema = new mongoose.Schema({
    hc_payment_id: { type: Number, required: true, unique: true },
    user_id: { type: Number, required: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: "AED" },
    status: { type: String, enum: ["pending", "completed", "failed", "refunded"], default: "pending" },
    payment_type: { type: String, enum: ["subscription", "event", "donation"], default: "subscription" },
    created_at: { type: Date, required: true },
    updated_at: { type: Date, default: Date.now },
    last_webhook_received: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model("HoneycommbPayment", honeycommbPaymentSchema);
