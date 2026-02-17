const mongoose = require("mongoose");

const jobSchema = new mongoose.Schema(
  {
    merchantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Mechant", // Note: Merchant model is exported as 'Mechant' (typo in Merchant.js)
      required: false, // Made optional to support organization-posted jobs
    },
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: false, // Optional - jobs can be posted by merchants or organizations
    },
    createdByUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false, // Track which user created the job
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
    },
    salaryRange: {
      min: {
        type: Number,
        required: true,
        min: 0,
      },
      max: {
        type: Number,
        required: true,
        min: 0,
      },
    },
    location: {
      address: {
        type: String,
        required: true,
        trim: true,
      },
      lat: {
        type: Number,
        default: null,
      },
      lng: {
        type: Number,
        default: null,
      },
    },
    status: {
      type: String,
      enum: ["active", "closed", "pending"],
      default: "pending",
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// Index for faster queries
jobSchema.index({ merchantId: 1, isDeleted: 1 });
jobSchema.index({ organizationId: 1, isDeleted: 1 });
jobSchema.index({ createdByUserId: 1, isDeleted: 1 });
jobSchema.index({ status: 1, isDeleted: 1 });

// Validation: Either merchantId or organizationId must be provided
jobSchema.pre('validate', function(next) {
  if (!this.merchantId && !this.organizationId) {
    this.invalidate('merchantId', 'Either merchantId or organizationId must be provided');
    this.invalidate('organizationId', 'Either merchantId or organizationId must be provided');
  }
  next();
});

module.exports = mongoose.model("Job", jobSchema);

