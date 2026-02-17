const mongoose = require("mongoose");

const rejectionSchema = new mongoose.Schema(
  {
    rejectionId: {
      type: String,
      required: true,
      unique: true,
    },
    requestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Request",
      required: true,
    },
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
    },
    rejectedBy: {
      type: String,
      required: true, // Admin ID or email
    },
    reason: {
      type: String,
      required: true,
    },
    rejectedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Index for faster queries
rejectionSchema.index({ organizationId: 1, rejectedAt: -1 });
rejectionSchema.index({ requestId: 1 });
// rejectionId already has unique: true which creates an index automatically

module.exports = mongoose.model("Rejection", rejectionSchema);

