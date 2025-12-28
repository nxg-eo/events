const express = require('express');
const router = express.Router();
const honeycommbController = require('../../controllers/webhooks/honeycommb.controller');

// POST /api/webhooks/honeycommb
router.post('/honeycommb', honeycommbController.handleWebhook);

module.exports = router;
