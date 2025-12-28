const mongoose = require('mongoose');

const waitlistSchema = new mongoose.Schema({
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: "Event", required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    ticketType: String,
    priority: { type: Number, default: 0 },
    status: {
        type: String,
        enum: ["waiting", "notified", "registered", "expired"],
        default: "waiting"
    },
    notifiedAt: Date,
    expiresAt: Date
}, { timestamps: true });

module.exports = mongoose.model("Waitlist", waitlistSchema);
