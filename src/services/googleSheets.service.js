const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');

class GoogleSheetsService {
  constructor() {
    this.credentialsPath = null;
    this.tokenPath = null;
    this.sheetId = null;
    this.useOAuth = false;
    this.initialized = false;
  }

  /**
   * Initialize service configuration (called lazily)
   */
  initializeConfig() {
    if (this.initialized) return;

    this.credentialsPath = process.env.GOOGLE_OAUTH_CREDENTIALS_PATH || process.env.GOOGLE_SERVICE_ACCOUNT_KEY_PATH;
    this.tokenPath = process.env.GOOGLE_OAUTH_TOKEN_PATH || path.join(__dirname, 'oauth-token.json');
    this.useOAuth = process.env.GOOGLE_OAUTH_ENABLED === 'true';
    this.initialized = true;

    if (this.useOAuth) {
      console.log('🔐 Using OAuth 2.0 authentication for Google Sheets');
    } else if (this.credentialsPath) {
      console.log('🔐 Using Service Account authentication for Google Sheets');
    } else {
      console.warn('⚠️ Google credentials not configured. Set GOOGLE_OAUTH_ENABLED=true or GOOGLE_SERVICE_ACCOUNT_KEY_PATH environment variable.');
      console.warn('Google Sheets will use fallback mode until configured.');
    }
  }

  /**
   * Initialize Google APIs clients (Sheets and Drive)
   * @returns {Promise<Object>} Authenticated clients
   */
  async initializeClients() {
    // Initialize configuration lazily
    this.initializeConfig();

    try {
      let authClient;

      // 🟢 PRIORITY 1: OAuth (user-owned Drive)
      if (process.env.GOOGLE_OAUTH_ENABLED === 'true') {
        const googleOAuth = require('./googleOAuth.service');

        const oauthClient = googleOAuth.getClient();

        if (!oauthClient || !oauthClient.credentials) {
          throw new Error('OAuth client not initialized. Visit http://localhost:3000/auth/google');
        }

        authClient = oauthClient;

        console.log('🔐 AUTH TYPE: OAuth 2.0');
        console.log('🔐 AUTH CLIENT EMAIL:', oauthClient.credentials?.email || 'user@gmail.com');
      }

      // 🔵 FALLBACK: Service Account (legacy)
      else if (process.env.GOOGLE_SERVICE_ACCOUNT_KEY_PATH) {
        const auth = new google.auth.GoogleAuth({
          keyFile: process.env.GOOGLE_SERVICE_ACCOUNT_KEY_PATH,
          scopes: [
            'https://www.googleapis.com/auth/spreadsheets',
            'https://www.googleapis.com/auth/drive',
            'https://www.googleapis.com/auth/drive.file'
          ]
        });

        authClient = await auth.getClient();

        console.log('🔐 AUTH TYPE: Service Account');
        console.log('🔐 AUTH CLIENT EMAIL:', authClient.email);
      }

      // ❌ NOTHING CONFIGURED
      else {
        throw new Error('No Google auth method configured. Set GOOGLE_OAUTH_ENABLED=true or GOOGLE_SERVICE_ACCOUNT_KEY_PATH.');
      }

      return {
        drive: google.drive({ version: 'v3', auth: authClient }),
        sheets: google.sheets({ version: 'v4', auth: authClient })
      };

    } catch (error) {
      console.error('Failed to initialize Google APIs clients:', error);
      throw new Error('Google APIs authentication failed');
    }
  }

  /**
   * Initialize OAuth 2.0 client for user authentication
   * @returns {Promise<OAuth2Client>} OAuth client
   */
  async initializeOAuthClient() {
    // Load client secrets from local file
    const credentials = JSON.parse(fs.readFileSync(this.credentialsPath, 'utf8'));
    const { client_secret, client_id, redirect_uris } = credentials.web || credentials.installed;

    const oAuth2Client = new google.auth.OAuth2(
      client_id,
      client_secret,
      redirect_uris[0]
    );

    // Check if we have previously stored a token
    try {
      const token = fs.readFileSync(this.tokenPath, 'utf8');
      oAuth2Client.setCredentials(JSON.parse(token));
    } catch (error) {
      console.log('❌ No stored OAuth token found. Please run OAuth setup first.');
      console.log('Run: node scripts/setup-oauth.js');
      throw new Error('OAuth token not found. Run setup-oauth.js first.');
    }

    // Refresh token if expired
    if (oAuth2Client.isTokenExpiring()) {
      console.log('🔄 Refreshing OAuth token...');
      const { credentials } = await oAuth2Client.refreshAccessToken();
      oAuth2Client.setCredentials(credentials);

      // Save the refreshed token
      fs.writeFileSync(this.tokenPath, JSON.stringify(credentials));
      console.log('✅ OAuth token refreshed and saved');
    }

    return oAuth2Client;
  }

  // Editors to share sheets with
  EDITORS = [
    "devanshudandekar5@gmail.com",
    "aravindsanjay6@gmail.com"
  ];

  // Headers for EO Dubai sheet
  EO_DUBAI_HEADERS = [
    "Member Type",
    "Name",
    "Mobile",
    "Email ID"
  ];

  // Headers for EO Others sheet
  EO_OTHERS_HEADERS = [
    "Timestamp",
    "Session ID",
    "Name",
    "Email ID",
    "Phone",
    "Member Type/Chapter",
    "Plan",
    "Payment Amount",
    "Payment Currency",
    "Transaction ID",
    "Telr Card Token",
    "No Show Consent",
    "Penalty Amount",
    "Registration Status",
    "Bank Credit"
  ];

  /**
   * Create Sheet Helper
   * @param {string} title - Sheet title
   * @param {Array} headers - Headers array
   * @param {Object} clients - Google API clients
   * @returns {Promise<string>} Spreadsheet ID
   */
  async createSheet(title, headers, clients) {
    const { sheets, drive } = clients;

    // Create spreadsheet file in the specified folder using Drive API
    const folderId = process.env.GOOGLE_EVENTS_FOLDER_ID;
    console.log("📁 GOOGLE_EVENTS_FOLDER_ID =", folderId);

    const fileMetadata = {
      name: title,
      mimeType: 'application/vnd.google-apps.spreadsheet'
    };

    // If folder ID is configured, create the file in that folder
    if (folderId) {
      fileMetadata.parents = [folderId];
    }

    console.log(`📄 Creating spreadsheet file in Drive${folderId ? ` folder ${folderId}` : ''}...`);

    const fileResponse = await drive.files.create({
      requestBody: fileMetadata,
      fields: 'id',
      supportsAllDrives: true  // Required for Shared Drives
    });

    const spreadsheetId = fileResponse.data.id;
    console.log(`✅ Spreadsheet file created: ${spreadsheetId}`);

    // Add headers using Sheets API
    console.log('📄 Writing headers...');
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: "A1",
      valueInputOption: "RAW",
      requestBody: {
        values: [headers]
      }
    });
    console.log('✅ Headers written successfully');

    // Share access with editors (supports Shared Drives)
    for (const email of this.EDITORS) {
      await drive.permissions.create({
        fileId: spreadsheetId,
        supportsAllDrives: true,  // Required for Shared Drives
        requestBody: {
          role: "writer",
          type: "user",
          emailAddress: email
        },
        sendNotificationEmail: false
      });
    }

    return spreadsheetId;
  }

  /**
   * Create event sheets - two separate spreadsheets
   * @param {string} eventName - Event name
   * @returns {Promise<Object>} Sheet IDs
   */
  async createEventSheets(eventName) {
    try {
      console.log('🔄 Initializing Google APIs clients...');
      const clients = await this.initializeClients();
      console.log('✅ Google APIs clients initialized successfully');

      console.log('📄 Creating EO Dubai sheet...');
      const eoDubaiSheet = await this.createSheet(
        `EO Dubai ${eventName} Registration`,
        this.EO_DUBAI_HEADERS,
        clients
      );

      console.log('📄 Creating EO Others sheet...');
      const eoOthersSheet = await this.createSheet(
        `EO Others ${eventName} Registration`,
        this.EO_OTHERS_HEADERS,
        clients
      );

      console.log('🎉 Google Sheets creation completed successfully');
      return {
        success: true,
        eoDubaiSheet,
        eoOthersSheet
      };

    } catch (error) {
      console.error('❌ Failed to create event sheets:', error);
      console.error('Error details:', error.message);

      // Check if it's a quota exceeded error
      if (error.message && error.message.includes('storage quota has been exceeded')) {
        console.log('🚨 GOOGLE DRIVE STORAGE QUOTA EXCEEDED');
        console.log('� Using fallback configuration due to storage limits...');
        return this.createFallbackSheets(eventName, { quotaExceeded: true });
      }

      // Fallback to existing sheets for other errors
      console.log('🔄 Using fallback sheet configuration...');
      return this.createFallbackSheets(eventName);
    }
  }

  /**
   * Create event sheet (legacy method for backward compatibility)
   * @param {string} eventTitle - Event title
   * @param {Object} eventData - Event data
   * @returns {Promise<Object>} Sheet creation result
   */
  async createEventSheet(eventTitle, eventData = {}) {
    const result = await this.createEventSheets(eventTitle);
    return {
      success: result.success,
      spreadsheetId: result.eoDubaiSheet, // Return EO Dubai sheet as main
      sheets: {
        eo_dubai: result.eoDubaiSheet,
        eo_others: result.eoOthersSheet
      }
    };
  }

  /**
   * Fallback method to generate unique placeholder sheet IDs when creation fails
   * @param {string} eventTitle - Event title for logging
   * @param {Object} eventData - Event data for context
   * @returns {Promise<Object>} Fallback sheet configuration with unique IDs
   */
  async createFallbackSheets(eventTitle, eventData = {}) {
    console.log('🔄 Generating fallback sheet IDs for:', eventTitle);

    // Generate unique placeholder IDs for each event
    // These are not real Google Sheets, but unique identifiers
    const timestamp = Date.now();
    const eventSlug = eventTitle.toLowerCase().replace(/[^a-z0-9]/g, '-').substring(0, 20);

    const fallbackSheets = {
      eo_dubai: `fallback-eo-dubai-${eventSlug}-${timestamp}`,
      eo_others: `fallback-eo-others-${eventSlug}-${timestamp}`
    };

    if (eventData.quotaExceeded) {
      console.log('🚨 GOOGLE DRIVE STORAGE QUOTA EXCEEDED');
      console.log('📋 Using fallback configuration due to storage limits');
      console.log('💡 To fix: Clear Google Drive storage or use a different service account');
      console.log('🔗 Google Drive: https://drive.google.com');
    } else {
      console.log('⚠️ GOOGLE SHEETS CREATION FAILED - Using unique fallback IDs');
      console.log('📋 To fix this: Grant Editor role to service account in Google Cloud Console');
      console.log('🔗 IAM URL: https://console.cloud.google.com/iam-admin/iam');
      console.log('👤 Service Account: sheets-writer@eo-payments-tracking.iam.gserviceaccount.com');
    }

    const message = eventData.quotaExceeded
      ? 'Google Drive storage quota exceeded. Using fallback sheet IDs. Clear storage space to enable real Google Sheets creation.'
      : 'Using fallback sheet IDs due to permission issues. Grant Editor role to service account to create real Google Sheets.';

    return {
      success: true,
      eoDubaiSheet: fallbackSheets.eo_dubai,
      eoOthersSheet: fallbackSheets.eo_others,
      sheets: fallbackSheets,
      isFallback: true,
      quotaExceeded: eventData.quotaExceeded || false,
      message: message
    };
  }

  /**
   * Append registration data to appropriate Google Sheet
   * @param {string} spreadsheetId - Google Sheet ID
   * @param {string} sheetName - Sheet name (Members & Spouses, EO Others, KE NextGen)
   * @param {Object} registrationData - Registration data to append
   * @returns {Promise<Object>} Append result
   */
  async appendRegistration(spreadsheetId, sheetName, registrationData) {
    try {
      const { sheets } = await this.initializeClients();

      // Prepare row data
      const rowData = [
        registrationData.name || '',
        registrationData.email || '',
        registrationData.phone || '',
        registrationData.company || '',
        registrationData.category || '',
        registrationData.paymentId || '',
        registrationData.amount || 0,
        registrationData.status || 'CONFIRMED',
        new Date().toISOString()
      ];

      // Append to sheet
      const response = await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: `${sheetName}!A:I`,
        valueInputOption: 'RAW',
        insertDataOption: 'INSERT_ROWS',
        requestBody: {
          values: [rowData]
        }
      });

      return {
        success: true,
        updatedRange: response.data.updates?.updatedRange,
        updatedRows: response.data.updates?.updatedRows
      };

    } catch (error) {
      console.error('Failed to append registration:', error);
      throw new Error('Google Sheets append failed');
    }
  }

  /**
   * Get sheet summary data
   * @param {string} spreadsheetId - Google Sheet ID
   * @param {string} sheetName - Sheet name
   * @returns {Promise<Object>} Sheet summary
   */
  async getSheetSummary(spreadsheetId, sheetName) {
    try {
      const { sheets } = await this.initializeClients();

      // Get all data from sheet
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: `${sheetName}!A:I`
      });

      const rows = response.data.values || [];
      const headers = rows[0] || [];
      const dataRows = rows.slice(1);

      // Calculate summary
      const totalRegistrations = dataRows.length;
      const confirmedPayments = dataRows.filter(row => row[7] === 'CONFIRMED').length;
      const totalRevenue = dataRows.reduce((sum, row) => {
        const amount = parseFloat(row[6]) || 0;
        return sum + amount;
      }, 0);

      return {
        totalRegistrations,
        confirmedPayments,
        totalRevenue,
        currency: 'AED'
      };

    } catch (error) {
      console.error('Failed to get sheet summary:', error);
      throw new Error('Google Sheets summary fetch failed');
    }
  }

  /**
   * Determine which sheet to use based on user category
   * @param {string} userCategory - User category (EO_DUBAI_MEMBERS, EO_OTHERS, KE_NEXTGEN)
   * @returns {string} Sheet name
   */
  getSheetNameForCategory(userCategory) {
    const categoryMap = {
      'EO_DUBAI_MEMBERS': 'Members & Spouses',
      'EO_OTHERS': 'EO Others',
      'KE_NEXTGEN': 'KE NextGen'
    };

    return categoryMap[userCategory] || 'EO Others';
  }

  /**
   * Validate Google Sheets configuration
   * @returns {boolean} Whether configuration is valid
   */
  validateConfiguration() {
    return !!this.credentialsPath;
  }
}

module.exports = new GoogleSheetsService();
