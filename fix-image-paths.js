// Migration script to fix image paths in database
// Run this ONCE to fix existing events

const mongoose = require('mongoose');
const Event = require('./src/models/Event'); // Adjust path to your Event model

async function fixImagePaths() {
    try {
        console.log('🔧 Starting image path migration...\n');

        // Connect to database
        await mongoose.connect('mongodb+srv://admin_db_user:9mbhFHRfH1FOPIX4@cluster0.u7ksbrp.mongodb.net/eo_dubai_events?appName=Cluster0');

        console.log('✅ Connected to database');

        // Find all events
        const events = await Event.find({});
        console.log(`📋 Found ${events.length} events to check\n`);

        let updatedCount = 0;

        for (const event of events) {
            let needsUpdate = false;
            const updates = {};

            console.log(`\n--- Event: ${event.title} ---`);

            // Fix mainEventPhoto
            if (event.mainEventPhoto) {
                const original = event.mainEventPhoto;
                let fixed = original;

                // Remove leading slashes
                while (fixed.startsWith('/')) {
                    fixed = fixed.substring(1);
                    needsUpdate = true;
                }

                // Remove 'public/' prefix
                if (fixed.startsWith('public/')) {
                    fixed = fixed.substring(7);
                    needsUpdate = true;
                }

                if (needsUpdate && original !== fixed) {
                    updates.mainEventPhoto = fixed;
                    console.log(`  📸 Main Photo: "${original}" → "${fixed}"`);
                }
            }

            // Fix coverPhoto
            if (event.coverPhoto) {
                const original = event.coverPhoto;
                let fixed = original;

                // Remove leading slashes
                while (fixed.startsWith('/')) {
                    fixed = fixed.substring(1);
                    needsUpdate = true;
                }

                // Remove 'public/' prefix
                if (fixed.startsWith('public/')) {
                    fixed = fixed.substring(7);
                    needsUpdate = true;
                }

                if (original !== fixed) {
                    updates.coverPhoto = fixed;
                    console.log(`  📸 Cover Photo: "${original}" → "${fixed}"`);
                }
            }

            // Fix coverImage (if used)
            if (event.coverImage) {
                const original = event.coverImage;
                let fixed = original;

                while (fixed.startsWith('/')) {
                    fixed = fixed.substring(1);
                    needsUpdate = true;
                }

                if (fixed.startsWith('public/')) {
                    fixed = fixed.substring(7);
                    needsUpdate = true;
                }

                if (original !== fixed) {
                    updates.coverImage = fixed;
                    console.log(`  📸 Cover Image: "${original}" → "${fixed}"`);
                }
            }

            // Update event if needed
            if (Object.keys(updates).length > 0) {
                await Event.findByIdAndUpdate(event._id, updates);
                updatedCount++;
                console.log(`  ✅ Updated`);
            } else {
                console.log(`  ✓ No changes needed`);
            }
        }

        console.log(`\n${'='.repeat(60)}`);
        console.log(`✅ Migration complete!`);
        console.log(`📊 Updated ${updatedCount} out of ${events.length} events`);
        console.log(`${'='.repeat(60)}\n`);

        // Close connection
        await mongoose.connection.close();
        process.exit(0);

    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
}

// Run migration
fixImagePaths();

// To use this script:
// 1. Save as fix-image-paths.js
// 2. Run: node fix-image-paths.js
