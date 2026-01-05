const express = require('express');
const router = express.Router();
const {
  initiateTelrPayment,
  handleTelrWebhook,
  getPaymentStatus,
  getEventPaymentSummary
} = require('../controllers/payments.controller');

// Payment checkout for existing registration (temporarily no auth for testing)
router.post('/telr/checkout', async (req, res) => {
  try {
    const { registrationId, amount, description } = req.body;

    // For testing without auth, create a test registration if none exists
    let registration;

    if (registrationId && registrationId !== 'test') {
      // Find existing registration
      const Registration = require('../models/Registration');
      registration = await Registration.findById(registrationId);
    }

    if (!registration) {
      // Create a test registration for demo
      const Registration = require('../models/Registration');
      const Event = require('../models/Event');

      // Find the EO Test Event
      const event = await Event.findOne({ title: 'EO Test Event' });

      if (!event) {
        return res.status(404).json({
          success: false,
          error: 'Test event not found'
        });
      }

      // Create test registration without userId for testing
      registration = new Registration({
        eventId: event._id,
        ticketType: amount > 0 ? 'guest' : 'member',
        totalAmount: amount,
        guests: [],
        totalGuests: 1,
        noShowConsent: true,
        status: amount > 0 ? 'pending' : 'confirmed'
      });

      console.log('📝 Creating registration with eventId:', event._id);
      await registration.save();
      console.log('✅ Registration saved with _id:', registration._id, 'eventId:', registration.eventId);
    }

    // Find the event
    console.log('🔍 Looking for event with ID:', registration.eventId);
    const Event = require('../models/Event');
    const event = await Event.findById(registration.eventId);
    console.log('📋 Found event:', event ? event.title : 'NOT FOUND');

    if (!event) {
      return res.status(404).json({
        success: false,
        error: 'Event not found'
      });
    }

    // Create payment checkout
    const telrService = require('../services/telr.service');
    const cartId = telrService.generateCartId(registration._id.toString());

    // For testing: simulate Telr response instead of actual API call
    console.log('🧪 Simulating Telr payment for testing...');

    const telrResponse = {
      success: true,
      order: {
        ref: `TEST_${cartId}`,
        url: `http://localhost:3000/payment/test-success?cartId=${cartId}&amount=${amount}`
      }
    };

    // Uncomment below to use real Telr API (requires valid credentials):
    /*
    const paymentData = {
      cartId,
      amount: amount,
      currency: 'AED',
      description: description || `Registration for ${event.title}`,
      customer: {
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User'
      },
      returnUrls: {
        authorised: `${process.env.FRONTEND_URL || 'http://localhost:8000'}/payment/success?cartId=${cartId}`,
        declined: `${process.env.FRONTEND_URL || 'http://localhost:8000'}/payment/failed?cartId=${cartId}`,
        cancelled: `${process.env.FRONTEND_URL || 'http://localhost:8000'}/payment/cancelled?cartId=${cartId}`
      }
    };

    const telrResponse = await telrService.createOrder(paymentData);
    */

    // Create payment record (skip middleware for testing)
    const Payment = require('../models/Payment');
    const payment = new Payment({
      cartId,
      eventId: registration.eventId.toString(), // Convert to string
      registrationId: registration._id,
      amount: amount,
      currency: 'AED',
      customerEmail: 'test@example.com',
      customerName: 'Test User',
      status: 'INITIATED',
      telrRef: telrResponse.order.ref,
      telrResponse: telrResponse
    });

    // Skip pre-save middleware for testing
    payment.$skipPreSave = true;
    await payment.save();

    res.json({
      success: true,
      checkout: {
        url: telrResponse.order.url,
        cartId: cartId
      }
    });

  } catch (error) {
    console.error('Payment checkout error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create payment checkout'
    });
  }
});

// Payment initiation (public access for event registration)
router.post('/telr/initiate', initiateTelrPayment);

// Payment status check (public)
router.get('/:cartId/status', getPaymentStatus);

// Telr webhook (no auth required - called by Telr servers)
router.post('/webhooks/telr', handleTelrWebhook);

// Test success page (for testing payment flow)
router.get('/test-success', (req, res) => {
  const { cartId, amount } = req.query;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Payment Success - EO Dubai Events</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .success-container {
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
            border-radius: 20px;
            padding: 40px;
            text-align: center;
            max-width: 500px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.3);
        }
        .success-icon {
            font-size: 80px;
            margin-bottom: 20px;
        }
        h1 {
            font-size: 32px;
            margin-bottom: 10px;
        }
        p {
            font-size: 18px;
            margin-bottom: 30px;
            opacity: 0.9;
        }
        .details {
            background: rgba(255, 255, 255, 0.1);
            border-radius: 10px;
            padding: 20px;
            margin-bottom: 30px;
        }
        .details p {
            margin: 5px 0;
            font-size: 16px;
        }
        .btn {
            background: white;
            color: #667eea;
            border: none;
            padding: 15px 30px;
            border-radius: 50px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            text-decoration: none;
            display: inline-block;
            transition: all 0.3s;
        }
        .btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 20px rgba(0,0,0,0.2);
        }
    </style>
</head>
<body>
    <div class="success-container">
        <div class="success-icon">✅</div>
        <h1>Payment Successful!</h1>
        <p>Your registration has been confirmed</p>

        <div class="details">
            <p><strong>Cart ID:</strong> ${cartId || 'N/A'}</p>
            <p><strong>Amount Paid:</strong> AED ${amount || '0'}</p>
            <p><strong>Status:</strong> Confirmed</p>
        </div>

        <a href="http://localhost:8000/index.php" class="btn">Back to Events</a>
    </div>
</body>
</html>`;

  res.send(html);
});

// Admin routes for payment summaries (would need admin auth middleware)
router.get('/admin/events/:eventId/summary', getEventPaymentSummary);

module.exports = router;
