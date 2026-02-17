const mongoose = require('mongoose');

const donorSchema = new mongoose.Schema({
    userId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true,
    },
    donorFullName:{
        type:String,
        required:true,
    },
    donorEmail:{
        type:String,
        required:true,
        unique:true,
        lowercase:true,
        trim:true,
        match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please enter a valid email address'],
    },
    donorPhoneNumber:{
        type:String,
        required:true,
    },
    donorGender:{
        type:String,
        enum:['Male','Female','Prefer Not to Say'],
        required:true,
    },
   
    preferredDonationType:{
        type:String,
        enum:['Money','Food','Clothes','Services','Other'],
        default: '',
    },
    totalDonations:{
        type:Number,
        default: 0,
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

module.exports = mongoose.model('Donor', donorSchema);