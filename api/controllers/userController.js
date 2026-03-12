const User = require('../models/User');

/**
 * @desc    Get user notifications
 * @route   GET /api/v1/user/notifications
 * @access  Private
 */
const getNotifications = async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await User.findById(userId).select('notifications');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Sort notifications by newest first
        const notifications = user.notifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        res.status(200).json({
            success: true,
            data: notifications
        });
    } catch (error) {
        console.error('Get notifications error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

/**
 * @desc    Mark notification as read
 * @route   PUT /api/v1/user/notifications/:id/read
 * @access  Private
 */
const markNotificationAsRead = async (req, res) => {
    try {
        const userId = req.user.id;
        const notificationId = req.params.id;

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const notification = user.notifications.id(notificationId);

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: 'Notification not found'
            });
        }

        notification.isRead = true;
        await user.save();

        res.status(200).json({
            success: true,
            data: notification,
            message: 'Notification marked as read'
        });
    } catch (error) {
        console.error('Mark notification read error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

/**
 * @desc    Mark all notifications as read
 * @route   PUT /api/v1/user/notifications/read-all
 * @access  Private
 */
const markAllNotificationsAsRead = async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        let updatedCount = 0;
        user.notifications.forEach(notif => {
            if (!notif.isRead) {
                notif.isRead = true;
                updatedCount++;
            }
        });

        await user.save();

        res.status(200).json({
            success: true,
            message: `${updatedCount} notifications marked as read`
        });
    } catch (error) {
        console.error('Mark all notifications read error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

module.exports = {
    getNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead
};
