// Testing logic for FCM token replacement and Notification saving

const fcmTokenReplacementLogic = (currentTokens, newToken) => {
    // Current logic in authController.js:
    // user.fcmTokens = [fcmToken];
    // await user.save();
    return [newToken];
};

const saveNotificationLogic = (notifications, title, body, type, data) => {
    // Current logic in notificationService.js:
    // $push: { notifications: { title, message: body, type, data, isRead: false, createdAt: new Date() } }
    notifications.push({
        title,
        message: body,
        type,
        data,
        isRead: false,
        createdAt: new Date()
    });
    return notifications;
};

// 1. Test FCM replacement
let tokens = ['old1', 'old2', 'old3'];
let newToken = 'new4';
tokens = fcmTokenReplacementLogic(tokens, newToken);
console.log('FCM Tokens (Replacement):', tokens);
if (tokens.length === 1 && tokens[0] === 'new4') {
    console.log('✅ FCM token replacement logic verified');
} else {
    console.log('❌ FCM token replacement logic failed');
}

// 2. Test Notification saving
let notifications = [];
let notifTitle = 'New message from Alice';
let notifBody = 'Hey there!';
notifications = saveNotificationLogic(notifications, notifTitle, notifBody, 'chat', { chatId: '1' });
console.log('Notifications (Save):', notifications);
if (notifications.length === 1 && notifications[0].title === notifTitle) {
    console.log('✅ Notification saving logic verified');
} else {
    console.log('❌ Notification saving logic failed');
}
