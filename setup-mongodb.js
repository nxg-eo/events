// scripts/createIndexes.js
require("dotenv").config();
const mongoose = require("mongoose");

const uri = process.env.MONGODB_URI;

if (!uri) {
  console.error("❌ ERROR: MONGODB_URI missing in .env");
  process.exit(1);
}

(async () => {
  try {
    console.log("⏳ Connecting to MongoDB...");
    await mongoose.connect(uri);

    console.log("✅ Connected. Creating indexes...");

    const events = mongoose.connection.collection("events");
    const regs = mongoose.connection.collection("registrations");
    const payments = mongoose.connection.collection("payments");
    const noshows = mongoose.connection.collection("noshows");
    const users = mongoose.connection.collection("users");

    // EVENTS
    await events.createIndex({ startDate: 1 });
    await events.createIndex({ chapter: 1, startDate: -1 });
    await events.createIndex({ createdBy: 1 });
    await events.createIndex({ status: 1 });
    await events.createIndex({ title: "text", description: "text" });

    // REGISTRATIONS
    await regs.createIndex({ eventId: 1 });
    await regs.createIndex({ userId: 1 });
    await regs.createIndex({ eventId: 1, status: 1 });

    try {
      await regs.createIndex(
        { eventId: 1, userId: 1 },
        { unique: true }
      );
    } catch (e) {
      console.warn(
        "⚠️ Unique index on (eventId, userId) failed — duplicates may exist.",
        e.message
      );
    }

    // PAYMENTS
    await payments.createIndex({ registrationId: 1 });
    await payments.createIndex({ paymentReference: 1 });
    await payments.createIndex({ telrRef: 1 });

    // NO SHOW
    await noshows.createIndex({ eventId: 1, userId: 1 });

    // USERS
    await users.createIndex({ chapter: 1 });

    // HONEYCOMMB COLLECTIONS
    const hcUsers = mongoose.connection.collection("honeycommbusers");
    const hcPosts = mongoose.connection.collection("honeycommbposts");
    const hcEvents = mongoose.connection.collection("honeycommbevents");
    const hcGroups = mongoose.connection.collection("honeycommbgroups");
    const hcPayments = mongoose.connection.collection("honeycommbpayments");
    const webhookLogs = mongoose.connection.collection("webhooklogs");

    // HONEYCOMMB USERS
    await hcUsers.createIndex({ hc_user_id: 1 }, { unique: true });
    await hcUsers.createIndex({ email: 1 });
    await hcUsers.createIndex({ status: 1 });
    await hcUsers.createIndex({ created_at: -1 });

    // HONEYCOMMB POSTS
    await hcPosts.createIndex({ hc_post_id: 1 }, { unique: true });
    await hcPosts.createIndex({ author_id: 1 });
    await hcPosts.createIndex({ created_at: -1 });
    await hcPosts.createIndex({ featured: 1 });
    await hcPosts.createIndex({ flagged: 1 });

    // HONEYCOMMB EVENTS
    await hcEvents.createIndex({ hc_event_id: 1 }, { unique: true });
    await hcEvents.createIndex({ start_date: 1 });
    await hcEvents.createIndex({ status: 1 });
    await hcEvents.createIndex({ created_at: -1 });

    // HONEYCOMMB GROUPS
    await hcGroups.createIndex({ hc_group_id: 1 }, { unique: true });
    await hcGroups.createIndex({ created_at: -1 });

    // HONEYCOMMB PAYMENTS
    await hcPayments.createIndex({ hc_payment_id: 1 }, { unique: true });
    await hcPayments.createIndex({ user_id: 1 });
    await hcPayments.createIndex({ status: 1 });
    await hcPayments.createIndex({ created_at: -1 });

    // WEBHOOK LOGS
    await webhookLogs.createIndex({ event: 1 });
    await webhookLogs.createIndex({ status: 1 });
    await webhookLogs.createIndex({ createdAt: -1 });

    console.log("🎉 All indexes created successfully!");
  } catch (error) {
    console.error("❌ Index creation error:", error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
})();
