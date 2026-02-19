const admin = require('../config/firebase');

class NotificationService {
    /**
     * Send a notification to a specific device token
     * @param {string} token - The FCM device token
     * @param {string} title - Notification title
     * @param {string} body - Notification body
     * @param {object} data - Optional data payload
     */
    static async sendToDevice(token, title, body, data = {}) {
        if (!token) {
            console.warn('NotificationService: No token provided');
            return null;
        }

        const message = {
            notification: {
                title,
                body,
            },
            data: data, // Data payload must be strings
            token: token,
        };

        try {
            const response = await admin.messaging().send(message);
            console.log('Successfully sent message:', response);
            return response;
        } catch (error) {
            console.error('Error sending message:', error);
            throw error;
        }
    }

    /**
     * Send a notification to multiple devices (Multicast) and save to User model
     * @param {Array<string>} tokens - Array of FCM device tokens
     * @param {string} title - Notification title
     * @param {string} body - Notification body
     * @param {object} data - Optional data payload
     * @param {string} userId - Optional User ID to save notification to
     */
    static async sendToMulticast(tokens, title, body, data = {}, userId = null) {
        if (!tokens || tokens.length === 0) {
            console.warn('NotificationService: No tokens provided for multicast');
            return null;
        }

        const message = {
            notification: {
                title,
                body,
            },
            data: data,
            tokens: tokens,
        };

        try {
            // Save to User model if userId is provided
            if (userId) {
                const User = require('../models/User');
                try {
                    await User.findByIdAndUpdate(userId, {
                        $push: {
                            notifications: {
                                title,
                                message: body,
                                type: data.type || 'system',
                                data: data,
                                isRead: false,
                                createdAt: new Date()
                            }
                        }
                    });
                    console.log(`Notification saved to user ${userId}`);
                } catch (dbError) {
                    console.error(`Error saving notification to user ${userId}:`, dbError);
                }
            }

            // Using sendEachForMulticast as sendMulticast is deprecated/removed in v12+
            const response = await admin.messaging().sendEachForMulticast(message);
            console.log(response.successCount + ' messages were sent successfully');
            if (response.failureCount > 0) {
                const failedTokens = [];
                response.responses.forEach((resp, idx) => {
                    if (!resp.success) {
                        failedTokens.push(tokens[idx]);
                    }
                });
                console.log('List of tokens that caused failures: ' + failedTokens);
            }
            return response;
        } catch (error) {
            console.error('Error sending multicast message:', error);
            throw error;
        }
    }

    /**
     * Send a notification to a topic
     * @param {string} topic - The topic name
     * @param {string} title - Notification title
     * @param {string} body - Notification body
     * @param {object} data - Optional data payload
     */
    static async sendToTopic(topic, title, body, data = {}) {
        const message = {
            notification: {
                title,
                body,
            },
            data: data,
            topic: topic,
        };

        try {
            const response = await admin.messaging().send(message);
            console.log('Successfully sent message to topic:', response);
            return response;
        } catch (error) {
            console.error('Error sending message to topic:', error);
            throw error;
        }
    }
}

module.exports = NotificationService;
