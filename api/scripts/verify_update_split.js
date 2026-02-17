require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Homeless = require('../models/Homeless');
const Organization = require('../models/Organization');
const Donation = require('../models/Donation');
const donationController = require('../controllers/donationController');

// Mock helpers
const mockReq = (userData, params, body) => ({
    user: userData,
    params: params,
    body: body
});

const mockRes = () => {
    const res = {};
    res.status = (code) => {
        res.statusCode = code;
        res.json = (data) => {
            res.body = data;
            return res;
        };
        return res;
    };
    return res;
};

async function verifyUpdateSplit() {
    console.log('Starting verification for Update Donation Split...');

    // Connect to DB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to DB');

    let createdUser, createdOrg, createdHomeless, createdDonation;

    try {
        const timestamp = Date.now();

        // Organization
        const orgUser = await User.create({
            email: `test_org_upd_${timestamp}@test.com`,
            password: 'password123',
            role: 'organization',
            isActive: true,
            isVerified: true
        });

        createdOrg = await Organization.create({
            userId: orgUser._id,
            email: `test_org_upd_${timestamp}@test.com`,
            orgName: `Test Org Upd ${timestamp}`,
            orgType: 'NGO',
            streetAddress: '123 Test St',
            city: 'Test City',
            state: 'TS',
            zipCode: '12345',
            country: 'Test Country'
        });

        // Homeless
        createdUser = await User.create({
            username: `homeless_upd_${timestamp}`,
            password: 'password123',
            role: 'homeless'
        });

        createdHomeless = await Homeless.create({
            userId: createdUser._id,
            organizationId: createdOrg._id,
            fullName: `Homeless Upd ${timestamp}`,
            organizationCutPercentage: 20, // 20% cut
            age: 30,
            gender: 'Male'
        });

        // Create Pending Donation
        // Amount 100.
        createdDonation = await Donation.create({
            donationId: `DON-UPD-${timestamp}`,
            donorId: orgUser._id,
            homelessId: createdHomeless._id,
            organizationId: createdOrg._id,
            donationType: 'Money',
            amount: 100,
            status: 'Pending',
            paymentMethod: 'Cash'
        });

        console.log('Created Pending Donation.');

        // Invoke Controller to Update to Completed
        const req = mockReq(
            { ...orgUser.toObject(), _id: orgUser._id }, // User (Org role)
            { donationId: createdDonation._id },
            { status: 'Completed' }
        );
        const res = mockRes();

        console.log('Invoking updateDonation...');
        await donationController.updateDonation(req, res);

        // Verify
        const updatedDoc = res.body.data.donation;

        console.log('Updated Donation:', {
            status: updatedDoc.status,
            amount: updatedDoc.amount,
            orgAmount: updatedDoc.organizationAmount,
            homelessAmount: updatedDoc.homelessAmount
        });

        // Expected: 100 -> Cut 20% -> Org 20, Homeless 80.
        if (updatedDoc.organizationAmount === 20 && updatedDoc.homelessAmount === 80) {
            console.log('✅ PASS: Split calculated correctly on update.');
        } else {
            console.error(`❌ FAIL: Expected Org 20, Homeless 80. Got Org ${updatedDoc.organizationAmount}, Homeless ${updatedDoc.homelessAmount}`);
            process.exit(1);
        }

    } catch (error) {
        console.error('Error during verification:', error);
        process.exit(1);
    } finally {
        console.log('Cleaning up...');
        if (createdUser) await User.deleteMany({ _id: { $in: [createdUser._id, createdOrg.userId] } });
        if (createdHomeless) await Homeless.deleteOne({ _id: createdHomeless._id });
        if (createdOrg) await Organization.deleteOne({ _id: createdOrg._id });
        if (createdDonation) await Donation.deleteOne({ _id: createdDonation._id });
        await mongoose.connection.close();
    }
}

verifyUpdateSplit();
