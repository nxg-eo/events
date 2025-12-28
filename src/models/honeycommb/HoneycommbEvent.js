const mongoose = require('mongoose');

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
    // Additional fields for events
    status: { type: String, enum: ["upcoming", "ongoing", "completed", "cancelled"], default: "upcoming" },
    capacity: Number,
    rsvp_count: { type: Number, default: 0 },
    featured: { type: Boolean, default: false },
    flagged: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model("HoneycommbEvent", honeycommbEventSchema);
