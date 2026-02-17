
require('dotenv').config();
const express = require('express');
const app = express();
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const mongoose = require('mongoose');
const connectDB = require('./config/database');
const { Server } = require('socket.io');
const http = require('http');

// Increase body parser limit to handle file uploads (base64 encoded)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Initialize Firebase Admin SDK
require('./config/firebase');

// CORS configuration - allow all origins in development, specific origin in production
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    // In development, allow all origins for easier testing
    if (process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }

    // In production, only allow specific frontend URL
    const allowedOrigins = [
      process.env.FRONTEND_URL,
    ].filter(Boolean);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log(`CORS blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
};

app.use(cors(corsOptions));
// Configure helmet to allow images
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: false, // Disable CSP for development to allow images
}));
app.use(morgan('dev'));

// Disable ETag caching in development (optional - remove if you want caching)
// This will prevent 304 responses and always return 200 with full data
if (process.env.NODE_ENV !== 'production') {
  app.set('etag', false);
  // Also disable caching headers for API responses
  app.use((req, res, next) => {
    if (req.path.startsWith('/api/')) {
      res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
      res.set('Pragma', 'no-cache');
      res.set('Expires', '0');
    }
    next();
  });
}

// Log all requests for debugging
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path} - Origin: ${req.headers.origin || 'none'}`);
  next();
});

// Activity logging middleware (must be after auth middleware setup)
// Note: This will log all API requests after routes are defined
connectDB();

// Routes
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const organizationRoutes = require('./routes/organizationRoutes');
const merchantRoutes = require('./routes/mechantRoutes');
const donorRoutes = require('./routes/donorRoutes');
const donationRoutes = require('./routes/donationRoutes');
const homelessRoutes = require('./routes/homelessRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const jobRoutes = require('./routes/jobRoutes');
const chatRoutes = require('./routes/chatRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const walletRoutes = require('./routes/walletRoutes');
const { activityLogger } = require('./middleware/activityLogger');



// Middleware
const { protect, authorize } = require('./middleware/auth');

// Public API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/admin', adminRoutes);

// Apply activity logger middleware BEFORE routes (to intercept responses)
// This must be before routes so it can override res.send
app.use('/api/v1', activityLogger);
app.use('/api/admin', activityLogger);

// API Routes - Authentication handled in individual routes
app.use('/api/v1/organizations', organizationRoutes);
app.use('/api/v1/merchants', merchantRoutes);
app.use('/api/v1/donors', donorRoutes);
app.use('/api/v1/donations', donationRoutes);
app.use('/api/v1/homeless', homelessRoutes);
app.use('/api/v1/dashboard', dashboardRoutes); // Dashboard only for admin
app.use('/api/v1', jobRoutes);
app.use('/api/v1/chat', chatRoutes);
app.use('/api/v1/analytics', analyticsRoutes); // Analytics routes (protected inside)
app.use('/api/v1/analytics', analyticsRoutes); // Analytics routes (protected inside)
app.use('/api/v1/payments', paymentRoutes); // Payment routes (protected inside)
app.use('/api/v1/wallet', walletRoutes); // Wallet routes


// Serve static files from uploads directory
const path = require('path');
// Configure static file serving with cache control
const staticOptions = {
  // In development, disable caching for easier testing
  // In production, enable caching for better performance
  etag: process.env.NODE_ENV === 'production',
  lastModified: process.env.NODE_ENV === 'production',
  setHeaders: (res, path) => {
    if (process.env.NODE_ENV !== 'production') {
      // Disable caching in development
      res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
      res.set('Pragma', 'no-cache');
      res.set('Expires', '0');
    } else {
      // Enable caching in production (1 year for static assets)
      res.set('Cache-Control', 'public, max-age=31536000, immutable');
    }
  }
};
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), staticOptions));

app.get('/', (req, res) => {
  res.send('Hello World - Homeless App API');
});

const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || '0.0.0.0'; // Listen on all network interfaces

// Create HTTP server

const server = http.createServer(app);

// Initialize Socket.IO

const jwt = require('jsonwebtoken');
const User = require('./models/User');
const Chat = require('./models/Chat');
const Organization = require('./models/Organization');
const Merchant = require('./models/Merchant');
const Homeless = require('./models/Homeless');

const io = new Server(server, {
  cors: {
    origin: process.env.NODE_ENV !== 'production' ? '*' : process.env.FRONTEND_URL,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Set io instance in socket service
const socketService = require('./services/socketService');
socketService.setIO(io);

// Socket.IO authentication middleware
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;

    if (!token) {
      return next(new Error('Authentication error: No token provided'));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');

    if (!user || !user.isActive) {
      return next(new Error('Authentication error: Invalid or inactive user'));
    }

    socket.userId = user._id.toString();
    socket.userRole = user.role;
    next();
  } catch (error) {
    next(new Error('Authentication error: Invalid token'));
  }
});

// Socket.IO connection handler
io.on('connection', (socket) => {
  console.log(`[Socket] ✅ User connected: ${socket.userId} (${socket.userRole}), Socket ID: ${socket.id}`);

  // Join user's personal room
  socket.join(`user:${socket.userId}`);
  console.log(`[Socket] User ${socket.userId} joined personal room: user:${socket.userId}`);

  // Listen for any socket events for debugging
  socket.onAny((eventName, ...args) => {
    if (eventName !== 'newMessage') { // Don't log newMessage to avoid spam
      console.log(`[Socket] Event received: ${eventName} from user ${socket.userId}`);
    }
  });

  // Handle joining a chat room
  socket.on('joinChat', async (chatId) => {
    try {
      // VALIDATION: Check if chatId is valid
      if (!chatId || !mongoose.Types.ObjectId.isValid(chatId)) {
        console.log(`[Socket] ⚠️ Invalid chat ID received in joinChat: ${chatId}`);
        socket.emit('error', { message: 'Invalid chat ID' });
        return;
      }

      // Verify user has access to this chat
      const chat = await Chat.findById(chatId);
      if (!chat) {
        socket.emit('error', { message: 'Chat not found' });
        return;
      }

      let hasAccess = false;
      if (socket.userRole === 'admin') {
        // Admin has access to all chats
        hasAccess = true;
      } else if (socket.userRole === 'organization') {
        const organization = await Organization.findOne({ userId: socket.userId });
        hasAccess = organization && String(organization._id) === String(chat.organizationId);
      } else if (socket.userRole === 'homeless') {
        const homeless = await Homeless.findOne({ userId: socket.userId });
        hasAccess = homeless && String(homeless._id) === String(chat.homelessId);
      } else if (socket.userRole === 'merchant') {
        const merchant = await Merchant.findOne({ userId: socket.userId });
        hasAccess = merchant && String(merchant._id) === String(chat.merchantId);
      }

      if (hasAccess) {
        socket.join(`chat:${chatId}`);
        console.log(`[Socket] ✅ User ${socket.userId} (${socket.userRole}) joined chat ${chatId}`);

        // Get all sockets in the room after joining
        const socketsInRoom = await io.in(`chat:${chatId}`).fetchSockets();
        console.log(`[Socket] Total sockets in chat ${chatId}: ${socketsInRoom.length}`);
      } else {
        console.log(`[Socket] ❌ Access denied: User ${socket.userId} cannot join chat ${chatId}`);
        socket.emit('error', { message: 'Access denied to this chat' });
      }
    } catch (error) {
      console.error('Join chat error:', error);
      socket.emit('error', { message: 'Error joining chat' });
    }
  });

  // Handle leaving a chat room
  socket.on('leaveChat', (chatId) => {
    socket.leave(`chat:${chatId}`);
    console.log(`[Socket] User ${socket.userId} left chat ${chatId}`);
  });

  // Listen for newMessage events (for debugging - to see what clients receive)
  socket.on('newMessage', (message) => {
    console.log(`[Socket] 📨 Client received newMessage event:`);
    console.log(`[Socket]    - Chat ID: ${message.chatId || message.chat?._id || 'N/A'}`);
    console.log(`[Socket]    - Message ID: ${message._id || message.id || 'N/A'}`);
    console.log(`[Socket]    - Text: ${message.text || 'N/A'}`);
    console.log(`[Socket]    - Sender: ${message.sender?.username || message.sender?._id || 'N/A'}`);
    console.log(`[Socket]    - Role: ${message.sender?.role || 'N/A'}`);
    console.log(`[Socket]    - Timestamp: ${message.createdAt || 'N/A'}`);
  });

  // Handle sending a message via socket (for real-time updates)
  socket.on('sendMessage', async (data) => {
    try {
      const { chatId, message } = data;

      if (!chatId || !message) {
        socket.emit('error', { message: 'Invalid message data' });
        return;
      }

      // VALIDATION: Check if chatId is valid
      if (!mongoose.Types.ObjectId.isValid(chatId)) {
        console.log(`[Socket] ⚠️ Invalid chat ID received in sendMessage: ${chatId}`);
        socket.emit('error', { message: 'Invalid chat ID' });
        return;
      }

      // Verify user has access
      const chat = await Chat.findById(chatId);
      if (!chat) {
        socket.emit('error', { message: 'Chat not found' });
        return;
      }

      // Broadcast to all users in the chat room
      io.to(`chat:${chatId}`).emit('newMessage', message);
    } catch (error) {
      console.error('Send message via socket error:', error);
      socket.emit('error', { message: 'Error sending message' });
    }
  });

  // Handle typing indicator (real-time typing status)
  socket.on('typing', async (data) => {
    try {
      const { chatId } = data;

      if (!chatId) {
        socket.emit('error', { message: 'Chat ID required' });
        return;
      }

      // VALIDATION: Check if chatId is valid
      if (!mongoose.Types.ObjectId.isValid(chatId)) {
        // Silent return for typing to avoid spamming errors for mock chats
        return;
      }

      // Verify user has access to this chat
      const chat = await Chat.findById(chatId);
      if (!chat) {
        socket.emit('error', { message: 'Chat not found' });
        return;
      }

      let hasAccess = false;
      if (socket.userRole === 'admin') {
        hasAccess = true;
      } else if (socket.userRole === 'organization') {
        const organization = await Organization.findOne({ userId: socket.userId });
        hasAccess = organization && String(organization._id) === String(chat.organizationId);
      } else if (socket.userRole === 'homeless') {
        const homeless = await Homeless.findOne({ userId: socket.userId });
        hasAccess = homeless && String(homeless._id) === String(chat.homelessId);
      } else if (socket.userRole === 'merchant') {
        const merchant = await Merchant.findOne({ userId: socket.userId });
        hasAccess = merchant && String(merchant._id) === String(chat.merchantId);
      }

      if (!hasAccess) {
        socket.emit('error', { message: 'Access denied to this chat' });
        return;
      }

      // Get user info for typing indicator
      const user = await User.findById(socket.userId).select('username email');

      // Broadcast typing status to all users in chat room (except sender)
      socket.to(`chat:${chatId}`).emit('typing', {
        chatId,
        userId: socket.userId,
        userRole: socket.userRole,
        username: user?.username || 'User',
        email: user?.email || '',
        isTyping: true,
        timestamp: new Date(),
      });

      console.log(`[Socket] ⌨️ User ${socket.userId} is typing in chat ${chatId}`);
    } catch (error) {
      console.error('Typing indicator error:', error);
      socket.emit('error', { message: 'Error sending typing indicator' });
    }
  });

  socket.on('stopTyping', async (data) => {
    try {
      const { chatId } = data;

      if (!chatId) {
        return; // Silently fail for stopTyping
      }

      // VALIDATION: Check if chatId is valid
      if (!mongoose.Types.ObjectId.isValid(chatId)) {
        return;
      }

      // Verify user has access to this chat
      const chat = await Chat.findById(chatId);
      if (!chat) {
        return; // Silently fail if chat not found
      }

      let hasAccess = false;
      if (socket.userRole === 'admin') {
        hasAccess = true;
      } else if (socket.userRole === 'organization') {
        const organization = await Organization.findOne({ userId: socket.userId });
        hasAccess = organization && String(organization._id) === String(chat.organizationId);
      } else if (socket.userRole === 'homeless') {
        const homeless = await Homeless.findOne({ userId: socket.userId });
        hasAccess = homeless && String(homeless._id) === String(chat.homelessId);
      } else if (socket.userRole === 'merchant') {
        const merchant = await Merchant.findOne({ userId: socket.userId });
        hasAccess = merchant && String(merchant._id) === String(chat.merchantId);
      }

      if (!hasAccess) {
        return; // Silently fail if no access
      }

      // Get user info for typing indicator
      const user = await User.findById(socket.userId).select('username email');

      // Broadcast stop typing status to all users in chat room (except sender)
      socket.to(`chat:${chatId}`).emit('typing', {
        chatId,
        userId: socket.userId,
        userRole: socket.userRole,
        username: user?.username || 'User',
        email: user?.email || '',
        isTyping: false,
        timestamp: new Date(),
      });

      console.log(`[Socket] ✅ User ${socket.userId} stopped typing in chat ${chatId}`);
    } catch (error) {
      console.error('Stop typing indicator error:', error);
      // Silently fail for stopTyping
    }
  });

  // Handle message read status (real-time read receipts)
  socket.on('messageRead', async (data) => {
    try {
      const { chatId } = data;

      if (!chatId) {
        socket.emit('error', { message: 'Chat ID required' });
        return;
      }

      // VALIDATION: Check if chatId is valid
      if (!mongoose.Types.ObjectId.isValid(chatId)) {
        // Silent return for read status to avoid spamming errors
        return;
      }

      // Verify user has access to this chat
      const chat = await Chat.findById(chatId);
      if (!chat) {
        socket.emit('error', { message: 'Chat not found' });
        return;
      }

      let hasAccess = false;
      if (socket.userRole === 'admin') {
        hasAccess = true;
      } else if (socket.userRole === 'organization') {
        const organization = await Organization.findOne({ userId: socket.userId });
        hasAccess = organization && String(organization._id) === String(chat.organizationId);
      } else if (socket.userRole === 'homeless') {
        const homeless = await Homeless.findOne({ userId: socket.userId });
        hasAccess = homeless && String(homeless._id) === String(chat.homelessId);
      } else if (socket.userRole === 'merchant') {
        const merchant = await Merchant.findOne({ userId: socket.userId });
        hasAccess = merchant && String(merchant._id) === String(chat.merchantId);
      }

      if (!hasAccess) {
        socket.emit('error', { message: 'Access denied to this chat' });
        return;
      }

      // Broadcast read status to all users in the chat room
      io.to(`chat:${chatId}`).emit('messagesRead', {
        chatId,
        readBy: socket.userId,
        readByRole: socket.userRole,
        readAt: new Date(),
      });

      console.log(`[Socket] ✅ Read status broadcasted - User ${socket.userId} read messages in chat ${chatId}`);
    } catch (error) {
      console.error('Message read error:', error);
      socket.emit('error', { message: 'Error updating read status' });
    }
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.userId}`);
  });
});



server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on http://${HOST}:${PORT}`);
  console.log(`Server is accessible from other devices on your network`);
  console.log(`Socket.IO is ready for real-time connections`);
});