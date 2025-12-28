const mongoose = require('mongoose');

const registrationSchema = new mongoose.Schema({
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: "Event", required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    ticketType: { type: String, required: true },
    status: {
        type: String,
        enum: ["pending", "confirmed", "cancelled", "interested", "waitlisted", "approved", "rejected"],
        default: "pending"
    },
    isGroupRegistration: { type: Boolean, default: false },
    groupLeader: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    totalGuests: { type: Number, default: 1 },
    guests: [{
        name: String,
        email: String,
        phone: String,
        relationship: String,
        ticketType: String
    }],
    totalAmount: { type: Number, required: true },
    paymentStatus: {
        type: String,
        enum: ["pending", "completed", "failed", "refunded", "partial"],
        default: "pending"
    },
    noShowConsent: { type: Boolean, default: false },
    attended: { type: Boolean, default: false },
    checkInTime: Date,
    qrCode: String,
    specialRequirements: String,
    dietaryRestrictions: [String],
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    approvedAt: Date,
    rejectionReason: String
}, { timestamps: true });

module.exports = mongoose.model("Registration", registrationSchema);
