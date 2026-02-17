const admin = require('firebase-admin');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

let serviceAccount;

try {
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
        // If credentials are provided as a JSON string in .env
        serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    } else if (process.env.FIREBASE_CREDENTIALS_PATH) {
        // If a path is provided in .env
        const credentialsPath = path.resolve(process.env.FIREBASE_CREDENTIALS_PATH);
        serviceAccount = require(credentialsPath);
    } else {
        // Default to looking for file in config directory
        try {
            serviceAccount = require('./firebase-service-account.json');
        } catch (e) {
            console.warn('Firebase service account file not found in default location (config/firebase-service-account.json). Checking environment variables...');
        }
    }

    if (serviceAccount) {
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
        });
        console.log('Firebase Admin Initialized successfully');
    } else {
        console.warn('Firebase Admin NOT initialized: No credentials found. Notifications will not work.');
    }
} catch (error) {
    console.error('Error initializing Firebase Admin:', error);
}

module.exports = admin;
