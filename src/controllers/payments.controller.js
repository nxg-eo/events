const Payment = require('../models/Payment');
const Event = require('../models/Event');
const telrService = require('../services/telr.service');
const googleSheetsService = require('../services/googleSheets.service');

/**
 * Initialize Telr payment for an event
 * POST /api/payments/telr/initiate
 */
const initiateTelrPayment = async (req, res) => {
  try {
    const {
      eventId,
      customerEmail,
      customerName,
      customerPhone,
      amount,
      description
    } = req.body;

    // Validate required fields
    if (!eventId || !customerEmail || !customerName || !amount) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: eventId, customerEmail, customerName, amount'
      });
    }

    // Check if event exists and supports payments
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        error: 'Event not found'
      });
    }

    if (event.payment.mode !== 'PAID' || event.payment.gateway !== 'TELR') {
      return res.status(400).json({
        success: false,
        error: 'Event does not support Telr payments'
      });
    }

    // Validate payment amount
    if (amount !== event.payment.amount) {
      return res.status(400).json({
        success: false,
        error: 'Payment amount mismatch'
      });
    }

    // Generate unique cart ID
    const cartId = telrService.generateCartId(eventId);

    // Create payment record in database
    const payment = new Payment({
      cartId,
      eventId,
      amount,
      currency: event.payment.currency,
      customerEmail,
      customerName,
      customerPhone,
      status: 'INITIATED'
    });

    await payment.save();

    // Prepare Telr order data
    const paymentData = {
      cartId,
      amount,
      currency: event.payment.currency,
      description: description || `Registration for ${event.title}`,
      customer: {
        email: customerEmail,
        firstName: customerName.split(' ')[0] || customerName,
        lastName: customerName.split(' ').slice(1).join(' ') || ''
      },
      returnUrls: {
        authorised: `${process.env.FRONTEND_URL}/payment/success?cartId=${cartId}`,
        declined: `${process.env.FRONTEND_URL}/payment/failed?cartId=${cartId}`,
        cancelled: `${process.env.FRONTEND_URL}/payment/cancelled?cartId=${cartId}`
      }
    };

    // Create Telr order
    const telrResponse = await telrService.createOrder(paymentData);

    // Update payment with Telr reference
    payment.telrRef = telrResponse.order.ref;
    payment.telrResponse = telrResponse;
    await payment.save();

    res.json({
      success: true,
      cartId,
      telrRef: telrResponse.order.ref,
      paymentUrl: telrResponse.order.url
    });

  } catch (error) {
    console.error('Telr payment initiation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to initiate payment'
    });
  }
};

/**
 * Handle Telr webhook for payment verification
 * POST /api/webhooks/telr
 */
const handleTelrWebhook = async (req, res) => {
  try {
    const webhookData = req.body;

    // Process webhook data
    const processedData = telrService.processWebhookData(webhookData);

    // Find payment record
    const payment = await Payment.findOne({ cartId: processedData.cartId });
    if (!payment) {
      console.error('Payment not found for cartId:', processedData.cartId);
      return res.status(404).json({ error: 'Payment not found' });
    }

    // Prevent duplicate processing
    if (payment.status === 'SUCCESS') {
      return res.json({ status: 'already_processed' });
    }

    // Validate payment amount
    const isAmountValid = telrService.validatePaymentAmount(
      payment.amount,
      processedData.amount,
      payment.currency,
      processedData.currency
    );

    if (!isAmountValid) {
      console.error('Amount validation failed for payment:', payment._id);
      // Flag for fraud monitoring
      payment.status = 'FAILED';
      payment.webhookData = webhookData;
      await payment.save();

      return res.status(400).json({ error: 'Amount validation failed' });
    }

    // Update payment status
    payment.status = processedData.status;
    payment.transactionId = processedData.transactionId;
    payment.processedAt = new Date();
    payment.webhookData = webhookData;
    await payment.save();

    // If payment successful, add to Google Sheets
    if (processedData.status === 'SUCCESS') {
      await processSuccessfulPayment(payment);
    }

    res.json({
      status: 'processed',
      paymentId: payment._id,
      paymentStatus: payment.status
    });

  } catch (error) {
    console.error('Telr webhook processing error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
};

/**
 * Process successful payment - add to Google Sheets
 */
const processSuccessfulPayment = async (payment) => {
  try {
    // Get event details
    const event = await Event.findById(payment.eventId);
    if (!event || !event.googleSheets) {
      console.error('Event or Google Sheets not configured for payment:', payment._id);
      return;
    }

    // Determine user category (this would come from registration data)
    // For now, default to EO Others - this should be determined from user registration
    const userCategory = 'EO_OTHERS'; // This should be dynamic based on user type
    const sheetName = googleSheetsService.getSheetNameForCategory(userCategory);

    // Prepare registration data
    const registrationData = {
      name: payment.customerName,
      email: payment.customerEmail,
      phone: payment.customerPhone || '',
      company: '', // This should come from registration form
      category: userCategory,
      paymentId: payment.transactionId,
      amount: payment.amount,
      status: 'CONFIRMED'
    };

    // Add to appropriate Google Sheet
    const spreadsheetId = event.googleSheets.members_spouses; // All sheets use same spreadsheet
    await googleSheetsService.appendRegistration(spreadsheetId, sheetName, registrationData);

    console.log('Successfully added registration to Google Sheets for payment:', payment._id);

  } catch (error) {
    console.error('Failed to process successful payment:', error);
    // Don't throw error here as payment was successful, just log the issue
  }
};

/**
 * Get payment status
 * GET /api/payments/:cartId/status
 */
const getPaymentStatus = async (req, res) => {
  try {
    const { cartId } = req.params;

    const payment = await Payment.findOne({ cartId });
    if (!payment) {
      return res.status(404).json({
        success: false,
        error: 'Payment not found'
      });
    }

    res.json({
      success: true,
      payment: {
        cartId: payment.cartId,
        status: payment.status,
        amount: payment.amount,
        currency: payment.currency,
        createdAt: payment.createdAt,
        processedAt: payment.processedAt
      }
    });

  } catch (error) {
    console.error('Get payment status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get payment status'
    });
  }
};

/**
 * Get event payment summary (Admin only)
 * GET /api/admin/events/:eventId/payments/summary
 */
const getEventPaymentSummary = async (req, res) => {
  try {
    const { eventId } = req.params;

    const summary = await Payment.getPaymentSummary(eventId);

    res.json({
      success: true,
      summary
    });

  } catch (error) {
    console.error('Get payment summary error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get payment summary'
    });
  }
};

module.exports = {
  initiateTelrPayment,
  handleTelrWebhook,
  getPaymentStatus,
  getEventPaymentSummary,
  processSuccessfulPayment
};
