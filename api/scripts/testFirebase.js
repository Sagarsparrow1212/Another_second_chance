require('dotenv').config({ path: '../.env' });
const admin = require('../config/firebase');
const NotificationService = require('../services/notificationService');

console.log('Testing Firebase Configuration...');

if (admin.apps.length > 0) {
    console.log('✅ Firebase Admin SDK initialized successfully.');
    console.log(`   Project ID: ${admin.app().options.credential.projectId}`);
} else {
    console.error('❌ Firebase Admin SDK NOT initialized.');
    process.exit(1);
}

// Optional: specific test if a token is provided as argument
const token = process.argv[2];
if (token) {
    console.log(`Attempting to send test notification to token: ${token}`);
    NotificationService.sendToDevice(
        token,
        'Test Notification',
        'This is a test message from the backend script.',
        { type: 'test', timestamp: new Date().toISOString() }
    )
        .then((response) => {
            console.log('✅ Test notification sent successfully:', response);
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ Failed to send test notification:', error);
            process.exit(1);
        });
} else {
    console.log('ℹ️  No device token provided. Skipping notification send test.');
    console.log('   Usage: node testFirebase.js <device_token>');
    process.exit(0);
}
