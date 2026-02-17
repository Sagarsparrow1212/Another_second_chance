const mongoose = require("mongoose");

const organizationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    email: { type: String, required: true  },
    orgName: { type: String, required: true },
    orgType: { 
      type: String, 
      enum: [
        "NGO", 
        "Private", 
        "Govt",
        "nonprofit",
        "shelter",
        "food_bank",
        "employment_agency",
        "merchant",
        "government"
      ], 
      required: true 
    },
    streetAddress: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    zipCode: { type: String, required: true },
    country: { type: String, required: true },
    contactPerson: { type: String },
    emergencyContactEmail: { type: String },
    contactPhone: { type: String },
    logo: { type: String }, // Optional organization logo
    // Quick reference fields for fast UI lookups
    currentStatus: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Pending",
    },
    latestRequestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Request",
      default: null,
    },
    latestRejectionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Rejection",
      default: null,
    },
    // Legacy fields (kept for backward compatibility, can be removed later)
    verified: { type: Boolean, default: false },
    resubmitted: { type: Boolean, default: false },
    documents: [
      {
        docName: String,
        docUrl: String,
      },
    ],
    photos: [
      {
        photoName: String,
        photoUrl: String,
      },
    ],
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

module.exports = mongoose.model("Organization", organizationSchema);
