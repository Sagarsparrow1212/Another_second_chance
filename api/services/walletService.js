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

/**
 * Debit an organization's wallet (Withdrawal)
 * @param {string} organizationId - Organization ID
 * @param {number} amount - Amount to debit
 * @param {string} referenceId - Reference ID (Payout ID)
 * @param {string} referenceModel - Reference Model (Payout)
 * @param {string} description - Transaction description
 */
const debitWallet = async (organizationId, amount, referenceId, referenceModel, description) => {
    try {
        if (!amount || amount <= 0) return;

        let wallet = await Wallet.findOne({ organizationId });

        if (!wallet) {
            throw new Error('Wallet not found for organization');
        }

        if (wallet.currentBalance < amount) {
            console.warn(`Insufficient balance in wallet ${wallet._id} for withdrawal of ${amount}`);
            // In a real scenario, this should be pre-validated, but we handle it here just in case
        }

        // Check if transaction already exists (idempotency)
        const existingTx = await WalletTransaction.findOne({
            walletId: wallet._id,
            referenceId,
            referenceModel,
            type: 'DEBIT'
        });

        if (existingTx) {
            console.log(`Debit transaction already exists for ${referenceModel} ${referenceId}`);
            return;
        }

        // Create transaction
        await WalletTransaction.create({
            walletId: wallet._id,
            organizationId,
            amount: -Math.abs(amount), // Store as negative or handle in UI/Calculations
            type: 'DEBIT',
            description,
            referenceId,
            referenceModel,
            status: 'Completed'
        });

        // Update wallet
        wallet.currentBalance -= amount;
        wallet.totalWithdrawn += amount;
        wallet.lastTransactionAt = new Date();
        await wallet.save();

        console.log(`Debited wallet ${wallet._id} with ${amount}`);
    } catch (error) {
        console.error('Debit wallet error:', error);
    }
};

module.exports = {
    creditWallet,
    debitWallet
};
