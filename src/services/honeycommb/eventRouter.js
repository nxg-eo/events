const config = require('../../config/honeycommb.config');

/**
 * Route webhook events to their handlers
 * @param {string} event - Webhook event type
 * @param {object} data - Webhook payload data
 * @returns {Promise} - Handler result
 */
async function routeEvent(event, data) {
    try {
        switch (event) {
            // User Events
            case config.WEBHOOK_EVENTS.USER_CREATED:
                return await require('./handlers/user.handler').handleUserCreated(data);
            case config.WEBHOOK_EVENTS.USER_UPDATED:
                return await require('./handlers/user.handler').handleUserUpdated(data);
            case config.WEBHOOK_EVENTS.USER_DESTROYED:
                return await require('./handlers/user.handler').handleUserDestroyed(data);
            case config.WEBHOOK_EVENTS.USER_APPROVED:
                return await require('./handlers/user.handler').handleUserApproved(data);
            case config.WEBHOOK_EVENTS.USER_FLAGGED:
                return await require('./handlers/user.handler').handleUserFlagged(data);

            // Post Events
            case config.WEBHOOK_EVENTS.POST_CREATED:
                return await require('./handlers/post.handler').handlePostCreated(data);
            case config.WEBHOOK_EVENTS.POST_UPDATED:
                return await require('./handlers/post.handler').handlePostUpdated(data);
            case config.WEBHOOK_EVENTS.POST_DESTROYED:
                return await require('./handlers/post.handler').handlePostDestroyed(data);
            case config.WEBHOOK_EVENTS.POST_FEATURED:
                return await require('./handlers/post.handler').handlePostFeatured(data);
            case config.WEBHOOK_EVENTS.POST_FLAGGED:
                return await require('./handlers/post.handler').handlePostFlagged(data);

            // Event Events
            case config.WEBHOOK_EVENTS.EVENT_CREATED:
                return await require('./handlers/event.handler').handleEventCreated(data);
            case config.WEBHOOK_EVENTS.EVENT_UPDATED:
                return await require('./handlers/event.handler').handleEventUpdated(data);
            case config.WEBHOOK_EVENTS.EVENT_DESTROYED:
                return await require('./handlers/event.handler').handleEventDestroyed(data);
            case config.WEBHOOK_EVENTS.EVENT_RSVP_CREATED:
                return await require('./handlers/event.handler').handleEventRSVP(data, 'created');
            case config.WEBHOOK_EVENTS.EVENT_RSVP_UPDATED:
                return await require('./handlers/event.handler').handleEventRSVP(data, 'updated');
            case config.WEBHOOK_EVENTS.EVENT_RSVP_DESTROYED:
                return await require('./handlers/event.handler').handleEventRSVP(data, 'destroyed');

            // Payment Events
            case config.WEBHOOK_EVENTS.PAYMENT_COMPLETED:
                return await require('./handlers/payment.handler').handlePaymentCompleted(data);
            case config.WEBHOOK_EVENTS.PAYMENT_FAILED:
                return await require('./handlers/payment.handler').handlePaymentFailed(data);
            case config.WEBHOOK_EVENTS.SUBSCRIPTION_UPDATED:
                return await require('./handlers/payment.handler').handleSubscriptionUpdated(data);
            case config.WEBHOOK_EVENTS.SUBSCRIPTION_CANCELED:
                return await require('./handlers/payment.handler').handleSubscriptionCanceled(data);
            case config.WEBHOOK_EVENTS.SUBSCRIPTION_RESTORED:
                return await require('./handlers/payment.handler').handleSubscriptionRestored(data);

            // Group Events
            case config.WEBHOOK_EVENTS.GROUP_JOIN_REQUEST_CREATED:
                return await require('./handlers/group.handler').handleGroupJoinRequest(data, 'created');
            case config.WEBHOOK_EVENTS.GROUP_JOIN_REQUEST_UPDATED:
                return await require('./handlers/group.handler').handleGroupJoinRequest(data, 'updated');
            case config.WEBHOOK_EVENTS.GROUP_CHAT_MESSAGE_CREATED:
                return await require('./handlers/group.handler').handleGroupChatMessage(data);

            // Interaction Events
            case config.WEBHOOK_EVENTS.LIKE_CREATED:
                return await require('./handlers/interaction.handler').handleLikeCreated(data);
            case config.WEBHOOK_EVENTS.LIKE_DESTROYED:
                return await require('./handlers/interaction.handler').handleLikeDestroyed(data);
            case config.WEBHOOK_EVENTS.FOLLOW_CREATED:
                return await require('./handlers/interaction.handler').handleFollowCreated(data);
            case config.WEBHOOK_EVENTS.FOLLOW_DESTROYED:
                return await require('./handlers/interaction.handler').handleFollowDestroyed(data);

            default:
                console.log(`⚠️ Unhandled webhook event: ${event}`);
                return { status: 'ignored', message: `Event ${event} not handled` };
        }
    } catch (error) {
        console.error(`❌ Error routing event ${event}:`, error);
        throw error;
    }
}

module.exports = {
    routeEvent
};
