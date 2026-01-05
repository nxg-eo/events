const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: String,
    chapter: { type: String, required: true },
    venue: String,
    location: String,
    coverImage: String,
    mainEventPhoto: String,
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

    // New fields for Telr payment system
    source: {
        type: String,
        enum: ["HONEYCOMMB", "WEBSITE_ADMIN"],
        required: true,
        default: "WEBSITE_ADMIN"
    },
    visibility: {
        type: String,
        enum: ["EO_MEMBERS_ONLY", "OPEN_FOR_ALL", "GUEST_EVENT"],
        required: true,
        default: "EO_MEMBERS_ONLY"
    },
    payment: {
        mode: {
            type: String,
            enum: ["FREE", "PAID"],
            default: "FREE"
        },
        amount: { type: Number, default: 0 },
        currency: { type: String, default: "AED" },
        gateway: {
            type: String,
            enum: ["TELR", "OTHER"],
            default: "TELR"
        }
    },
    googleSheets: {
        eo_dubai: { type: String, sparse: true },
        eo_others: { type: String, sparse: true }
    },

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
    organizers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

    // Analytics and Metrics
    metrics: {
        views: { type: Number, default: 0 },
        clicks: { type: Number, default: 0 },
        registrations: { type: Number, default: 0 },
        shares: { type: Number, default: 0 },
        lastViewed: Date,
        engagement: {
            totalTimeSpent: { type: Number, default: 0 }, // in seconds
            averageTimeSpent: { type: Number, default: 0 }, // in seconds
            bounceRate: { type: Number, default: 0 } // percentage
        },
        demographics: {
            countries: [{ country: String, count: Number }],
            cities: [{ city: String, count: Number }],
            ageGroups: [{ range: String, count: Number }],
            professions: [{ profession: String, count: Number }]
        },
        traffic: {
            sources: [{ source: String, count: Number }],
            referrers: [{ url: String, count: Number }],
            devices: [{ type: String, count: Number }],
            browsers: [{ name: String, count: Number }]
        }
    }
}, { timestamps: true });

module.exports = mongoose.model("Event", eventSchema);
