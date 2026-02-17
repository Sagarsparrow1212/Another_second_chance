require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Homeless = require('../models/Homeless');
const Organization = require('../models/Organization');
const Donation = require('../models/Donation');
const donationController = require('../controllers/donationController');

// Mock helpers
const mockReq = (userData, query = {}) => ({
    user: userData,
    params: {},
    query: query
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

async function verifyOrgHistory() {
    console.log('Starting verification for Organization History API...');

    // Connect to DB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to DB');

    let createdUser, createdOrg, createdHomeless, createdDonation;

    try {
        const timestamp = Date.now();

        // Organization
        const orgUser = await User.create({
            email: `test_org_hist_${timestamp}@test.com`,
            password: 'password123',
            role: 'organization',
            isActive: true,
            isVerified: true
        });

        createdOrg = await Organization.create({
            userId: orgUser._id,
            email: `test_org_hist_${timestamp}@test.com`,
            orgName: `Test Org Hist ${timestamp}`,
            orgType: 'NGO',
            streetAddress: '123 Test St',
            city: 'Test',
            state: 'TS',
            zipCode: '12345',
            country: 'Test'
        });

        // Homeless
        const homelessUser = await User.create({
            username: `homeless_hist_${timestamp}`,
            password: 'password123',
            role: 'homeless'
        });

        createdHomeless = await Homeless.create({
            userId: homelessUser._id,
            organizationId: createdOrg._id,
            fullName: `Homeless Hist ${timestamp}`,
            organizationCutPercentage: 25,
            age: 30,
            gender: 'Male'
        });

        // Create Donation with Split (simulating migrated data)
        // Amount 100, Net 100, Cut 25% -> Org 25, Homeless 75
        createdDonation = await Donation.create({
            donationId: `DON-HIST-${timestamp}`,
            donorId: orgUser._id, // reuse
            homelessId: createdHomeless._id,
            organizationId: createdOrg._id,
            donationType: 'Money',
            amount: 100,
            netAmount: 100,
            organizationAmount: 25,
            homelessAmount: 75,
            status: 'Completed',
            paymentMethod: 'Card'
        });

        console.log('Created test data with orgAmount: 25');

        // Invoke Controller
        const req = mockReq(orgUser);
        const res = mockRes();

        console.log('Invoking getOrganizationDonationHistory...');
        await donationController.getOrganizationDonationHistory(req, res);

        // Verify
        const data = res.body.data;
        const donation = data.donations[0];
        const stats = data.statistics;

        console.log('First Donation in List:', {
            id: donation.donationId,
            amount: donation.amount,
            orgAmount: donation.organizationAmount,
            homelessAmount: donation.homelessAmount
        });

        if (donation.organizationAmount === 25) {
            console.log('✅ PASS: organziationAmount field matches (25)');
        } else {
            console.error(`❌ FAIL: Expected organizationAmount 25, got ${donation.organizationAmount}`);
            process.exit(1);
        }

        console.log('Statistics:', stats);
        // Note: Currently stats only show totalAmount (gross). 
        // If user wants revenue, we might need to add it.

    } catch (error) {
        console.error('Error during verification:', error);
        process.exit(1);
    } finally {
        console.log('Cleaning up...');
        if (createdOrg) await User.deleteOne({ _id: createdOrg.userId });
        if (createdHomeless) await User.deleteOne({ _id: createdHomeless.userId });
        if (createdOrg) await Organization.deleteOne({ _id: createdOrg._id });
        if (createdHomeless) await Homeless.deleteOne({ _id: createdHomeless._id });
        if (createdDonation) await Donation.deleteOne({ _id: createdDonation._id });
        await mongoose.connection.close();
    }
}

verifyOrgHistory();
