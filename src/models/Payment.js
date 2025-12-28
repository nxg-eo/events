const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
    registrationId: { type: mongoose.Schema.Types.ObjectId, ref: "Registration", required: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: "AED" },
    paymentMethod: {
        type: String,
        enum: ["telr", "auto_charge", "manual", "bank_transfer", "cash"],
        required: true
    },
    paymentReference: String,
    transactionRef: String,
    telrRef: String,
    status: {
        type: String,
        enum: ["pending", "completed", "failed", "refunded", "cancelled"],
        default: "pending"
    },
    paymentType: {
        type: String,
        enum: ["registration", "penalty", "refund"],
        default: "registration"
    },
    telrResponse: mongoose.Schema.Types.Mixed,
    notes: String,
    processedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
}, { timestamps: true });

module.exports = mongoose.model("Payment", paymentSchema);
