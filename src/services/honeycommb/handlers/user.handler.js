const mongoose = require('mongoose');
const config = require('../../../config/honeycommb.config');

// Honeycommb User Model
const honeycommbUserSchema = new mongoose.Schema({
    hc_user_id: { type: Number, required: true, unique: true },
    name: { type: String, required: true },
    email: { type: String, required: true },
    username: String,
    status: { type: String, enum: ["active", "inactive", "pending", "approved"], default: "active" },
    created_at: { type: Date, required: true },
    updated_at: { type: Date, default: Date.now },
    last_webhook_received: { type: Date, default: Date.now }
}, { timestamps: true });

const HoneycommbUser = mongoose.model("HoneycommbUser", honeycommbUserSchema);

async function handleUserCreated(data) {
    try {
        // Handle test data vs real Honeycommb data
        const isTestData = !data.id && data.user_id;

        if (isTestData) {
            console.log(`🧪 Test User Created: ${data.name} (${data.user_id})`);
            return { status: 'success', message: 'Test user created (not saved to DB)' };
        }

        const user = new HoneycommbUser({
            hc_user_id: data.id,
            name: data.name,
            email: data.email,
            username: data.username,
            status: 'active',
            created_at: new Date(data.created_at),
            last_webhook_received: new Date()
        });
        await user.save();
        console.log(`✅ Honeycommb User Created: ${data.name} (${data.id})`);
        return { status: 'success', message: 'User created' };
    } catch (error) {
        console.error('Error creating Honeycommb user:', error);
        throw error;
    }
}

async function handleUserUpdated(data) {
    try {
        await HoneycommbUser.findOneAndUpdate(
            { hc_user_id: data.id },
            {
                name: data.name,
                email: data.email,
                username: data.username,
                updated_at: new Date(),
                last_webhook_received: new Date()
            },
            { upsert: true }
        );
        console.log(`✅ Honeycommb User Updated: ${data.name} (${data.id})`);
        return { status: 'success', message: 'User updated' };
    } catch (error) {
        console.error('Error updating Honeycommb user:', error);
        throw error;
    }
}

async function handleUserDestroyed(data) {
    try {
        await HoneycommbUser.findOneAndUpdate(
            { hc_user_id: data.id },
            {
                status: 'inactive',
                updated_at: new Date(),
                last_webhook_received: new Date()
            }
        );
        console.log(`✅ Honeycommb User Deactivated: ${data.id}`);
        return { status: 'success', message: 'User deactivated' };
    } catch (error) {
        console.error('Error deactivating Honeycommb user:', error);
        throw error;
    }
}

async function handleUserApproved(data) {
    try {
        await HoneycommbUser.findOneAndUpdate(
            { hc_user_id: data.id },
            {
                status: 'approved',
                updated_at: new Date(),
                last_webhook_received: new Date()
            }
        );
        console.log(`✅ Honeycommb User Approved: ${data.id}`);
        return { status: 'success', message: 'User approved' };
    } catch (error) {
        console.error('Error approving Honeycommb user:', error);
        throw error;
    }
}

async function handleUserFlagged(data) {
    try {
        await HoneycommbUser.findOneAndUpdate(
            { hc_user_id: data.id },
            {
                status: 'flagged',
                updated_at: new Date(),
                last_webhook_received: new Date()
            }
        );
        console.log(`✅ Honeycommb User Flagged: ${data.id}`);
        return { status: 'success', message: 'User flagged' };
    } catch (error) {
        console.error('Error flagging Honeycommb user:', error);
        throw error;
    }
}

module.exports = {
    handleUserCreated,
    handleUserUpdated,
    handleUserDestroyed,
    handleUserApproved,
    handleUserFlagged
};
