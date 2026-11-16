const mongoose = require('mongoose');
const Job = require('d:/Testproject/Homeless/Homeless/api/models/Job');
const Merchant = require('d:/Testproject/Homeless/Homeless/api/models/Merchant');
const JobApplication = require('d:/Testproject/Homeless/Homeless/api/models/JobApplication');
const Homeless = require('d:/Testproject/Homeless/Homeless/api/models/Homeless');
const User = require('d:/Testproject/Homeless/Homeless/api/models/User');
const { rejectApplication } = require('d:/Testproject/Homeless/Homeless/api/controllers/jobController');

const MONGODB_URI = 'mongodb+srv://yashtrivedi:0MzwXM7YcFcqunh3@cluster0.0pl6tj6.mongodb.net/Homeless';

console.log('Script started');
console.log('MONGODB_URI:', MONGODB_URI.replace(/:([^@]+)@/, ':****@'));

async function run() {
    try {
        console.log('Attempting to connect to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        // 1. Create dummy merchant user
        const merchantUser = await User.findOneAndUpdate(
            { email: 'test_merchant@example.com' },
            { password: 'password123', role: 'merchant', isActive: true },
            { upsert: true, new: true }
        );

        // 2. Create dummy homeless user
        const homelessUser = await User.findOneAndUpdate(
            { email: 'test_homeless@example.com' },
            { password: 'password123', role: 'homeless', isActive: true },
            { upsert: true, new: true }
        );

        // 3. Create dummy merchant profile
        const merchantProfile = await Merchant.findOneAndUpdate(
            { userId: merchantUser._id },
            { businessName: 'Test Business', businessEmail: merchantUser.email },
            { upsert: true, new: true }
        );

        // 4. Create dummy homeless profile
        const homelessProfile = await Homeless.findOneAndUpdate(
            { userId: homelessUser._id },
            { fullName: 'Test Homeless', contactEmail: homelessUser.email },
            { upsert: true, new: true }
        );

        // 5. Create dummy job
        const job = await Job.findOneAndUpdate(
            { merchantId: merchantProfile._id, title: 'Test Job' },
            { description: 'Test Description', category: 'Other', status: 'active', salaryRange: { min: 10, max: 20 }, location: { address: 'Test Location' } },
            { upsert: true, new: true }
        );

        // 6. Create dummy application
        const application = await JobApplication.findOneAndUpdate(
            { jobId: job._id, homelessId: homelessProfile._id },
            { status: 'pending' },
            { upsert: true, new: true }
        );

        console.log('Dummy data created/updated');

        // 7. Mock request and response
        const req = {
            params: { id: application._id.toString() },
            user: { _id: merchantUser._id, role: 'merchant' }
        };

        const res = {
            status: function(code) {
                this.statusCode = code;
                return this;
            },
            json: function(data) {
                this.data = data;
                return this;
            }
        };

        // 8. Call rejectApplication
        console.log('Calling rejectApplication...');
        await rejectApplication(req, res);

        console.log('Status Code:', res.statusCode);
        console.log('Response Data:', JSON.stringify(res.data, null, 2));

        // 9. Verify in DB
        const updatedApplication = await JobApplication.findById(application._id);
        console.log('Updated Application Status:', updatedApplication.status);

        if (updatedApplication.status === 'rejected' && res.statusCode === 200) {
            console.log('VERIFICATION SUCCESSFUL');
        } else {
            console.log('VERIFICATION FAILED');
        }

        // Cleanup (optional)
        // await JobApplication.deleteOne({ _id: application._id });
        // await Job.deleteOne({ _id: job._id });

    } catch (err) {
        console.error('Error during verification:', err);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
}

run();
