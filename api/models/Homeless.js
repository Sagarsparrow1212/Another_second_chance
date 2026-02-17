const mongoose = require('mongoose');

const homelessSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    organizationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Organization",
        required: true,
    },  organizationCutPercentage: {
    type: Number,
    required: true,
    min: 0,
    max: 30, // enforce business rule
},
    fullName: {
        type: String,
        required: true,
    },
  

    age: {
        type: Number,
        required: true,
        min: 10,
        max: 90,
    },
    gender: {
        type: String,
        enum: ['Male', 'Female', 'Prefer not to say'],
        required: true,
    },
    skillset: {
        type: [String],
        default: [],
    },
    experience: {
        type: String,
        default: '',
    },
    location: {
        type: String,
        default: '',
    },
    address: {
        type: String,
        default: '',
    },
    contactPhone: {
        type: String,
        default: '',
    },
    contactEmail: {
        type: String,
        default: '',
        lowercase: true,
        trim: true,
    },
    bio: {
        type: String,
        default: '',
    },
    languages: {
        type: [String],
        default: [],
    },
    healthConditions: {
        type: String,
        default: '',
    },
    profilePicture: {
        type: String,
        default: '',
    },
    verificationDocument: {
        type: String,
        default: '',
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

module.exports = mongoose.model('Homeless', homelessSchema);

