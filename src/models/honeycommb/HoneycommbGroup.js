const mongoose = require('mongoose');

const honeycommbGroupSchema = new mongoose.Schema({
    hc_group_id: { type: Number, required: true, unique: true },
    name: { type: String, required: true },
    description: String,
    created_at: { type: Date, required: true },
    updated_at: { type: Date, default: Date.now },
    last_webhook_received: { type: Date, default: Date.now },
    // Additional fields
    member_count: { type: Number, default: 0 },
    is_private: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model("HoneycommbGroup", honeycommbGroupSchema);
