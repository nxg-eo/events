// Script to fix event description
const mongoose = require('mongoose');
const Event = require('./src/models/Event');

async function fixEventDescription() {
    try {
        console.log('🔧 Fixing event description...\n');

        // Connect to database
        await mongoose.connect('mongodb+srv://admin_db_user:9mbhFHRfH1FOPIX4@cluster0.u7ksbrp.mongodb.net/eo_dubai_events?appName=Cluster0');

        console.log('✅ Connected to database');

        // Find the EO Test Event
        const event = await Event.findOne({ title: 'EO Test Event' });

        if (!event) {
            console.log('❌ Event "EO Test Event" not found');
            return;
        }

        console.log('📋 Found event:', event.title);
        console.log('📝 Current description:', event.description);

        // Update with proper description
        const newDescription = 'Join us for an exclusive EO Dubai networking event featuring inspiring speakers, valuable connections, and unforgettable experiences. This premier gathering brings together entrepreneurs from across the region for meaningful discussions and business opportunities.';

        await Event.findByIdAndUpdate(event._id, {
            description: newDescription
        });

        console.log('✅ Updated event description');
        console.log('📝 New description:', newDescription);

        // Close connection
        await mongoose.connection.close();
        console.log('✅ Done!');

    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

fixEventDescription();
