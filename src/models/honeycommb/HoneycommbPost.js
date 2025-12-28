const mongoose = require('mongoose');

const honeycommbPostSchema = new mongoose.Schema({
    hc_post_id: { type: Number, required: true, unique: true },
    author_id: { type: Number, required: true },
    content: { type: String, required: true },
    created_at: { type: Date, required: true },
    updated_at: { type: Date, default: Date.now },
    last_webhook_received: { type: Date, default: Date.now },
    // Additional fields for posts
    title: String,
    excerpt: String,
    tags: [String],
    category: String,
    featured: { type: Boolean, default: false },
    flagged: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model("HoneycommbPost", honeycommbPostSchema);
