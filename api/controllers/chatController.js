const Chat = require('../models/Chat');
const Organization = require('../models/Organization');
const Homeless = require('../models/Homeless');
const User = require('../models/User');
const Merchant = require('../models/Merchant');
const mongoose = require('mongoose');

/**
 * @desc    Get or create a chat between organization/merchant and homeless
 * @route   GET /api/v1/chat/:organizationId/:homelessId
 * @route   GET /api/v1/chat/merchant/:merchantId/:homelessId
 * @access  Private
 */
const getOrCreateChat = async (req, res) => {
  try {
    const { organizationId, merchantId, homelessId } = req.params;

    // Validate IDs
    if (organizationId && !mongoose.Types.ObjectId.isValid(organizationId)) {
      return res.status(400).json({ success: false, message: 'Invalid Organization ID' });
    }
    if (merchantId && !mongoose.Types.ObjectId.isValid(merchantId)) {
      return res.status(400).json({ success: false, message: 'Invalid Merchant ID' });
    }
    if (!mongoose.Types.ObjectId.isValid(homelessId)) {
      // If it's a mockID, we can just return empty or error.
      // Since this is "getOrCreate", passing a mock ID for a USER (homeless) is likely invalid flow?
      // Actually, if the frontend passes "user2" as homelessId, checking isValid will prevent the crash.
      return res.status(400).json({ success: false, message: 'Invalid Homeless ID' });
    }

    let criteria = { homelessId, isDeleted: false };

    // Check if we are creating chat for Organization or Merchant
    // Check if we are creating chat for Organization or Merchant
    // Logic update: The route might be /chat/:id1/:id2 where id1 is captured as organizationId
    // but could be a Merchant ID if the frontend uses a generic route.

    let orgIdToUse = organizationId;
    let merIdToUse = merchantId;

    // Try to find Organization first if organizationId is provided
    if (orgIdToUse) {
      if (mongoose.Types.ObjectId.isValid(orgIdToUse)) {
        const organization = await Organization.findById(orgIdToUse);
        if (organization && !organization.isDeleted) {
          criteria.organizationId = orgIdToUse;
        } else {
          // Not found as Org, check if it's a Merchant
          const merchant = await Merchant.findById(orgIdToUse);
          if (merchant && !merchant.isDeleted) {
            criteria.merchantId = orgIdToUse;
            merIdToUse = orgIdToUse; // Treat as merchant
            orgIdToUse = null; // Reset org
          } else {
            // Neither
            return res.status(404).json({
              success: false,
              message: 'Organization or Merchant not found',
            });
          }
        }
      } else {
        return res.status(400).json({ success: false, message: 'Invalid ID format' });
      }
    } else if (merIdToUse) {
      // Explicit merchant route used
      const merchant = await Merchant.findById(merIdToUse);
      if (!merchant || merchant.isDeleted) {
        return res.status(404).json({
          success: false,
          message: 'Merchant not found',
        });
      }
      criteria.merchantId = merIdToUse;
    } else {
      return res.status(400).json({
        success: false,
        message: 'Either Organization ID or Merchant ID is required',
      });
    }

    const homeless = await Homeless.findById(homelessId);
    if (!homeless || homeless.isDeleted) {
      return res.status(404).json({
        success: false,
        message: 'Homeless user not found',
      });
    }

    // Check if chat already exists
    let chat = await Chat.findOne(criteria)
      .populate('organizationId', 'orgName name city state logo')
      .populate('merchantId', 'businessName businessEmail city state')
      .populate('homelessId', 'fullName name profilePicture')
      .populate('messages.sender', 'username email role')
      .populate('lastMessage');

    if (!chat) {
      // Create new chat
      const chatData = {
        homelessId,
        messages: [],
      };

      if (criteria.organizationId) chatData.organizationId = criteria.organizationId;
      if (criteria.merchantId) chatData.merchantId = criteria.merchantId;

      chat = await Chat.create(chatData);

      chat = await Chat.findById(chat._id)
        .populate('organizationId', 'orgName name city state logo')
        .populate('merchantId', 'businessName businessEmail city state')
        .populate('homelessId', 'fullName name profilePicture')
        .populate('messages.sender', 'username email role');
    }

    res.status(200).json({
      success: true,
      data: chat,
      message: 'Chat retrieved successfully',
    });
  } catch (error) {
    console.error('Get or create chat error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while getting chat',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
    });
  }
};

/**
 * @desc    Get all chats for current user
 * @route   GET /api/v1/chat
 * @access  Private
 */
const getAllChats = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    console.log('userId', req.user.id);
    console.log('userRole', req.user.role);

    let chats = [];

    if (userRole === 'admin') {
      // Admin can see all chats
      chats = await Chat.find({
        isDeleted: false,
      })
        .populate('organizationId', 'orgName name city state logo')
        .populate('homelessId', 'fullName name profilePicture')
        .populate('lastMessage')
        .sort({ updatedAt: -1 })
        .lean();

      // Format response for admin - show both parties
      chats = chats.map(chat => ({
        _id: chat._id,
        id: chat._id.toString(),
        organization: chat.organizationId,
        organizationUser: chat.organizationId,
        homeless: chat.homelessId,
        homelessUser: chat.homelessId,
        lastMessage: chat.messages && chat.messages.length > 0
          ? chat.messages[chat.messages.length - 1]
          : null,
        unreadCount: 0, // Admin doesn't have unread counts
        updatedAt: chat.updatedAt,
      }));

    } else if (userRole === 'organization') {
      // Get organization ID from user
      const organization = await Organization.findOne({ userId });
      if (!organization) {
        return res.status(404).json({
          success: false,
          message: 'Organization not found for this user',
        });
      }

      chats = await Chat.find({
        organizationId: organization._id,
        isDeleted: false,
      })
        .populate('homelessId', 'fullName name profilePicture')
        .populate('lastMessage')
        .sort({ updatedAt: -1 })
        .lean();

      // Format response
      chats = chats.map(chat => ({
        _id: chat._id,
        id: chat._id.toString(),
        homeless: chat.homelessId,
        homelessUser: chat.homelessId,
        lastMessage: chat.messages && chat.messages.length > 0
          ? chat.messages[chat.messages.length - 1]
          : null,
        unreadCount: chat.unreadCountOrganization || 0,
        updatedAt: chat.updatedAt,
      }));

    } else if (userRole === 'merchant') {
      // Get merchant ID from user
      const merchant = await Merchant.findOne({ userId });
      if (!merchant) {
        return res.status(404).json({
          success: false,
          message: 'Merchant user not found for this user',
        });
      }

      chats = await Chat.find({
        merchantId: merchant._id,
        isDeleted: false,
      })
        .populate('homelessId', 'fullName name profilePicture')
        .populate('lastMessage')
        .sort({ updatedAt: -1 })
        .lean();

      // Format response
      chats = chats.map(chat => ({
        _id: chat._id,
        id: chat._id.toString(),
        homeless: chat.homelessId,
        homelessUser: chat.homelessId,
        lastMessage: chat.messages && chat.messages.length > 0
          ? chat.messages[chat.messages.length - 1]
          : null,
        unreadCount: chat.unreadCountMerchant || 0,
        updatedAt: chat.updatedAt,
      }));

    } else if (userRole === 'homeless') {
      // Get homeless ID from user
      const homeless = await Homeless.findOne({ userId });
      if (!homeless) {
        return res.status(404).json({
          success: false,
          message: 'Homeless user not found for this user',
        });
      }

      chats = await Chat.find({
        homelessId: homeless._id,
        isDeleted: false,
      })
        .populate('organizationId', 'orgName name city state logo')
        .populate('merchantId', 'businessName businessEmail city state')
        .populate('lastMessage')
        .sort({ updatedAt: -1 })
        .lean();

      // Format response
      chats = chats.map(chat => {
        // Determine whether chat is with Organization or Merchant
        const otherParty = chat.organizationId || chat.merchantId;
        const otherPartyKey = chat.organizationId ? 'organization' : 'merchant';

        return {
          _id: chat._id,
          id: chat._id.toString(),
          [otherPartyKey]: otherParty,
          [`${otherPartyKey}User`]: otherParty, // For frontend compatibility
          lastMessage: chat.messages && chat.messages.length > 0
            ? chat.messages[chat.messages.length - 1]
            : null,
          unreadCount: chat.unreadCountHomeless || 0,
          updatedAt: chat.updatedAt,
          type: chat.organizationId ? 'organization' : 'merchant'
        };
      });
    } else {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only admin, organizations, merchants, and homeless users can access chats.',
      });
    }

    res.status(200).json({
      success: true,
      data: chats,
      message: 'Chats retrieved successfully',
    });
  } catch (error) {
    console.error('Get all chats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while getting chats',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
    });
  }
};

/**
 * @desc    Get messages for a chat
 * @route   GET /api/v1/chat/:chatId/messages
 * @access  Private
 */
const getMessages = async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Check if chatId is valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(chatId)) {
      // If it's a mock chat ID (from optimistic UI), return empty list
      if (chatId.toString().startsWith('mock_chat')) {
        return res.status(200).json({
          success: true,
          data: [],
          message: 'New chat (mock ID)',
        });
      }

      return res.status(400).json({
        success: false,
        message: 'Invalid chat ID',
      });
    }

    const chat = await Chat.findById(chatId)
      .populate('messages.sender', 'username email role')
      .populate('organizationId', 'orgName name')
      .populate('homelessId', 'fullName name');

    if (!chat || chat.isDeleted) {
      return res.status(404).json({
        success: false,
        message: 'Chat not found',
      });
    }

    // Verify user has access to this chat
    let hasAccess = false;
    if (userRole === 'admin') {
      // Admin has access to all chats
      hasAccess = true;
    } else if (userRole === 'organization') {
      const organization = await Organization.findOne({ userId });
      const orgId = chat.organizationId?._id || chat.organizationId;
      hasAccess = organization && String(organization._id) === String(orgId);
    } else if (userRole === 'merchant') {
      const merchant = await Merchant.findOne({ userId });
      const merId = chat.merchantId?._id || chat.merchantId;
      hasAccess = merchant && String(merchant._id) === String(merId);
    } else if (userRole === 'homeless') {
      const homeless = await Homeless.findOne({ userId });
      const homelessId = chat.homelessId?._id || chat.homelessId;
      hasAccess = homeless && String(homeless._id) === String(homelessId);
    }

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You do not have permission to view this chat.',
      });
    }

    // Sort messages by creation date (oldest first)
    const messages = chat.messages.sort((a, b) => a.createdAt - b.createdAt);

    res.status(200).json({
      success: true,
      data: messages,
      message: 'Messages retrieved successfully',
    });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while getting messages',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
    });
  }
};

/**
 * @desc    Send a message
 * @route   POST /api/v1/chat/:chatId/messages
 * @access  Private
 */
const sendMessage = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { text } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;

    if (!mongoose.Types.ObjectId.isValid(chatId)) {
      // Explicitly handle mock IDs
      if (chatId.toString().startsWith('mock_chat')) {
        return res.status(400).json({
          success: false,
          message: 'Chat not initialized. Please ensure the chat is created before sending messages.',
          code: 'CHAT_NOT_CREATED'
        });
      }
      return res.status(400).json({
        success: false,
        message: 'Invalid chat ID',
      });
    }

    if (!text || !text.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Message text is required',
      });
    }

    const chat = await Chat.findById(chatId)
      .populate('organizationId')
      .populate('merchantId')
      .populate('homelessId');

    if (!chat || chat.isDeleted) {
      return res.status(404).json({
        success: false,
        message: 'Chat not found',
      });
    }

    // Verify user has access to this chat
    let hasAccess = false;
    if (userRole === 'admin') {
      // Admin can send messages in any chat (for moderation/support)
      hasAccess = true;
    } else if (userRole === 'organization') {
      const organization = await Organization.findOne({ userId });
      const orgId = chat.organizationId?._id || chat.organizationId;
      hasAccess = organization && String(organization._id) === String(orgId);
    } else if (userRole === 'merchant') {
      const merchant = await Merchant.findOne({ userId });
      const merId = chat.merchantId?._id || chat.merchantId;
      hasAccess = merchant && String(merchant._id) === String(merId);
    } else if (userRole === 'homeless') {
      const homeless = await Homeless.findOne({ userId });
      const homelessId = chat.homelessId?._id || chat.homelessId;
      hasAccess = homeless && String(homeless._id) === String(homelessId);
    }

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You do not have permission to send messages in this chat.',
      });
    }

    // Create message
    const message = {
      sender: userId,
      text: text.trim(),
      read: false,
    };

    chat.messages.push(message);
    chat.lastMessage = chat.messages[chat.messages.length - 1]._id;

    // Update unread counts (admin messages don't count as unread)
    if (userRole === 'organization') {
      chat.unreadCountHomeless = (chat.unreadCountHomeless || 0) + 1;
    } else if (userRole === 'merchant') {
      chat.unreadCountHomeless = (chat.unreadCountHomeless || 0) + 1;
    } else if (userRole === 'homeless') {
      if (chat.organizationId) {
        chat.unreadCountOrganization = (chat.unreadCountOrganization || 0) + 1;
      } else if (chat.merchantId) {
        chat.unreadCountMerchant = (chat.unreadCountMerchant || 0) + 1;
      }
    }
    // Admin messages don't increment unread counts

    await chat.save();

    // Populate the new message
    const populatedChat = await Chat.findById(chatId)
      .populate('messages.sender', 'username email role')
      .populate('lastMessage');

    const newMessage = populatedChat.messages[populatedChat.messages.length - 1];

    // Emit socket event for real-time updates
    try {
      const socketService = require('../services/socketService');
      const io = socketService.getIO();
      if (io) {
        // Prepare message data
        const messageData = {
          ...(newMessage.toObject ? newMessage.toObject() : newMessage),
          chatId: chatId,
          chat: {
            _id: chatId,
            organizationId: chat.organizationId,
            merchantId: chat.merchantId,
            homelessId: chat.homelessId
          }
        };

        // Get the chat room name
        const chatRoom = `chat:${chatId}`;

        // Get all sockets in the chat room
        const socketsInRoom = await io.in(chatRoom).fetchSockets();
        console.log(`[Socket] 📤 Emitting newMessage to chat:${chatId}`);
        console.log(`[Socket]    - Sockets in room: ${socketsInRoom.length}`);
        socketsInRoom.forEach(socket => {
          console.log(`[Socket]    - Socket ID: ${socket.id}, User: ${socket.userId}`);
        });

        // Log message details before emitting
        console.log(`[Socket] 📨 Message details:`);
        console.log(`[Socket]    - Message ID: ${messageData._id || messageData.id || 'N/A'}`);
        console.log(`[Socket]    - Text: ${messageData.text || 'N/A'}`);
        console.log(`[Socket]    - Sender: ${messageData.sender?.username || messageData.sender?._id || 'N/A'}`);
        console.log(`[Socket]    - Sender Role: ${messageData.sender?.role || 'N/A'}`);
        console.log(`[Socket]    - Chat ID: ${chatId}`);
        console.log(`[Socket]    - Created At: ${messageData.createdAt || 'N/A'}`);

        // Emit to chat room - THIS IS HOW MESSAGES ARE DELIVERED INSTANTLY!
        io.to(chatRoom).emit('newMessage', messageData);
        console.log(`[Socket] ✅ Emitted to chat room: ${chatRoom}`);
        console.log(`[Socket] ⚡ Message broadcasted to ${socketsInRoom.length} connected client(s) in real-time`);

        // Log delivery confirmation
        if (socketsInRoom.length > 0) {
          console.log(`[Socket] 📨 Message will be received INSTANTLY by:`);
          socketsInRoom.forEach(socket => {
            console.log(`[Socket]    - User ${socket.userId} (Socket: ${socket.id})`);
          });
        } else {
          console.log(`[Socket] ⚠️ No clients in chat room, message sent to user personal rooms as fallback`);
        }

        // Also emit to both participants' personal rooms as fallback
        // This ensures delivery even if they haven't joined the chat room yet
        try {
          // Get organization userId
          const orgId = chat.organizationId?._id || chat.organizationId;
          const merId = chat.merchantId?._id || chat.merchantId;

          if (orgId) {
            const org = await Organization.findById(orgId);
            if (org && org.userId) {
              const orgUserRoom = `user:${org.userId}`;
              io.to(orgUserRoom).emit('newMessage', messageData);
              console.log(`[Socket] 📤 Also emitted to organization user room: ${orgUserRoom}`);

              // Check if anyone is in the user room
              const orgSockets = await io.in(orgUserRoom).fetchSockets();
              console.log(`[Socket]    - Sockets in org user room: ${orgSockets.length}`);
            }
          } else if (merId) {
            const mer = await Merchant.findById(merId);
            if (mer && mer.userId) {
              const merUserRoom = `user:${mer.userId}`;
              io.to(merUserRoom).emit('newMessage', messageData);
              console.log(`[Socket] 📤 Also emitted to merchant user room: ${merUserRoom}`);
            }
          }

          // Get homeless userId
          const homelessId = chat.homelessId?._id || chat.homelessId;
          if (homelessId) {
            const homeless = await Homeless.findOne({ userId });
            if (homeless && homeless.userId) {
              const homelessUserRoom = `user:${homeless.userId}`;
              io.to(homelessUserRoom).emit('newMessage', messageData);
              console.log(`[Socket] 📤 Also emitted to homeless user room: ${homelessUserRoom}`);

              // Check if anyone is in the user room
              const homelessSockets = await io.in(homelessUserRoom).fetchSockets();
              console.log(`[Socket]    - Sockets in homeless user room: ${homelessSockets.length}`);
            }
          }
        } catch (userRoomErr) {
          console.error('[Socket] ❌ Error emitting to user rooms:', userRoomErr);
        }

        console.log(`[Socket] ✅ Message emission completed for chat:${chatId}`);
      } else {
        console.warn('[Socket] ⚠️ Socket.IO instance not available');
      }
    } catch (err) {
      console.error('[Socket] ❌ Error emitting socket event:', err);
      // Continue even if socket emit fails
    }

    // PUSH NOTIFICATION: Send to recipient
    // This runs asynchronously after responding to client
    process.nextTick(async () => {
      try {
        const NotificationService = require('../services/notificationService');
        const User = require('../models/User'); // Assuming User model is available
        const Organization = require('../models/Organization'); // Assuming Organization model is available
        const Merchant = require('../models/Merchant'); // Assuming Merchant model is available
        const Homeless = require('../models/Homeless'); // Assuming Homeless model is available

        // Determine recipient
        let recipientUserId = null;
        let senderName = 'New Message';

        // Helper to get ID whether populated or not
        const getId = (doc) => doc._id || doc;

        // If sender is homeless, recipient is Org or Merchant
        if (userRole === 'homeless') {
          // chat.homelessId is populated, so we can access fullName directly
          senderName = chat.homelessId.fullName || 'Homeless User';

          if (chat.organizationId) {
            // Check if it's already an object (populated) or just ID
            if (chat.organizationId.userId) {
              recipientUserId = chat.organizationId.userId;
            } else {
              // Fallback if not populated properly (though it should be)
              const org = await Organization.findById(getId(chat.organizationId));
              recipientUserId = org ? org.userId : null;
            }
          } else if (chat.merchantId) {
            if (chat.merchantId.userId) {
              recipientUserId = chat.merchantId.userId;
            } else {
              const mer = await Merchant.findById(getId(chat.merchantId));
              recipientUserId = mer ? mer.userId : null;
            }
          }
        }
        // If sender is Org/Merchant/Admin, recipient is Homeless
        else {
          if (userRole === 'organization') {
            // We need to fetch sender info if not available in context
            // But we know the sender is the current user
            const org = await Organization.findOne({ userId });
            senderName = org ? org.orgName : 'Organization';
          } else if (userRole === 'merchant') {
            const mer = await Merchant.findOne({ userId });
            senderName = mer ? mer.businessName : 'Merchant';
          } else {
            senderName = 'Admin';
          }

          if (chat.homelessId && chat.homelessId.userId) {
            recipientUserId = chat.homelessId.userId;
          } else {
            const homeless = await Homeless.findById(getId(chat.homelessId));
            recipientUserId = homeless ? homeless.userId : null;
          }
        }

        console.log(`[Chat Notification] Sender: ${senderName}, Role: ${userRole}`);
        console.log(`[Chat Notification] Recipient User ID: ${recipientUserId}`);

        if (recipientUserId) {
          const recipientUser = await User.findById(recipientUserId);

          if (recipientUser) {
            console.log(`[Chat Notification] Found recipient user. Tokens: ${recipientUser.fcmTokens ? recipientUser.fcmTokens.length : 0}`);

            if (recipientUser.fcmTokens && recipientUser.fcmTokens.length > 0) {
              await NotificationService.sendToMulticast(
                recipientUser.fcmTokens,
                `New message from ${senderName}`,
                text.length > 50 ? text.substring(0, 47) + '...' : text,
                {
                  type: 'chat_message',
                  chatId: chatId.toString(),
                  messageId: newMessage._id.toString()
                },
                recipientUserId // Pass userId to save notification
              );
            }
          } else {
            console.warn(`[Chat Notification] Recipient user not found in User collection: ${recipientUserId}`);
          }
        } else {
          console.warn('[Chat Notification] Could not determine recipient User ID');
        }
      } catch (notifyErr) {
        console.error('[Chat Notification] Error sending push notification:', notifyErr);
      }
    });

    res.status(201).json({
      success: true,
      data: newMessage,
      message: 'Message sent successfully',
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while sending message',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
    });
  }
};

/**
 * @desc    Mark messages as read
 * @route   PUT /api/v1/chat/:chatId/read
 * @access  Private
 */
const markAsRead = async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    if (!mongoose.Types.ObjectId.isValid(chatId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid chat ID',
      });
    }

    const chat = await Chat.findById(chatId);

    if (!chat || chat.isDeleted) {
      return res.status(404).json({
        success: false,
        message: 'Chat not found',
      });
    }

    // Verify user has access
    let hasAccess = false;
    if (userRole === 'admin') {
      // Admin has access to all chats
      hasAccess = true;
    } else if (userRole === 'organization') {
      const organization = await Organization.findOne({ userId });
      const orgId = chat.organizationId?._id || chat.organizationId;
      hasAccess = organization && String(organization._id) === String(orgId);
    } else if (userRole === 'merchant') {
      const merchant = await Merchant.findOne({ userId });
      const merId = chat.merchantId?._id || chat.merchantId;
      hasAccess = merchant && String(merchant._id) === String(merId);
    } else if (userRole === 'homeless') {
      const homeless = await Homeless.findOne({ userId });
      const homelessId = chat.homelessId?._id || chat.homelessId;
      hasAccess = homeless && String(homeless._id) === String(homelessId);
    }

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      });
    }

    // Mark all unread messages as read
    chat.messages.forEach(message => {
      if (String(message.sender) !== String(userId) && !message.read) {
        message.read = true;
        message.readAt = new Date();
      }
    });

    // Reset unread count
    if (userRole === 'organization') {
      chat.unreadCountOrganization = 0;
    } else if (userRole === 'merchant') {
      chat.unreadCountMerchant = 0;
    } else {
      chat.unreadCountHomeless = 0;
    }

    await chat.save();

    // Emit read status via WebSocket for real-time updates
    try {
      const socketService = require('../services/socketService');
      const io = socketService.getIO();

      if (io) {
        // Broadcast read status to all users in the chat room
        io.to(`chat:${chatId}`).emit('messagesRead', {
          chatId,
          readBy: userId,
          readByRole: userRole,
          readAt: new Date(),
          unreadCountOrganization: chat.unreadCountOrganization || 0,
          unreadCountMerchant: chat.unreadCountMerchant || 0,
          unreadCountHomeless: chat.unreadCountHomeless || 0,
        });

        console.log(`[Socket] ✅ Read status emitted - User ${userId} marked messages as read in chat ${chatId}`);
      }
    } catch (socketErr) {
      console.error('[Socket] ❌ Error emitting read status:', socketErr);
      // Continue even if socket emit fails
    }

    res.status(200).json({
      success: true,
      message: 'Messages marked as read',
    });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while marking messages as read',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
    });
  }
};

module.exports = {
  getOrCreateChat,
  getAllChats,
  getMessages,
  sendMessage,
  markAsRead,
};
