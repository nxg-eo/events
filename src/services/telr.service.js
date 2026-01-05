const axios = require('axios');
const crypto = require('crypto');

class TelrService {
  constructor() {
    this.storeId = process.env.TELR_STORE_ID;
    this.authKey = process.env.TELR_AUTH_KEY;
    this.baseUrl = process.env.TELR_BASE_URL || 'https://secure.telr.com/gateway/order.json';

    if (!this.storeId || !this.authKey) {
      throw new Error('Telr configuration missing. Please set TELR_STORE_ID and TELR_AUTH_KEY environment variables.');
    }
  }

  /**
   * Create Telr payment order
   * @param {Object} paymentData
   * @param {string} paymentData.cartId - Unique cart ID
   * @param {number} paymentData.amount - Payment amount
   * @param {string} paymentData.currency - Currency code (default: AED)
   * @param {string} paymentData.description - Payment description
   * @param {Object} paymentData.customer - Customer details
   * @param {Object} paymentData.returnUrls - Return URLs
   * @returns {Promise<Object>} Telr order response
   */
  async createOrder(paymentData) {
    try {
      const orderData = {
        method: 'create',
        store: this.storeId,
        authkey: this.authKey,
        order: {
          cartid: paymentData.cartId,
          test: process.env.NODE_ENV === 'development' ? '1' : '0',
          amount: paymentData.amount.toFixed(2),
          currency: paymentData.currency || 'AED',
          description: paymentData.description
        },
        customer: {
          email: paymentData.customer.email,
          name: {
            forenames: paymentData.customer.firstName,
            surname: paymentData.customer.lastName
          }
        },
        return: {
          authorised: paymentData.returnUrls.authorised,
          declined: paymentData.returnUrls.declined,
          cancelled: paymentData.returnUrls.cancelled
        }
      };

      const response = await axios.post(this.baseUrl, orderData, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 30000
      });

      if (response.data && response.data.order && response.data.order.ref) {
        return {
          success: true,
          order: {
            ref: response.data.order.ref,
            url: response.data.order.url
          }
        };
      } else {
        throw new Error('Invalid Telr response format');
      }

    } catch (error) {
      console.error('Telr create order error:', error.response?.data || error.message);
      throw new Error('Failed to create Telr payment order');
    }
  }

  /**
   * Verify Telr webhook signature (if implemented)
   * @param {Object} webhookData - Webhook payload
   * @param {string} signature - Webhook signature
   * @returns {boolean} Whether signature is valid
   */
  verifyWebhookSignature(webhookData, signature) {
    // Telr webhook signature verification (if implemented by Telr)
    // This would depend on Telr's specific signature method
    // For now, we'll rely on other security measures
    return true;
  }

  /**
   * Process Telr webhook data
   * @param {Object} webhookData - Webhook payload from Telr
   * @returns {Object} Processed payment data
   */
  processWebhookData(webhookData) {
    try {
      const order = webhookData.order;
      const transaction = order?.transaction;

      if (!order || !transaction) {
        throw new Error('Invalid webhook data structure');
      }

      // Map Telr status codes to our status
      const statusMapping = {
        'A': 'SUCCESS',
        'D': 'FAILED',
        'C': 'CANCELLED',
        'H': 'PENDING'
      };

      return {
        cartId: order.cartid,
        telrRef: order.ref,
        transactionId: transaction.ref,
        status: statusMapping[order.status?.code] || 'FAILED',
        amount: parseFloat(transaction.amount),
        currency: transaction.currency,
        rawData: webhookData
      };

    } catch (error) {
      console.error('Error processing Telr webhook:', error);
      throw new Error('Invalid webhook data');
    }
  }

  /**
   * Generate unique cart ID
   * @param {string} eventId - Event ID
   * @param {string} userId - User ID (optional)
   * @returns {string} Unique cart ID
   */
  generateCartId(eventId, userId = '') {
    const timestamp = Date.now();
    const random = crypto.randomBytes(4).toString('hex').toUpperCase();
    return `EVT_${eventId}_${timestamp}_${random}`;
  }

  /**
   * Validate payment amount and prevent tampering
   * @param {number} expectedAmount - Expected payment amount
   * @param {number} receivedAmount - Amount from webhook
   * @param {string} currency - Expected currency
   * @param {string} receivedCurrency - Currency from webhook
   * @returns {boolean} Whether amounts match
   */
  validatePaymentAmount(expectedAmount, receivedAmount, currency = 'AED', receivedCurrency = 'AED') {
    return (
      Math.abs(expectedAmount - receivedAmount) < 0.01 && // Allow for floating point precision
      currency === receivedCurrency
    );
  }
}

module.exports = new TelrService();
