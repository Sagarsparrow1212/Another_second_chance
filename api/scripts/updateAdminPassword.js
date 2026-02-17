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

const updateAdminPassword = async () => {
  try {
    await connectDB();

    const adminEmail = process.env.ADMIN_EMAIL || 'homelessadmin@gmail.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123';

    // Find the admin user
    const admin = await User.findOne({ 
      email: adminEmail.toLowerCase(),
      role: 'admin'
    });

    if (!admin) {
      console.log('❌ Admin user not found!');
      console.log(`Looking for email: ${adminEmail}`);
      console.log('Please create the admin first using createAdmin.js');
      await mongoose.connection.close();
      process.exit(1);
    }

    console.log('✅ Admin user found!');
    console.log(`Email: ${admin.email}`);
    console.log('Updating password with new crypto encryption...');

    // Update the password - this will trigger the pre-save hook to encrypt it
    admin.password = adminPassword;
    await admin.save();

    console.log('✅ Admin password updated successfully!');
    console.log(`Email: ${admin.email}`);
    console.log(`Password: ${adminPassword}`);
    console.log('\n⚠️  IMPORTANT: Change the default password after first login!');
    
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Error updating admin password:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
};

updateAdminPassword();

