const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  cartId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  eventId: {
    type: String,
    required: true,
    index: true
  },
  telrRef: {
    type: String,
    sparse: true,
    index: true
  },
  transactionId: {
    type: String,
    sparse: true,
    unique: true,
    index: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    required: true,
    default: 'AED'
  },
  status: {
    type: String,
    enum: ['INITIATED', 'PENDING', 'SUCCESS', 'FAILED', 'CANCELLED', 'REFUNDED'],
    default: 'INITIATED',
    index: true
  },
  customerEmail: {
    type: String,
    required: true,
    index: true
  },
  customerName: {
    type: String,
    required: true
  },
  customerPhone: {
    type: String
  },
  paymentMethod: {
    type: String,
    enum: ['TELR', 'OTHER'],
    default: 'TELR'
  },
  telrResponse: {
    type: mongoose.Schema.Types.Mixed
  },
  webhookData: {
    type: mongoose.Schema.Types.Mixed
  },
  processedAt: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes for performance
paymentSchema.index({ eventId: 1, status: 1 });
paymentSchema.index({ customerEmail: 1, eventId: 1 });
paymentSchema.index({ createdAt: -1 });

// Pre-save middleware (temporarily disabled for testing)
/*
paymentSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});
*/

// Static methods
paymentSchema.statics.findByCartId = function(cartId) {
  return this.findOne({ cartId });
};

paymentSchema.statics.findByTransactionId = function(transactionId) {
  return this.findOne({ transactionId });
};

paymentSchema.statics.getEventPayments = function(eventId, status = null) {
  const query = { eventId };
  if (status) query.status = status;
  return this.find(query).sort({ createdAt: -1 });
};

paymentSchema.statics.getPaymentSummary = function(eventId) {
  return this.aggregate([
    { $match: { eventId } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalAmount: { $sum: '$amount' }
      }
    }
  ]);
};

module.exports = mongoose.model('Payment', paymentSchema);
