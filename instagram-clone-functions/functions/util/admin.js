const admin = require("firebase-admin");
require("dotenv").config();

// Get account credientials from env and init admin SDK
const serviceAccount = process.env.GOOGLE_APPLICATION_CREDENTIALS;
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

// Store DB Path
const db = admin.firestore();

module.exports = { admin, db };
