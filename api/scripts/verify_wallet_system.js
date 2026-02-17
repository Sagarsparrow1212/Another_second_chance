require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Homeless = require('../models/Homeless');
const Organization = require('../models/Organization');
const Donation = require('../models/Donation');
const Wallet = require('../models/Wallet');
const walletController = require('../controllers/walletController');
const donationController = require('../controllers/donationController');

// Mock helpers
const mockReq = (userData, params, body, query) => ({
    user: userData,
    params: params || {},
    body: body || {},
    query: query || {}
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

async function verifyWalletSystem() {
    console.log('Starting verification for Wallet System...');

    // Connect to DB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to DB');

    let createdUser, createdOrg, createdHomeless, createdDonation;

    try {
        const timestamp = Date.now();

        // 1. Setup Data
        const orgUser = await User.create({
            email: `test_wallet_${timestamp}@test.com`,
            password: 'password123',
            role: 'organization',
            isActive: true,
            isVerified: true
        });

        createdOrg = await Organization.create({
            userId: orgUser._id,
            email: `test_wallet_${timestamp}@test.com`,
            orgName: `Test Wallet ${timestamp}`,
            orgType: 'NGO',
            streetAddress: '123',
            city: 'Test',
            state: 'TS',
            zipCode: '123',
            country: 'US'
        });

        const homelessUser = await User.create({ username: `h_wallet_${timestamp}`, password: 'password123', role: 'homeless' }); // simplified

        createdHomeless = await Homeless.create({
            userId: homelessUser._id,
            organizationId: createdOrg._id,
            fullName: `Homeless Wallet ${timestamp}`,
            organizationCutPercentage: 30, // 30% split (Max)
            age: 30,
            gender: 'Male'
        });

        console.log('Created Org and Homeless.');

        // 2. Create Pending Donation (Amount 200)
        createdDonation = await Donation.create({
            donationId: `DON-WAL-${timestamp}`,
            donorId: orgUser._id, // reuse
            homelessId: createdHomeless._id,
            organizationId: createdOrg._id,
            donationType: 'Money',
            amount: 200,
            status: 'Pending'
        });

        // 3. Complete Donation via Controller (Triggers Wallet Credit)
        const updateReq = mockReq(
            { ...orgUser.toObject(), _id: orgUser._id },
            { donationId: createdDonation._id },
            { status: 'Completed' }
        );
        const updateRes = mockRes();

        await donationController.updateDonation(updateReq, updateRes);
        console.log('Donation completed via Controller.');

        // 4. Verify Wallet API (getMyWallet)
        const walletReq = mockReq({ ...orgUser.toObject(), _id: orgUser._id });
        const walletRes = mockRes();

        await walletController.getMyWallet(walletReq, walletRes);

        const walletData = walletRes.body.data.wallet;
        console.log('Wallet Data:', walletData);

        // Expected: 200 * 30% = 60
        if (walletData.currentBalance === 60) {
            console.log('✅ PASS: Wallet balance is correct (60).');
        } else {
            console.error(`❌ FAIL: Expected 60, got ${walletData.currentBalance}`);
            process.exit(1);
        }

        // 5. Verify Transactions API
        const txReq = mockReq({ ...orgUser.toObject(), _id: orgUser._id });
        const txRes = mockRes();

        await walletController.getWalletTransactions(txReq, txRes);
        const transactions = txRes.body.data.transactions;

        if (transactions.length > 0 && transactions[0].amount === 60) {
            console.log('✅ PASS: Transaction record found.');
        } else {
            console.error('❌ FAIL: No transaction record found.');
            process.exit(1);
        }

    } catch (error) {
        console.error('Error during verification:', error);
        process.exit(1);
    } finally {
        console.log('Cleaning up...');
        // Cleanup logic (skipping detailed cleanup for brevity, but ideally should delete everything)
        if (createdOrg) await Wallet.deleteOne({ organizationId: createdOrg._id });
        if (createdUser) await User.deleteMany({ email: { $regex: 'test_wallet_' } });
        // ... simplified cleanup
        await mongoose.connection.close();
    }
}

verifyWalletSystem();
