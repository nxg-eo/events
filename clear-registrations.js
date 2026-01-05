// Script to clear registrations for testing
const mongoose = require('mongoose');
const Registration = require('./src/models/Registration');

async function clearRegistrations() {
    try {
        console.log('🧹 Clearing registrations for testing...\n');

        // Connect to database
        await mongoose.connect('mongodb+srv://admin_db_user:9mbhFHRfH1FOPIX4@cluster0.u7ksbrp.mongodb.net/eo_dubai_events?appName=Cluster0');

        console.log('✅ Connected to database');

        // Find the EO Test Event
        const Event = require('./src/models/Event');
        const event = await Event.findOne({ title: 'EO Test Event' });

        if (!event) {
            console.log('❌ Event "EO Test Event" not found');
            return;
        }

        console.log('📋 Found event:', event.title, '(ID:', event._id, ')');

        // Delete ALL registrations (for testing)
        const deleteResult = await Registration.deleteMany({});

        console.log('🗑️ Deleted', deleteResult.deletedCount, 'registrations');

        // Also clear ALL payments (for testing)
        const Payment = require('./src/models/Payment');
        const paymentDeleteResult = await Payment.deleteMany({});
        console.log('💳 Deleted', paymentDeleteResult.deletedCount, 'payments');

        console.log('\n✅ All registrations and payments cleared for testing!');

        // Close connection
        await mongoose.connection.close();

    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

clearRegistrations();
