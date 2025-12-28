const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: "Event" },
    type: {
        type: String,
        enum: ["email", "whatsapp", "sms"],
        required: true
    },
    subject: String,
    message: String,
    status: {
        type: String,
        enum: ["pending", "sent", "failed"],
        default: "pending"
    },
    sentAt: Date,
    error: String
}, { timestamps: true });

module.exports = mongoose.model("Notification", notificationSchema);
