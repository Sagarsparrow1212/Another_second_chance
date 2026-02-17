const User = require('../models/User');
const Organization = require('../models/Organization');
const Request = require('../models/Request');
const generateToken = require('../services/generateToken');

/**
 * @desc    Register a new user
 * @route   POST /api/v1/auth/register
 * @access  Public
 */
const registerUser = async (req, res) => {
  try {
    const { email, password, role, username, ...roleSpecificData } = req.body;

    // Step 1: Validate required fields
    if (!email || !password || !role) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email, password, and role',
      });
    }

    // Step 2: Check if email already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered',
      });
    }

    // Step 3: Validate role
    const validRoles = ['homeless', 'organization', 'merchant', 'donor', 'admin'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role. Must be one of: homeless, organization, merchant, donor, admin',
      });
    }

    // Step 3.5: If role is organization, validate organization-specific fields BEFORE creating user
    if (role === 'organization') {
      const { orgName, orgType, streetAddress, city, state, zipCode, country } = roleSpecificData;

      if (!orgName || !orgType) {
        return res.status(400).json({
          success: false,
          message: 'Organization name and type are required for organization registration',
        });
      }

      if (!streetAddress || !city || !state || !zipCode || !country) {
        return res.status(400).json({
          success: false,
          message: 'All address fields (street address, city, state, zip code, and country) are required for organization registration',
        });
      }
    }

    // Step 4: Create user in users collection
    const userPayload = {
      email: email.toLowerCase(),
      password, // Will be hashed by pre-save hook
      role,
      isVerified: false,
      isActive: true,
    };

    if (username) {
      userPayload.username = username;
    }

    const user = await User.create(userPayload);

    // Step 5: If role is organization, create organization profile
    let organization = null;
    if (role === 'organization') {
      // Extract organization-specific fields
      // IMPORTANT: email is already extracted from req.body at line 13, so it's NOT in roleSpecificData
      // Do NOT extract email from roleSpecificData - it will be undefined and shadow the outer email variable
      const { orgName, orgType, streetAddress, city, state, zipCode, country, contactPerson, emergencyContactEmail, contactPhone, documentNames, photoNames } = roleSpecificData;

      // Handle uploaded documents from multer
      let documents = [];
      if (req.files && req.files.documents && Array.isArray(req.files.documents)) {
        // Parse document names if sent as JSON string
        let docNames = [];
        if (documentNames) {
          try {
            docNames = typeof documentNames === 'string' ? JSON.parse(documentNames) : documentNames;
          } catch (e) {
            console.error('Error parsing document names:', e);
          }
        }

        // Map uploaded files to document objects
        documents = req.files.documents.map((file, index) => {
          const docName = docNames[index] || file.originalname || `Document ${index + 1}`;
          return {
            docName: docName,
            docUrl: `/uploads/organizations/${file.filename}`,
          };
        });
      }

      // Handle uploaded photos from multer
      let photos = [];
      if (req.files && req.files.photos && Array.isArray(req.files.photos)) {
        // Parse photo names if sent as JSON string
        let photoNameList = [];
        if (photoNames) {
          try {
            photoNameList = typeof photoNames === 'string' ? JSON.parse(photoNames) : photoNames;
          } catch (e) {
            console.error('Error parsing photo names:', e);
          }
        }

        // Map uploaded files to photo objects
        photos = req.files.photos.map((file, index) => {
          const photoName = photoNameList[index] || file.originalname || `Photo ${index + 1}`;
          return {
            photoName: photoName,
            photoUrl: `/uploads/organizations/${file.filename}`,
          };
        });
      }

      // Create organization profile
      // Use the email variable from the outer scope (extracted from req.body at line 13)
      organization = await Organization.create({
        userId: user._id,
        email: email.toLowerCase(), // Required field - primary email (from req.body, already validated)  
        orgName,
        orgType,
        streetAddress,
        city,
        state,
        zipCode,
        country,
        contactPerson: contactPerson || '',
        emergencyContactEmail: emergencyContactEmail || email.toLowerCase(),
        contactPhone: contactPhone || '',
        verified: false,
        currentStatus: 'Pending',
        documents: documents,
        photos: photos,
      });

      // Create initial request for the organization after registration
      const requestId = `REQ${Date.now()}`;
      const initialRequest = await Request.create({
        requestId,
        organizationId: organization._id,
        userId: user._id,
        status: 'Pending',
        resubmitted: false,
        previousRequestId: null,
        rejectionId: null,
      });

      // Update organization with latestRequestId
      organization.latestRequestId = initialRequest._id;
      await organization.save();

      // Log organization registration activity
      try {
        const { logAuthActivity } = require('../services/activityLogger');
        await logAuthActivity.organizationRegistered({
          _id: organization._id,
          id: organization._id,
          userId: user._id,
          email: user.email,
          name: organization.orgName,
        }, req);
      } catch (logError) {
        console.error('Error logging organization registration:', logError);
        // Don't fail the registration if logging fails
      }
    }

    // Step 6: Generate JWT token
    const token = generateToken(user._id, user.role);

    // Step 7: Prepare response
    const responseData = {
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
        isActive: user.isActive,
      },
      token,
    };

    // Include organization data if it was created
    if (organization) {
      responseData.organization = {
        id: organization._id,
        orgName: organization.orgName,
        orgType: organization.orgType,
        verified: organization.verified,
      };
    }

    // Step 8: Return success response
    res.status(201).json({
      success: true,
      data: responseData,
      message: role === 'organization'
        ? 'Organization registered successfully'
        : 'User registered successfully',
    });

  } catch (error) {
    console.error('Registration error:', error);

    // Handle validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors,
      });
    }

    // Handle duplicate key error (email)
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered',
      });
    }

    // Generic error response
    res.status(500).json({
      success: false,
      message: 'Server error during registration',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
    });
  }
};

/**
 * @desc    Login user
 * @route   POST /api/v1/auth/login
 * @access  Public
 */
const loginUser = async (req, res) => {
  try {
    console.log("[Login] Incoming login request body:", req.body);

    const { email, username, password } = req.body;

    // Step 1: Validate required fields
    if ((!email && !username) || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email or username, and password',
      });
    }


    // Step 2: Find user by email or username and include password field
    let user = null;
    const searchEmail = email ? email.toLowerCase().trim() : null;
    const searchUsername = username ? username.toLowerCase().trim() : null;

    if (email) {
      console.log(`[Login] Searching for user with email: ${searchEmail}`);
      // If email is provided, try to find by email first
      user = await User.findOne({ email: searchEmail }).select('+password');

      if (user) {
        console.log(`[Login] User found by email - ID: ${user._id}, Role: ${user.role}, Active: ${user.isActive}`);
      } else {
        console.log(`[Login] User not found by email, trying as username...`);
        // If not found by email, also try as username (fallback for homeless users)
        // This handles cases where user might have provided email but it's actually stored as username
        user = await User.findOne({ username: searchEmail }).select('+password');
        if (user) {
          console.log(`[Login] User found by username - ID: ${user._id}, Role: ${user.role}, Active: ${user.isActive}`);
        }
      }
    } else if (username) {
      console.log(`[Login] Searching for user with username: ${searchUsername}`);
      // If username is provided, try to find by username
      user = await User.findOne({ username: searchUsername }).select('+password');

      if (user) {
        console.log(`[Login] User found by username - ID: ${user._id}, Role: ${user.role}, Active: ${user.isActive}`);
      } else if (username.includes('@')) {
        console.log(`[Login] Username looks like email, trying as email...`);
        // If not found by username and it looks like an email, also try as email
        user = await User.findOne({ email: searchUsername }).select('+password');
        if (user) {
          console.log(`[Login] User found by email - ID: ${user._id}, Role: ${user.role}, Active: ${user.isActive}`);
        }
      }
    }

    if (!user) {
      console.log(`[Login] ❌ User not found - Email: ${searchEmail || searchUsername}`);
      return res.status(401).json({
        success: false,
        message: 'Invalid email/username or password',
      });
    }

    // Update FCM token if provided
    if (req.body.fcmToken) {
      const fcmToken = req.body.fcmToken;
      console.log(`[Login] Updating FCM token for user ${user._id}`);

      // Add token to array if not already present (avoid duplicates)
      if (!user.fcmTokens) {
        user.fcmTokens = [];
      }

      if (!user.fcmTokens.includes(fcmToken)) {
        user.fcmTokens.push(fcmToken);
        await user.save();
      }
    }

    // Step 3: Check if user is active
    if (!user.isActive) {
      console.log(`[Login] ❌ User account is inactive - Email: ${user.email || user.username}`);
      return res.status(401).json({
        success: false,
        message: 'Your account has been deactivated. Please contact support.',
      });
    }

    // Step 4: Compare password
    console.log(`[Login] Comparing password for user: ${user.email || user.username}`);
    const isPasswordMatch = await user.comparePassword(password);

    if (!isPasswordMatch) {
      console.log(`[Login] ❌ Password mismatch for user: ${user.email || user.username}`);
      return res.status(401).json({
        success: false,
        message: 'Invalid email/username or password',
      });
    }

    console.log(`[Login] ✅ Password match successful for user: ${user.email || user.username}`);

    // Step 5: Fetch role-specific profile data based on user role
    let organization = null;
    let donor = null;
    let merchant = null;
    let homeless = null;

    if (user.role === 'organization') {
      organization = await Organization.findOne({ userId: user._id });
    } else if (user.role === 'donor') {
      const Donor = require('../models/Donor');
      donor = await Donor.findOne({ userId: user._id, isDeleted: false });
    } else if (user.role === 'merchant') {
      const Merchant = require('../models/Merchant');
      merchant = await Merchant.findOne({ userId: user._id, isDeleted: false });
    } else if (user.role === 'homeless') {
      const Homeless = require('../models/Homeless');
      homeless = await Homeless.findOne({ userId: user._id, isDeleted: false });
    }

    // Step 6: Generate JWT token
    const token = generateToken(user._id, user.role);

    // Step 7: Prepare response
    const responseData = {
      user: {
        id: user._id,
        email: user.email || null,
        username: user.username || null,
        role: user.role,
        isVerified: user.isVerified,
        isActive: user.isActive,
      },
      token,
    };

    // Include organization data if it exists
    if (organization) {
      responseData.organization = {
        id: organization._id,
        orgName: organization.orgName,
        orgType: organization.orgType,
        verified: organization.verified,
        logo: organization.logo || '',
        streetAddress: organization.streetAddress,
        city: organization.city,
        state: organization.state,
        zipCode: organization.zipCode,
        country: organization.country,
        contactPerson: organization.contactPerson,
        email: organization.email,
        emergencyContactEmail: organization.emergencyContactEmail,
        contactPhone: organization.contactPhone,
      };
    }

    // Include donor data if it exists
    if (donor) {
      responseData.donor = {
        id: donor._id,
        fullName: donor.donorFullName,
        email: donor.donorEmail,
        phone: donor.donorPhoneNumber || '',
        gender: donor.donorGender || '',
        address: donor.donorAddress || '',
        preferredDonationType: donor.preferredDonationType || '',
      };
    }

    // Include merchant data if it exists
    if (merchant) {
      responseData.merchant = {
        id: merchant._id,
        businessName: merchant.businessName,
        businessEmail: merchant.businessEmail,
        phoneNumber: merchant.phoneNumber || '',
        businessType: merchant.businessType || '',
        streetAddress: merchant.streetAddress || '',
        city: merchant.city || '',
        state: merchant.state || '',
        zipCode: merchant.zipCode || '',
        country: merchant.country || '',
        contactPersonName: merchant.contactPersonName || '',
        contactDesignation: merchant.contactDesignation || '',
      };
    }

    // Include homeless data if it exists
    if (homeless) {
      responseData.homeless = {
        id: homeless._id,
        fullName: homeless.fullName,
        username: user.username || '',
        email: homeless.contactEmail || user.email || '',
        phone: homeless.contactPhone || '',
        age: homeless.age || '',
        profilePicture: homeless.profilePicture || '',
        gender: homeless.gender || '',
        skillset: homeless.skillset || [],
        experience: homeless.experience || '',
        location: homeless.location || '',
        address: homeless.address || '',
        bio: homeless.bio || '',
      };
    }

    // Step 8: Return success response
    res.status(200).json({
      success: true,
      data: responseData,
      message: 'Login successful',
    });

  } catch (error) {
    console.error('Login error:', error);

    // Generic error response
    res.status(500).json({
      success: false,
      message: 'Server error during login',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
    });
  }
};

/**
 * @desc    Logout user
 * @route   POST /api/v1/auth/logout
 * @access  Private
 */
const logoutUser = async (req, res) => {
  try {
    const { fcmToken } = req.body;
    // Check if user exists in request (protect middleware should ensure this)
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized',
      });
    }
    const userId = req.user.id;

    console.log(`[Logout] User ${userId} logging out`);

    if (fcmToken) {
      // Remove the specific FCM token from the user's array
      console.log(`[Logout] Removing FCM token for user ${userId}`);

      await User.findByIdAndUpdate(
        userId,
        { $pull: { fcmTokens: fcmToken } },
        { new: true }
      );
    } else {
      console.log(`[Logout] No FCM token provided to remove`);
    }

    res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during logout',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
    });
  }
};

/**
 * @desc    Admin login - Verify admin credentials and return JWT token
 * @route   POST /api/admin/login
 * @access  Public
 */
const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Step 1: Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password',
      });
    }

    console.log(`[Admin Login] Attempting login for email: ${email.toLowerCase()}`);

    // Step 2: Find user by email and include password field
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

    if (!user) {
      console.log(`[Admin Login] User not found: ${email.toLowerCase()}`);
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    console.log(`[Admin Login] User found - Role: ${user.role}, Active: ${user.isActive}`);

    // Step 3: Verify user is an admin
    if (user.role !== 'admin') {
      console.log(`[Admin Login] Access denied - User role is '${user.role}', not 'admin'`);
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.',
      });
    }

    // Step 4: Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Your account has been deactivated. Please contact support.',
      });
    }

    // Step 5: Compare password
    const isPasswordMatch = await user.comparePassword(password);

    if (!isPasswordMatch) {
      console.log(`[Admin Login] Password mismatch for user: ${email.toLowerCase()}`);
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // Step 6: Generate JWT token
    const token = generateToken(user._id, user.role);

    console.log(`[Admin Login] ✅ Success - Admin logged in: ${user.email}`);

    // Step 7: Return success response with token
    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id,
          email: user.email,
          role: user.role,
          isVerified: user.isVerified,
          isActive: user.isActive,
        },
        token,
      },
      message: 'Admin login successful',
    });

  } catch (error) {
    console.error('Admin login error:', error);

    res.status(500).json({
      success: false,
      message: 'Server error during admin login',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
    });
  }
};

module.exports = {
  registerUser,
  loginUser,
  logoutUser,
  adminLogin,
};


const { sendResetPasswordOtpEmail } = require('../services/emailService');

/**
 * @desc    Send Reset Password OTP
 * @route   POST /api/v1/auth/reset-password-otp
 * @access  Private (Merchant, Organization, Homeless)
 */
const sendResetPasswordOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Email and OTP are required',
      });
    }

    if (!/^\S+@\S+\.\S+$/.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email address',
      });
    }

    if (!/^\d{6}$/.test(otp)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP format',
      });
    }

    // 🔍 Check user
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not registered',
      });
    }

    // 📧 Send OTP
    const emailResult = await sendResetPasswordOtpEmail(email, otp);

    if (!emailResult.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to send OTP email',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'OTP sent successfully',
      messageId: emailResult.messageId,
    });

  } catch (error) {
    console.error('Send OTP error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error sending OTP',
    });
  }
};


/**
 * @desc    Send Reset Password OTP
 * @route   POST /api/v1/auth/reset-password-otp
 * @access  Private (Merchant, Organization, Homeless)
 */

const resetPassword = async (req, res) => {
  console.log('[RESET_PASSWORD] Request received');

  try {
    const { email, newPassword } = req.body;

    console.log('[RESET_PASSWORD] Payload check:', {
      hasEmail: !!email,
      hasNewPassword: !!newPassword,
    });

    if (!email || !newPassword) {
      console.warn('[RESET_PASSWORD] Missing required fields');
      return res.status(400).json({
        success: false,
        message: 'Email and new password are required',
      });
    }

    const User = require('../models/User');
    console.log('[RESET_PASSWORD] User model loaded');

    console.log('[RESET_PASSWORD] Searching user by email:', email);
    const user = await User.findOne({ email });

    if (!user) {
      console.warn('[RESET_PASSWORD] User not found:', email);
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    console.log('[RESET_PASSWORD] User found:', {
      userId: user._id.toString(),
      email: user.email,
    });

    // DO NOT log password
    user.password = newPassword;
    console.log('[RESET_PASSWORD] Password updated in memory');

    await user.save();
    console.log('[RESET_PASSWORD] User saved successfully');

    return res.status(200).json({
      success: true,
      message: 'Password reset successfully',
    });

  } catch (error) {
    console.error('[RESET_PASSWORD] Error occurred:', {
      message: error.message,
      stack: error.stack,
    });

    return res.status(500).json({
      success: false,
      message: 'Server error resetting password',
    });
  }
};


module.exports.sendResetPasswordOtp = sendResetPasswordOtp;
module.exports.resetPassword = resetPassword;

