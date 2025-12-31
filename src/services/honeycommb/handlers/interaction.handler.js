/**
 * Interaction event handlers for Honeycommb webhooks
 * These are stub implementations for future social interaction features
 */

async function handleLikeCreated(data) {
    console.log(`👍 Honeycommb Like Created: ${data.user?.name || data.user_id} liked ${data.post?.title || data.post_id}`);
    return { status: 'ignored', message: 'Interaction events not implemented yet' };
}

async function handleLikeDestroyed(data) {
    console.log(`👎 Honeycommb Like Removed: ${data.user?.name || data.user_id} unliked ${data.post?.title || data.post_id}`);
    return { status: 'ignored', message: 'Interaction events not implemented yet' };
}

async function handleFollowCreated(data) {
    console.log(`👤 Honeycommb Follow Created: ${data.follower?.name || data.follower_id} → ${data.followed?.name || data.followed_id}`);
    return { status: 'ignored', message: 'Interaction events not implemented yet' };
}

async function handleFollowDestroyed(data) {
    console.log(`🚫 Honeycommb Follow Removed: ${data.follower?.name || data.follower_id} unfollowed ${data.followed?.name || data.followed_id}`);
    return { status: 'ignored', message: 'Interaction events not implemented yet' };
}

module.exports = {
    handleLikeCreated,
    handleLikeDestroyed,
    handleFollowCreated,
    handleFollowDestroyed
};
