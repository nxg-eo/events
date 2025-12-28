const mongoose = require('mongoose');

const honeycommbUserSchema = new mongoose.Schema({
    hc_user_id: { type: Number, required: true, unique: true },
    name: { type: String, required: true },
    email: { type: String, required: true },
    username: String,
    status: { type: String, enum: ["active", "inactive", "pending", "approved"], default: "active" },
    created_at: { type: Date, required: true },
    updated_at: { type: Date, default: Date.now },
    last_webhook_received: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model("HoneycommbUser", honeycommbUserSchema);
