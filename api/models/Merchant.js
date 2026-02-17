const { required } = require("joi");
const mongoose = require("mongoose");



const merchantSchema = new mongoose.Schema(
    {
        userId:{
            type:mongoose.Schema.Types.ObjectId,
            ref:"User",
            required:true,
        },
        businessName:{
            type:String,
            required: true
        },
        businessEmail:{
            type:String,
            required:[true, "Email is required"],
            unique:true,
            lowercase:true,
            trim:true,
            match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please enter a valid email address'],
        },
        phoneNumber:
        {
            type:String,
            required:true
        },
        businessType:{
            type:String,
            enum:['Shop','Vendor','Services','Restaurant','Other'],
        },
        streetAddress: { type: String, required: true },
        city: { type: String, required: true },
        state: { type: String, required: true },
        contactPersonName: { type: String },
        contactDesignation: { type: String },
        // GST Certificate, Business License, Photo ID
        gstCertificate: { type: String },
        businessLicense: { type: String },
        photoId: { type: String },
        // Job references
        jobs: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: "Job",
        }],
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


module.exports = mongoose.model("Mechant",merchantSchema);