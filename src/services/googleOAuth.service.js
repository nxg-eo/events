// src/services/googleOAuth.service.js
const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

class GoogleOAuthService {
  constructor() {
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_OAUTH_CLIENT_ID,
      process.env.GOOGLE_OAUTH_CLIENT_SECRET,
      process.env.GOOGLE_OAUTH_REDIRECT_URI
    );

    this.tokenPath = path.join(__dirname, 'oauth-tokens.json');
    this.loadTokens();
  }

  generateAuthUrl() {
    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',     // REQUIRED for refresh token
      prompt: 'consent',           // REQUIRED once
      scope: [
        'https://www.googleapis.com/auth/drive',
        'https://www.googleapis.com/auth/spreadsheets'
      ]
    });
  }

  async setTokens(tokens) {
    this.oauth2Client.setCredentials(tokens);
    this.saveTokens(tokens);
  }

  getClient() {
    return this.oauth2Client;
  }

  loadTokens() {
    try {
      if (fs.existsSync(this.tokenPath)) {
        const tokens = JSON.parse(fs.readFileSync(this.tokenPath, 'utf8'));
        this.oauth2Client.setCredentials(tokens);
        console.log('✅ OAuth tokens loaded from file');
      }
    } catch (error) {
      console.log('⚠️ No OAuth tokens found, authentication required');
    }
  }

  saveTokens(tokens) {
    try {
      fs.writeFileSync(this.tokenPath, JSON.stringify(tokens, null, 2));
      console.log('💾 OAuth tokens saved to file');
    } catch (error) {
      console.error('❌ Failed to save OAuth tokens:', error.message);
    }
  }

  isAuthenticated() {
    const credentials = this.oauth2Client.credentials;
    return !!(credentials && credentials.access_token);
  }
}

module.exports = new GoogleOAuthService();
