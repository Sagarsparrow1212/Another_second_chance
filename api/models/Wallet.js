const mongoose = require('mongoose');

const walletSchema = new mongoose.Schema({
    organizationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organization',
        required: true,
        unique: true
    },
    currentBalance: {
        type: Number,
        default: 0,
        min: 0
    },
    totalEarnings: {
        type: Number,
        default: 0,
        min: 0
    },
    totalWithdrawn: {
        type: Number,
        default: 0,
        min: 0
    },
    currency: {
        type: String,
        default: 'USD',
        enum: ['USD']
    },
    isActive: {
        type: Boolean,
        default: true
    },
    lastTransactionAt: {
        type: Date,
        default: null
    }
}, { timestamps: true });

// Index for lookups
walletSchema.index({ organizationId: 1 });

module.exports = mongoose.model('Wallet', walletSchema);
