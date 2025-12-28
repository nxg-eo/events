const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: String,
    chapter: { type: String, required: true },
    venue: String,
    location: String,
    coverImage: String,
    gallery: [String],
    eventType: {
        type: String,
        enum: ["in-person", "online", "hybrid"],
        default: "in-person"
    },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    startTime: String,
    endTime: String,
    timezone: { type: String, default: "Asia/Dubai" },
    capacity: { type: Number, required: true, default: 100 },
    memberPrice: { type: Number, default: 0 },
    guestPrice: { type: Number, default: 0 },
    ticketTypes: [{
        name: String,
        type: { type: String, enum: ["member", "spouse", "guest", "accelerator", "next_gen", "key_executive"] },
        price: Number,
        quantity: Number,
        sold: { type: Number, default: 0 },
        available: Number,
        description: String
    }],
    seatAllocation: {
        members: { allocated: Number, used: { type: Number, default: 0 } },
        spouses: { allocated: Number, used: { type: Number, default: 0 } },
        guests: { allocated: Number, used: { type: Number, default: 0 } }
    },
    isEODubaiOnly: { type: Boolean, default: false },
    allowGuests: { type: Boolean, default: true },
    maxGuestsPerRegistration: { type: Number, default: 5 },
    registrationOpenDate: Date,
    registrationCloseDate: Date,
    requiresApproval: { type: Boolean, default: false },
    waitlistEnabled: { type: Boolean, default: true },
    contactEmail: String,
    contactPhone: String,
    status: {
        type: String,
        enum: ["draft", "upcoming", "ongoing", "completed", "cancelled"],
        default: "upcoming"
    },
    tags: [String],
    category: String,
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    organizers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }]
}, { timestamps: true });

module.exports = mongoose.model("Event", eventSchema);
