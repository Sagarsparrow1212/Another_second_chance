/**
 * Script to fix the receiptNumber index in the Donation collection
 * This script drops the old index and recreates it with sparse: true
 * Run this once: node api/scripts/fixDonationIndex.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/database');

async function fixDonationIndex() {
    try {
        await connectDB();
        console.log('Connected to MongoDB');

        const db = mongoose.connection.db;
        
        // Try to find the donations collection (might be named differently)
        const collections = await db.listCollections().toArray();
        const donationsCollectionName = collections.find(col => 
            col.name === 'donations' || col.name.toLowerCase().includes('donation')
        )?.name || 'donations';
        
        console.log(`Using collection: ${donationsCollectionName}`);
        const collection = db.collection(donationsCollectionName);

        // Check existing indexes
        const indexes = await collection.indexes();
        console.log('Current indexes:', indexes.map(idx => idx.name));

        // Drop the old receiptNumber index if it exists
        try {
            await collection.dropIndex('receiptNumber_1');
            console.log('✓ Dropped old receiptNumber_1 index');
        } catch (error) {
            if (error.code === 27) {
                console.log('ℹ Index receiptNumber_1 does not exist, skipping drop');
            } else {
                throw error;
            }
        }

        // Create new sparse unique index
        await collection.createIndex(
            { receiptNumber: 1 },
            { 
                unique: true, 
                sparse: true,
                name: 'receiptNumber_1'
            }
        );
        console.log('✓ Created new sparse unique index on receiptNumber');

        // Verify the index
        const newIndexes = await collection.indexes();
        const receiptIndex = newIndexes.find(idx => idx.name === 'receiptNumber_1');
        console.log('✓ Index created successfully:', receiptIndex);

        console.log('\n✅ Index fix completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error fixing index:', error);
        process.exit(1);
    }
}

fixDonationIndex();

