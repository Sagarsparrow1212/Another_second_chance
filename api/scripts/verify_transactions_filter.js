const mongoose = require('mongoose');
const Wallet = require('d:/Testproject/Homeless/Homeless/api/models/Wallet');
const WalletTransaction = require('d:/Testproject/Homeless/Homeless/api/models/WalletTransaction');
const { getWalletTransactions } = require('d:/Testproject/Homeless/Homeless/api/controllers/walletController');
const Organization = require('d:/Testproject/Homeless/Homeless/api/models/Organization');
const User = require('d:/Testproject/Homeless/Homeless/api/models/User');

const MONGODB_URI = 'mongodb+srv://yashtrivedi:0MzwXM7YcFcqunh3@cluster0.0pl6tj6.mongodb.net/Homeless';

async function run() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('Connected');

        // Find an organization and its wallet
        const org = await Organization.findOne({ isDeleted: false });
        if (!org) {
            console.error('No organization found');
            return;
        }

        const wallet = await Wallet.findOne({ organizationId: org._id });
        if (!wallet) {
            console.error('No wallet found for org', org._id);
            return;
        }

        const mockRes = {
            status: function(code) { this.statusCode = code; return this; },
            json: function(data) { this.data = data; return this; }
        };

        const mockUser = await User.findById(org.userId);
        if (!mockUser) {
            console.error('No user found for id', org.userId);
            return;
        }

        // Test Filter: all
        console.log('\n--- Testing filter=all ---');
        const reqAll = {
            query: { filter: 'all' },
            user: { _id: mockUser._id, role: 'organization' }
        };
        await getWalletTransactions(reqAll, mockRes);
        console.log('Status (all):', mockRes.statusCode);
        if (mockRes.statusCode !== 200) {
            console.error('Error in filter=all:', mockRes.data);
        } else {
            console.log('Transaction Count (all):', mockRes.data.data.transactions.length);
        }

        // Test Filter: withdraw
        console.log('\n--- Testing filter=withdraw ---');
        const reqWithdraw = {
            query: { filter: 'withdraw' },
            user: { _id: mockUser._id, role: 'organization' }
        };
        await getWalletTransactions(reqWithdraw, mockRes);
        console.log('Status (withdraw):', mockRes.statusCode);
        if (mockRes.statusCode !== 200) {
            console.error('Error in filter=withdraw:', mockRes.data);
        } else {
            console.log('Transaction Count (withdraw):', mockRes.data.data.transactions.length);
            const allWithdraw = mockRes.data.data.transactions.every(t => t.type === 'DEBIT');
            console.log('All results are DEBIT:', allWithdraw);
        }

    } catch (err) {
        console.error('Verification error:', err);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected');
    }
}

run();
