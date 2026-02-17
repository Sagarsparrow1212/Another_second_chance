const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

// Connect to database
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/homeless';
    const conn = await mongoose.connect(mongoURI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

const createAdmin = async () => {
  try {
    await connectDB();

    const adminEmail = process.env.ADMIN_EMAIL || 'homelessadmin@gmail.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123';

    // Check if admin already exists
    const existingAdmin = await User.findOne({ 
      email: adminEmail.toLowerCase(),
      role: 'admin'
    });

    if (existingAdmin) {
      console.log('Admin user already exists!');
      console.log(`Email: ${existingAdmin.email}`);
      console.log('Updating password with new crypto encryption...');
      
      // Update the password - this will trigger the pre-save hook to encrypt it
      existingAdmin.password = adminPassword;
      await existingAdmin.save();
      
      console.log('✅ Admin password updated successfully!');
      console.log(`Email: ${existingAdmin.email}`);
      console.log(`Password: ${adminPassword}`);
      console.log('\n⚠️  IMPORTANT: Change the default password after first login!');
      
      await mongoose.connection.close();
      process.exit(0);
    }

    // Check if any admin exists (only one admin allowed)
    const anyAdmin = await User.findOne({ role: 'admin' });
    if (anyAdmin) {
      console.log('An admin user already exists with a different email!');
      console.log(`Existing admin email: ${anyAdmin.email}`);
      console.log('Only one admin account is allowed. Please delete the existing admin first.');
      process.exit(1);
    }

    // Create admin user
    const admin = await User.create({
      email: adminEmail.toLowerCase(),
      password: adminPassword,
      role: 'admin',
      isVerified: true,
      isActive: true,
    });

    console.log('✅ Admin user created successfully!');
    console.log(`Email: ${admin.email}`);
    console.log(`Password: ${adminPassword}`);
    console.log('\n⚠️  IMPORTANT: Change the default password after first login!');
    
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Error creating admin:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
};

// Run the script
createAdmin();

