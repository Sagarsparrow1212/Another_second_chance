require('dotenv').config();
const mongoose = require('mongoose');
const Wallet = require('../models/Wallet');
const WalletTransaction = require('../models/WalletTransaction');
const Donation = require('../models/Donation');
const Organization = require('../models/Organization');

async function initWallets() {
    console.log('Starting Wallet Initialization...');

    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to DB');

        const organizations = await Organization.find({ isDeleted: false });
        console.log(`Found ${organizations.length} organizations.`);

        for (const org of organizations) {
            console.log(`Processing Org: ${org.orgName} (${org._id})`);

            // 1. Find or Create Wallet
            let wallet = await Wallet.findOne({ organizationId: org._id });
            if (!wallet) {
                wallet = await Wallet.create({
                    organizationId: org._id,
                    currentBalance: 0,
                    totalEarnings: 0,
                    totalWithdrawn: 0
                });
                console.log(' - Created new wallet.');
            }

            // 2. Find all donations with organizationAmount > 0
            const donations = await Donation.find({
                organizationId: org._id,
                status: 'Completed',
                organizationAmount: { $gt: 0 }
            });

            console.log(` - Found ${donations.length} distinct commissionable donations.`);

            let calculatedBalance = 0;
            let transactionCount = 0;

            for (const donation of donations) {
                const amount = donation.organizationAmount;
                const desc = `Commission from donation ${donation.donationId}`;

                // Check if transaction exists
                const existingTx = await WalletTransaction.findOne({
                    walletId: wallet._id,
                    referenceId: donation._id,
                    type: 'CREDIT'
                });

                if (!existingTx) {
                    await WalletTransaction.create({
                        walletId: wallet._id,
                        organizationId: org._id,
                        amount: amount,
                        type: 'CREDIT',
                        description: desc,
                        referenceId: donation._id,
                        referenceModel: 'Donation',
                        status: 'Completed',
                        createdAt: donation.completedAt || donation.createdAt // Backdate
                    });
                    transactionCount++;
                }

                calculatedBalance += amount;
            }

            // 3. Update Wallet Balance based on calculation (Recalculate entirely to be safe)
            // Note: This logic assumes NO withdrawals have happened yet (since feature is new)
            // If we allow withdrawals in future, we must subtract them.
            // For now, Balance = Total Earnings.

            wallet.currentBalance = calculatedBalance;
            wallet.totalEarnings = calculatedBalance;
            await wallet.save();

            console.log(` - Updated Wallet: Balance $${calculatedBalance}, Created ${transactionCount} new transactions.`);
        }

        console.log('Wallet Initialization Completed.');

    } catch (error) {
        console.error('Migration Error:', error);
    } finally {
        await mongoose.connection.close();
    }
}

initWallets();
