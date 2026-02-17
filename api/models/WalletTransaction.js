const mongoose = require('mongoose');

const walletTransactionSchema = new mongoose.Schema({
    walletId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Wallet',
        required: true
    },
    organizationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organization',
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    type: {
        type: String,
        enum: ['CREDIT', 'DEBIT'],
        required: true
    },
    description: {
        type: String,
        required: true
    },
    referenceId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true // e.g., Donation ID or Payout ID
    },
    referenceModel: {
        type: String,
        required: true,
        enum: ['Donation', 'Payout', 'Adjustment']
    },
    status: {
        type: String,
        enum: ['Pending', 'Completed', 'Failed'],
        default: 'Completed'
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    }
}, { timestamps: true });

// Indexes
walletTransactionSchema.index({ walletId: 1, createdAt: -1 });
walletTransactionSchema.index({ organizationId: 1 });
walletTransactionSchema.index({ referenceId: 1, referenceModel: 1 });

module.exports = mongoose.model('WalletTransaction', walletTransactionSchema);
