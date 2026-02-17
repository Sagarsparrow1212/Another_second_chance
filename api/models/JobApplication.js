const mongoose = require("mongoose");

const jobApplicationSchema = new mongoose.Schema(
    {
        jobId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Job",
            required: true,
        },
        homelessId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Homeless",
            required: true,
        },
        status: {
            type: String,
            enum: ["pending", "accepted", "rejected"],
            default: "pending",
        },
        appliedAt: {
            type: Date,
            default: Date.now,
        },
    },
    { timestamps: true }
);

// Prevent duplicate applications for the same job by the same homeless person
jobApplicationSchema.index({ jobId: 1, homelessId: 1 }, { unique: true });

module.exports = mongoose.model("JobApplication", jobApplicationSchema);
