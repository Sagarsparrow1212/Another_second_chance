const Wallet = require('../models/Wallet');
const WalletTransaction = require('../models/WalletTransaction');

/**
 * Credit an organization's wallet
 * @param {string} organizationId - Organization ID
 * @param {number} amount - Amount to credit
 * @param {string} referenceId - Reference ID (Donation ID)
 * @param {string} referenceModel - Reference Model (Donation)
 * @param {string} description - Transaction description
 */
const creditWallet = async (organizationId, amount, referenceId, referenceModel, description) => {
    try {
        if (!amount || amount <= 0) return;

        let wallet = await Wallet.findOne({ organizationId });

        if (!wallet) {
            wallet = await Wallet.create({
                organizationId,
                currentBalance: 0,
                totalEarnings: 0,
                totalWithdrawn: 0
            });
        }

        // Check if transaction already exists (idempotency)
        const existingTx = await WalletTransaction.findOne({
            walletId: wallet._id,
            referenceId,
            referenceModel,
            type: 'CREDIT'
        });

        if (existingTx) {
            console.log(`Transaction already exists for ${referenceModel} ${referenceId}`);
            return;
        }

        // Create transaction
        await WalletTransaction.create({
            walletId: wallet._id,
            organizationId,
            amount,
            type: 'CREDIT',
            description,
            referenceId,
            referenceModel,
            status: 'Completed'
        });

        // Update wallet
        wallet.currentBalance += amount;
        wallet.totalEarnings += amount;
        wallet.lastTransactionAt = new Date();
        await wallet.save();

        console.log(`Credited wallet ${wallet._id} with ${amount}`);
    } catch (error) {
        console.error('Credit wallet error:', error);
        // Don't throw to avoid breaking the main flow (fail safe), but store error logs
    }
};

module.exports = {
    creditWallet
};
