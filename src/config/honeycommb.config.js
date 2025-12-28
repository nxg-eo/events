const config = require('./env');

module.exports = {
    WEBHOOK_SECRET: config.HONEYCOMMB_WEBHOOK_SECRET,
    WEBHOOK_EVENTS: {
        // User Events
        USER_CREATED: 'user.created',
        USER_UPDATED: 'user.updated',
        USER_DESTROYED: 'user.destroyed',
        USER_APPROVED: 'user.approved',
        USER_FLAGGED: 'user.flagged',

        // Post Events
        POST_CREATED: 'post.created',
        POST_UPDATED: 'post.updated',
        POST_DESTROYED: 'post.destroyed',
        POST_FEATURED: 'post.featured',
        POST_FLAGGED: 'post.flagged',

        // Event Events
        EVENT_CREATED: 'event.created',
        EVENT_UPDATED: 'event.updated',
        EVENT_DESTROYED: 'event.destroyed',
        EVENT_RSVP_CREATED: 'event.rsvp.created',
        EVENT_RSVP_UPDATED: 'event.rsvp.updated',
        EVENT_RSVP_DESTROYED: 'event.rsvp.destroyed',

        // Payment Events
        PAYMENT_COMPLETED: 'payment.completed',
        PAYMENT_FAILED: 'payment.failed',
        SUBSCRIPTION_UPDATED: 'billing.subscription.updated',
        SUBSCRIPTION_CANCELED: 'billing.subscription.canceled',
        SUBSCRIPTION_RESTORED: 'billing.subscription.recurring_payment_restored',

        // Group Events
        GROUP_JOIN_REQUEST_CREATED: 'group.join_request.created',
        GROUP_JOIN_REQUEST_UPDATED: 'group.join_request.updated',
        GROUP_CHAT_MESSAGE_CREATED: 'group.chat_message.created',

        // Interaction Events
        LIKE_CREATED: 'like.created',
        LIKE_DESTROYED: 'like.destroyed',
        FOLLOW_CREATED: 'follow.created',
        FOLLOW_DESTROYED: 'follow.destroyed'
    },

    // Collections mapping
    COLLECTIONS: {
        USERS: 'honeycommbusers',
        POSTS: 'honeycommbposts',
        EVENTS: 'honeycommbevents',
        PAYMENTS: 'honeycommbpayments',
        GROUPS: 'honeycommbgroups',
        WEBHOOK_LOGS: 'webhooklogs'
    }
};
