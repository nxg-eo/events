// src/routes/auth.routes.js
const express = require('express');
const router = express.Router();
const googleOAuth = require('../services/googleOAuth.service');

// OAuth routes for Google authentication
router.get('/google', (req, res) => {
  const authUrl = googleOAuth.generateAuthUrl();
  res.redirect(authUrl);
});

router.get('/google/callback', async (req, res) => {
  try {
    const { code } = req.query;

    if (!code) {
      return res.status(400).send('Authorization code not provided');
    }

    // Exchange authorization code for tokens
    const { tokens } = await googleOAuth
      .getClient()
      .getToken(code);

    // Set tokens in OAuth client
    await googleOAuth.setTokens(tokens);

    console.log('✅ Google OAuth authentication successful');

    res.send(`
      <html>
        <head>
          <title>Google OAuth Connected</title>
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
            .success { color: #28a745; font-size: 24px; margin-bottom: 20px; }
            .message { color: #666; font-size: 16px; margin-bottom: 30px; }
            .button { background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; }
          </style>
        </head>
        <body>
          <div class="success">✅ Google OAuth Connected Successfully!</div>
          <div class="message">
            Your Google account has been authenticated for Google Sheets and Drive access.<br>
            You can now create events with automatic Google Sheets generation.
          </div>
          <a href="http://localhost:8000/admin-dashboard.php" class="button">Go to Admin Dashboard</a>
        </body>
      </html>
    `);

  } catch (error) {
    console.error('OAuth callback error:', error);
    res.status(500).send(`
      <html>
        <head>
          <title>OAuth Error</title>
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
            .error { color: #dc3545; font-size: 24px; margin-bottom: 20px; }
            .message { color: #666; font-size: 16px; }
          </style>
        </head>
        <body>
          <div class="error">❌ OAuth Authentication Failed</div>
          <div class="message">
            ${error.message}<br><br>
            Please try the authentication process again.
          </div>
        </body>
      </html>
    `);
  }
});

// Check OAuth status
router.get('/google/status', (req, res) => {
  const isAuthenticated = googleOAuth.isAuthenticated();
  res.json({
    authenticated: isAuthenticated,
    message: isAuthenticated ? 'Google OAuth is connected' : 'Google OAuth authentication required'
  });
});

module.exports = router;
