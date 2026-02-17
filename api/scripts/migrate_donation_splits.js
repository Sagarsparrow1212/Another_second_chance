require('dotenv').config();
const mongoose = require('mongoose');
const Donation = require('../models/Donation');
const Homeless = require('../models/Homeless');

async function migrateDonationSplits() {
    console.log('Starting migration for Donation Splits...');

    // Connect to DB
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to DB');
    } catch (err) {
        console.error('DB Connection Error:', err);
        process.exit(1);
    }

    try {
        // Find all completed money donations
        // You might want to filter only those where organizationAmount is 0 or undefined
        // But user said "my old donation is not organization cut", so applying to all matching criteria is safer or filter by { organizationAmount: 0 }
        const query = {
            donationType: 'Money',
            status: 'Completed',
            // Optional: Only target those that likely need migration
            // $or: [{ organizationAmount: { $exists: false } }, { organizationAmount: 0 }] 
        };

        const donations = await Donation.find(query);
        console.log(`Found ${donations.length} donations to check/migrate.`);

        let updatedCount = 0;
        let skippedCount = 0;
        let errorCount = 0;

        for (const donation of donations) {
            try {
                // If fields are already set to non-zero, maybe skip? 
                // Uncomment to skip already split donations:
                // if (donation.organizationAmount > 0 || donation.homelessAmount > 0) {
                //    skippedCount++;
                //    continue;
                // }

                const homeless = await Homeless.findById(donation.homelessId);

                if (!homeless) {
                    console.warn(`Homeless record not found for donation ${donation.donationId}. Skipping.`);
                    errorCount++;
                    continue;
                }

                const cutPercentage = homeless.organizationCutPercentage || 0;

                // Use netAmount if available, else amount
                const baseAmount = donation.netAmount && donation.netAmount > 0 ? donation.netAmount : donation.amount;

                // Calculate split
                let organizationAmount = 0;
                let homelessAmount = baseAmount;

                if (cutPercentage > 0) {
                    organizationAmount = Number((baseAmount * (cutPercentage / 100)).toFixed(2));
                    homelessAmount = Number((baseAmount - organizationAmount).toFixed(2));
                }

                // Update donation
                donation.organizationAmount = organizationAmount;
                donation.homelessAmount = homelessAmount;

                // Also ensure netAmount is set if it was 0 (backfill netAmount as amount if missing fee info)
                if ((!donation.netAmount || donation.netAmount === 0) && donation.amount > 0) {
                    donation.netAmount = donation.amount;
                }

                await donation.save();

                console.log(`Updated Donation ${donation.donationId}: Net: ${baseAmount}, Cut: ${cutPercentage}%, Org: ${organizationAmount}, Homeless: ${homelessAmount}`);
                updatedCount++;

            } catch (innerErr) {
                console.error(`Failed to update donation ${donation._id}:`, innerErr.message);
                errorCount++;
            }
        }

        console.log('--------------------------------------------------');
        console.log(`Migration Completed.`);
        console.log(`Updated: ${updatedCount}`);
        console.log(`Skipped: ${skippedCount}`);
        console.log(`Errors: ${errorCount}`);

    } catch (error) {
        console.error('Migration Error:', error);
    } finally {
        await mongoose.connection.close();
    }
}

migrateDonationSplits();
