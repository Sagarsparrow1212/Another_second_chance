const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  text: {
    type: String,
    required: true,
  },
  read: {
    type: Boolean,
    default: false,
  },
  readAt: {
    type: Date,
    default: null,
  },
}, { timestamps: true });

const chatSchema = new mongoose.Schema({
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: false, // Made optional to support merchant chats
  },
  merchantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Mechant', // Note: Using 'Mechant' as per the model export name
    required: false,
  },
  homelessId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Homeless',
    required: true,
  },
  messages: [messageSchema],
  lastMessage: {
    type: mongoose.Schema.Types.ObjectId,
    default: null,
  },
  unreadCountOrganization: {
    type: Number,
    default: 0,
  },
  unreadCountMerchant: {
    type: Number,
    default: 0,
  },
  unreadCountHomeless: {
    type: Number,
    default: 0,
  },
  isDeleted: {
    type: Boolean,
    default: false,
  },
  deletedAt: {
    type: Date,
    default: null,
  },
}, { timestamps: true });

// Validation: Ensure either organizationId or merchantId is present
chatSchema.pre('validate', function (next) {
  if (!this.organizationId && !this.merchantId) {
    this.invalidate('organizationId', 'Either organizationId or merchantId must be provided');
    this.invalidate('merchantId', 'Either organizationId or merchantId must be provided');
  }
  next();
});

// Index for faster queries
chatSchema.index({ organizationId: 1, homelessId: 1 });
chatSchema.index({ merchantId: 1, homelessId: 1 });
chatSchema.index({ 'messages.createdAt': -1 });

module.exports = mongoose.model('Chat', chatSchema);

