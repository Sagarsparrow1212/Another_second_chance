const NotificationService = require('../services/notificationService');

// @desc    Send a test push notification
// @route   POST /api/admin/push-notification
// @access  Public (for testing purposes, or protect with admin middleware)
const sendTestNotification = async (req, res) => {
    try {
        const { token, title, body, data } = req.body;

        if (!token || !title || !body) {
            return res.status(400).json({
                success: false,
                message: 'Please provide token, title, and body',
            });
        }

        const response = await NotificationService.sendToDevice(token, title, body, data);

        res.status(200).json({
            success: true,
            data: response,
            message: 'Notification sent successfully',
        });
    } catch (error) {
        console.error('Error sending test notification:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to send notification',
            error: error.message,
        });
    }
};

module.exports = {
    sendTestNotification,
};
