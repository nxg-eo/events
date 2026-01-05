// Script to check event data
const mongoose = require('mongoose');
const Event = require('./src/models/Event');
const Registration = require('./src/models/Registration');

async function checkEventData() {
    try {
        console.log('🔍 Checking event data...\n');

        // Connect to database
        await mongoose.connect('mongodb+srv://admin_db_user:9mbhFHRfH1FOPIX4@cluster0.u7ksbrp.mongodb.net/eo_dubai_events?appName=Cluster0');

        console.log('✅ Connected to database');

        // Find the EO Test Event
        const event = await Event.findOne({ title: 'EO Test Event' });

        if (!event) {
            console.log('❌ Event "EO Test Event" not found');
            return;
        }

        console.log('📋 Event Details:');
        console.log('  Title:', event.title);
        console.log('  Capacity:', event.capacity);
        console.log('  Status:', event.status);
        console.log('  Created:', event.createdAt);

        // Count registrations
        const confirmedCount = await Registration.countDocuments({
            eventId: event._id,
            status: 'confirmed'
        });

        const totalRegistrations = await Registration.countDocuments({
            eventId: event._id
        });

        console.log('\n📊 Registration Counts:');
        console.log('  Total registrations:', totalRegistrations);
        console.log('  Confirmed registrations:', confirmedCount);

        // Calculate spots left
        const spotsLeft = event.capacity ? event.capacity - confirmedCount : null;
        console.log('  Spots left:', spotsLeft);

        console.log('\n📋 All registrations for this event:');
        const registrations = await Registration.find({ eventId: event._id });
        registrations.forEach((reg, index) => {
            console.log(`  ${index + 1}. User: ${reg.userId}, Status: ${reg.status}, Guests: ${reg.totalGuests || 1}`);
        });

        // Close connection
        await mongoose.connection.close();
        console.log('\n✅ Done!');

    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

checkEventData();
