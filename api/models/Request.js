const mongoose = require("mongoose");

const requestSchema = new mongoose.Schema(
  {
    requestId: {
      type: String,
      required: true,
      unique: true,
    },
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Pending",
      required: true,
    },
    resubmitted: {
      type: Boolean,
      default: false,
    },
    rejectionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Rejection",
      default: null,
    },
    previousRequestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Request",
      default: null,
    },
  },
  { timestamps: true }
);

// Index for faster queries
requestSchema.index({ organizationId: 1, createdAt: -1 });
requestSchema.index({ status: 1 });
// requestId already has unique: true which creates an index automatically

module.exports = mongoose.model("Request", requestSchema);

