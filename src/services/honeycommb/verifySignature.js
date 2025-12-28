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
            console.error('❌ Missing X-Honeycommb-Signature header');
            return false;
        }

        // Compute expected signature
        const expectedSignature = 'sha1=' + crypto
            .createHmac('sha1', config.WEBHOOK_SECRET)
            .update(rawBody, 'utf8')
            .digest('hex');

        // Use timing-safe comparison to prevent timing attacks
        const isValid = crypto.timingSafeEqual(
            Buffer.from(expectedSignature, 'utf8'),
            Buffer.from(signatureHeader, 'utf8')
        );

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
