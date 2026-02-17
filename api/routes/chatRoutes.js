const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getOrCreateChat,
  getAllChats,
  getMessages,
  sendMessage,
  markAsRead,
} = require('../controllers/chatController');

// @route   GET /api/v1/chat
// @desc    Get all chats for current user
// @access  Private
router.get('/', protect, getAllChats);

// @route   GET /api/v1/chat/:chatId/messages
// @desc    Get messages for a chat
// @access  Private
router.get('/:chatId/messages', protect, getMessages);

// @route   GET /api/v1/chat/:organizationId/:homelessId
// @desc    Get or create a chat between organization and homeless
// @access  Private
router.get('/:organizationId/:homelessId', protect, getOrCreateChat);

// @route   GET /api/v1/chat/merchant/:merchantId/:homelessId
// @desc    Get or create a chat between merchant and homeless
// @access  Private
router.get('/merchant/:merchantId/:homelessId', protect, getOrCreateChat);

// @route   POST /api/v1/chat/:chatId/messages
// @desc    Send a message
// @access  Private
router.post('/:chatId/messages', protect, sendMessage);

// @route   PUT /api/v1/chat/:chatId/read
// @desc    Mark messages as read
// @access  Private
router.put('/:chatId/read', protect, markAsRead);

module.exports = router;

