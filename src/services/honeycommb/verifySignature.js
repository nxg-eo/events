const crypto = require('crypto');
const config = require('../../config/honeycommb.config');

/**
 * Verify Honeycommb webhook signature
 * @param {string} rawBody - Raw request body
 * @param {string} signatureHeader - X-Honeycommb-Signature header
 * @returns {boolean} - True if signature is valid
 */
function verifySignature(rawBody, signatureHeader) {
    try {
        if (!config.WEBHOOK_SECRET) {
            console.error('❌ HONEYCOMMB_WEBHOOK_SECRET not configured');
            return false;
        }

        if (!signatureHeader) {
            console.warn('⚠️ Missing X-Honeycommb-Signature header (expected during testing)');
            return false;
        }

        // Compute expected signature
        const expectedSignature = 'sha1=' + crypto
            .createHmac('sha1', config.WEBHOOK_SECRET)
            .update(rawBody, 'utf8')
            .digest('hex');

        // Handle signature header format (may or may not include 'sha1=' prefix)
        let receivedSignature = signatureHeader;
        if (signatureHeader.startsWith('sha1=')) {
            receivedSignature = signatureHeader.substring(5);
        }

        // For security, use constant-time comparison when lengths match
        let isValid = false;
        if (expectedSignature.length === receivedSignature.length) {
            try {
                isValid = crypto.timingSafeEqual(
                    Buffer.from(expectedSignature, 'utf8'),
                    Buffer.from(receivedSignature, 'utf8')
                );
            } catch (timingError) {
                // Fall back to regular comparison if timing-safe fails
                isValid = expectedSignature === receivedSignature;
            }
        } else {
            // Lengths don't match, definitely invalid
            isValid = false;
        }

        if (isValid) {
            console.log('✅ Webhook signature verified');
        } else {
            console.error('❌ Invalid webhook signature');
            console.error('Expected:', expectedSignature);
            console.error('Received:', signatureHeader);
        }

        return isValid;
    } catch (error) {
        console.error('❌ Signature verification error:', error);
        return false;
    }
}

module.exports = {
    verifySignature
};
