const mongoose = require('mongoose');
const WebhookLog = require('../models/honeycommb/WebhookLog');
const { routeEvent } = require('../services/honeycommb/eventRouter');

/**
 * Webhook Retry Job
 * Handles failed webhooks due to downtime or Railway restarts
 * Runs periodically to retry failed webhook processing
 */

class WebhookRetryJob {
    constructor() {
        this.maxRetries = 3;
        this.retryDelay = 5 * 60 * 1000; // 5 minutes
        this.batchSize = 10;
    }

    /**
     * Process failed webhooks
     */
    async processFailedWebhooks() {
        try {
            console.log('🔄 Starting webhook retry job...');

            // Find failed webhooks that haven't exceeded max retries
            const failedWebhooks = await WebhookLog.find({
                status: 'error',
                'retry_count': { $lt: this.maxRetries },
                $or: [
                    { last_retry: { $exists: false } },
                    { last_retry: { $lt: new Date(Date.now() - this.retryDelay) } }
                ]
            }).limit(this.batchSize);

            console.log(`📋 Found ${failedWebhooks.length} failed webhooks to retry`);

            let successCount = 0;
            let permanentFailureCount = 0;

            for (const webhook of failedWebhooks) {
                try {
                    // Attempt to reprocess the webhook
                    const result = await routeEvent(webhook.event, webhook.payload.data);

                    // Update webhook log on success
                    await WebhookLog.findByIdAndUpdate(webhook._id, {
                        status: 'success',
                        processed_at: new Date(),
                        retry_count: (webhook.retry_count || 0) + 1,
                        error_message: null,
                        last_retry: new Date()
                    });

                    console.log(`✅ Successfully retried webhook: ${webhook.event} (${webhook._id})`);
                    successCount++;

                } catch (error) {
                    const retryCount = (webhook.retry_count || 0) + 1;

                    if (retryCount >= this.maxRetries) {
                        // Mark as permanent failure
                        await WebhookLog.findByIdAndUpdate(webhook._id, {
                            status: 'error',
                            error_message: `Permanent failure after ${this.maxRetries} retries: ${error.message}`,
                            retry_count: retryCount,
                            last_retry: new Date()
                        });

                        console.log(`❌ Permanent failure for webhook: ${webhook.event} (${webhook._id})`);
                        permanentFailureCount++;
                    } else {
                        // Update retry count and schedule next retry
                        await WebhookLog.findByIdAndUpdate(webhook._id, {
                            retry_count: retryCount,
                            last_retry: new Date(),
                            error_message: error.message
                        });

                        console.log(`⏰ Scheduled retry ${retryCount}/${this.maxRetries} for webhook: ${webhook.event} (${webhook._id})`);
                    }
                }
            }

            console.log(`🔄 Webhook retry job completed: ${successCount} successful, ${permanentFailureCount} permanent failures`);

            return {
                processed: failedWebhooks.length,
                successful: successCount,
                permanentFailures: permanentFailureCount
            };

        } catch (error) {
            console.error('❌ Webhook retry job failed:', error);
            throw error;
        }
    }

    /**
     * Get retry statistics
     */
    async getRetryStats() {
        try {
            const stats = await WebhookLog.aggregate([
                {
                    $group: {
                        _id: '$status',
                        count: { $sum: 1 },
                        avgRetries: { $avg: '$retry_count' },
                        maxRetries: { $max: '$retry_count' }
                    }
                }
            ]);

            const totalFailed = await WebhookLog.countDocuments({ status: 'error' });
            const pendingRetries = await WebhookLog.countDocuments({
                status: 'error',
                retry_count: { $lt: this.maxRetries }
            });

            return {
                stats,
                totalFailed,
                pendingRetries,
                maxRetries: this.maxRetries
            };

        } catch (error) {
            console.error('❌ Failed to get retry stats:', error);
            throw error;
        }
    }

    /**
     * Clean up old successful webhooks (optional maintenance)
     */
    async cleanupOldWebhooks(daysOld = 30) {
        try {
            const cutoffDate = new Date(Date.now() - (daysOld * 24 * 60 * 60 * 1000));

            const result = await WebhookLog.deleteMany({
                status: 'success',
                processed_at: { $lt: cutoffDate }
            });

            console.log(`🧹 Cleaned up ${result.deletedCount} old successful webhooks`);
            return result.deletedCount;

        } catch (error) {
            console.error('❌ Failed to cleanup old webhooks:', error);
            throw error;
        }
    }
}

// Export singleton instance
module.exports = new WebhookRetryJob();
