const mongoose = require('mongoose');

const donationSchema = new mongoose.Schema({
    donationId: {
        type: String,
        unique: true,
        required: true,
        default: function () {
            return `DON-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
        }
    },
    donorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Donor',
        required: true,
    },
    homelessId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Homeless',
        required: true,
    },
    organizationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organization',
        required: true, // Organization that manages the homeless person
    },
    donationType: {
        type: String,
        enum: ['Money', 'Food', 'Clothes', 'Services', 'Other'],
        required: true,
    },
    amount: {
        type: Number,
        default: 0,
        min: 0,
        // Note: Validation for Money donations is handled in controller
    },
    currency: {
        type: String,
        default: 'USD',
        enum: ['USD'],
    },
    fee: {
        type: Number,
        default: 0,
        min: 0,
    },
    netAmount: {
        type: Number,
        default: 0,
        min: 0,
    },
    organizationAmount: {
        type: Number,
        default: 0,
        min: 0,
    },
    homelessAmount: {
        type: Number,
        default: 0,
        min: 0,
    },
    description: {
        type: String,
        trim: true,
        default: '',
    },
    status: {
        type: String,
        enum: ['Pending', 'Completed', 'Cancelled', 'Failed'],
        default: 'Pending',
    },
    paymentMethod: {
        type: String,
        // enum: ['Cash', 'Bank Transfer', 'UPI', 'Credit Card', 'Debit Card', 'PayPal',],
        default: null,
    },
    transactionId: {
        type: String,
        default: null,
        trim: true,
    },
    receiptNumber: {
        type: String,
    },
    notes: {
        type: String,
        trim: true,
        default: '',
    },
    // For non-monetary donations
    itemDetails: {
        quantity: {
            type: Number,
            default: null,
        },
        itemName: {
            type: String,
            default: null,
        },
        itemDescription: {
            type: String,
            default: null,
        },
    },
    // Delivery/Pickup information
    deliveryMethod: {
        type: String,
        enum: ['Pickup', 'Delivery', 'In-Person', null],
        default: null,
    },
    deliveryAddress: {
        type: String,
        default: null,
    },
    deliveryDate: {
        type: Date,
        default: null,
    },
    // Tracking
    completedAt: {
        type: Date,
        default: null,
    },
    cancelledAt: {
        type: Date,
        default: null,
    },
    cancelledReason: {
        type: String,
        default: null,
    },
    isDeleted: {
        type: Boolean,
        default: false,
    },
    deletedAt: {
        type: Date,
        default: null,
    },
    // Metadata for tracking
    metadata: {
        type: mongoose.Schema.Types.Mixed,
        default: {},
    },
}, { timestamps: true });

// Indexes for better query performance
donationSchema.index({ donorId: 1, isDeleted: 1 });
donationSchema.index({ homelessId: 1, isDeleted: 1 });
donationSchema.index({ organizationId: 1, isDeleted: 1 });
donationSchema.index({ status: 1, isDeleted: 1 });
donationSchema.index({ donationType: 1, isDeleted: 1 });
donationSchema.index({ createdAt: -1 });
donationSchema.index({ donationId: 1 });
// Sparse unique index for receiptNumber - only indexes non-null values, allowing multiple nulls
donationSchema.index({ receiptNumber: 1 }, { unique: true, sparse: true });

// Virtual for formatted amount
donationSchema.virtual('formattedAmount').get(function () {
    if (this.donationType === 'Money' && this.amount) {
        return `${this.currency} ${this.amount.toLocaleString()}`;
    }
    return null;
});

// Pre-save middleware to update completedAt and handle receiptNumber
donationSchema.pre('save', function (next) {
    // Ensure receiptNumber is never set to null (must be undefined for sparse index)
    // If receiptNumber is null or empty string, remove it (set to undefined)
    // This ensures the sparse index doesn't try to index null values
    if (this.receiptNumber === null || this.receiptNumber === '') {
        this.receiptNumber = undefined;
    }

    // Update completedAt and cancelledAt timestamps
    if (this.status === 'Completed' && !this.completedAt) {
        this.completedAt = new Date();
    }
    if (this.status === 'Cancelled' && !this.cancelledAt) {
        this.cancelledAt = new Date();
    }
    next();
});

// Method to update donor's totalDonations
donationSchema.methods.updateDonorTotal = async function () {
    if (this.status === 'Completed' && this.donationType === 'Money') {
        const Donor = mongoose.model('Donor');
        await Donor.findByIdAndUpdate(this.donorId, {
            $inc: { totalDonations: this.amount }
        });
    }
};

module.exports = mongoose.model('Donation', donationSchema);

