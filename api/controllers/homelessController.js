const Homeless = require('../models/Homeless');
const User = require('../models/User');
const generateToken = require('../services/generateToken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Helper function to generate dummy user data
const generateUsers = (count) => {
    const firstNames = ['John', 'Jane', 'Michael', 'Sarah', 'David', 'Emily', 'Robert', 'Lisa', 'William', 'Jessica', 'James', 'Ashley', 'Christopher', 'Amanda', 'Daniel', 'Stephanie', 'Matthew', 'Nicole', 'Anthony', 'Elizabeth'];
    const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin'];
    const skills = ['Cooking', 'Cleaning', 'Gardening', 'Carpentry', 'Plumbing', 'Electrical', 'Painting', 'Driving', 'Childcare', 'Elder Care', 'Computer Skills', 'Customer Service', 'Sales', 'Administration', 'Security'];
    const genders = ['Male', 'Female', 'Other'];

    const users = [];
    for (let i = 0; i < count; i++) {
        const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
        const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
        const fullName = `${firstName} ${lastName}`;
        const randomSkills = skills.sort(() => 0.5 - Math.random()).slice(0, Math.floor(Math.random() * 3) + 1);

        users.push({
            id: `dummy_${i + 1}`,
            fullName: fullName,
            email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@example.com`,
            phone: `+1${Math.floor(1000000000 + Math.random() * 9000000000)}`,
            age: Math.floor(18 + Math.random() * 50),
            gender: genders[Math.floor(Math.random() * genders.length)],
            skillset: randomSkills,
            experience: `${Math.floor(Math.random() * 10)} years`,
            address: `${Math.floor(100 + Math.random() * 9900)} Main Street, City ${i % 50}`,
            verified: Math.random() > 0.5,
            createdAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
        });
    }
    return users;
};


/**
 * @desc    Get all homeless users
 * @route   GET /api/v1/homeless
 * @access  Private
 */
const getAllHomeless = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const search = req.query.search || '';

        // Build base match for homeless documents
        const baseMatch = { isDeleted: false };
        if (search) {
            baseMatch.$or = [
                { fullName: { $regex: search, $options: 'i' } },
                { contactEmail: { $regex: search, $options: 'i' } },
                { contactPhone: { $regex: search, $options: 'i' } },
                { skillset: { $in: [new RegExp(search, 'i')] } },
            ];
        }

        // Use aggregation so we can join organizations and ensure organization.isDeleted === false
        const pipeline = [
            { $match: baseMatch },
            {
                $lookup: {
                    from: 'organizations',
                    localField: 'organizationId',
                    foreignField: '_id',
                    as: 'organization',
                },
            },
            { $unwind: { path: '$organization', preserveNullAndEmptyArrays: true } },
            // Only include homeless linked to organizations that exist and are not deleted
            { $match: { 'organization.isDeleted': false } },
            {
                $lookup: {
                    from: 'users',
                    localField: 'userId',
                    foreignField: '_id',
                    as: 'user',
                },
            },
            { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
            { $sort: { createdAt: -1 } },
            {
                $facet: {
                    data: [{ $skip: skip }, { $limit: limit }],
                    total: [{ $count: 'count' }],
                },
            },
        ];

        const aggResult = await Homeless.aggregate(pipeline);
        const homelessUsers = (aggResult[0] && aggResult[0].data) || [];
        const total = (aggResult[0] && aggResult[0].total && aggResult[0].total[0] && aggResult[0].total[0].count) || 0;

        const formattedHomeless = homelessUsers.map((homeless) => ({
            id: homeless._id.toString(),
            fullName: homeless.fullName,
            username: (homeless.user && homeless.user.username) || '',
            email: homeless.contactEmail || (homeless.user && homeless.user.email) || '',
            phone: homeless.contactPhone || '',
            age: homeless.age || '',
            gender: homeless.gender || '',
            skillset: homeless.skillset || [],
            experience: homeless.experience || '',
            address: homeless.address || '',
            bio: homeless.bio || '',
            languages: homeless.languages || [],
            healthConditions: homeless.healthConditions || '',
            profilePicture: homeless.profilePicture || '',
            organizationCutPercentage: homeless.organizationCutPercentage !== undefined && homeless.organizationCutPercentage !== null ? homeless.organizationCutPercentage : null,
            verificationDocument: homeless.verificationDocument || '',
            // verified: homeless.user && homeless.user.isVerified ? homeless.user.isVerified : false,
            createdAt: homeless.createdAt ? new Date(homeless.createdAt).toISOString().split('T')[0] : '',
        }));

        res.status(200).json({
            success: true,
            data: {
                homeless: formattedHomeless,
                pagination: {
                    currentPage: page,
                    totalPages: Math.ceil(total / limit),
                    totalItems: total,
                    itemsPerPage: limit,
                },
            },
            message: 'Homeless users fetched successfully',
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error while fetching homeless users',
            error: error.message,
        });
    }
};

/**
 * @desc    Get all homeless users by organization ID
 * @route   GET /api/v1/homeless/organization/:organizationId
 * @access  Private
 */
const getHomelessByOrganization = async (req, res) => {
    try {
        const { organizationId } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const search = req.query.search || '';

        // Validate organizationId
        if (!organizationId) {
            return res.status(400).json({
                success: false,
                message: 'Organization ID is required',
            });
        }

        // Verify organization exists
        const Organization = require('../models/Organization');
        const organization = await Organization.findById(organizationId);
        if (!organization || organization.isDeleted) {
            return res.status(404).json({
                success: false,
                message: 'Organization not found',
            });
        }

        // Build search query
        const searchQuery = search
            ? {
                organizationId: organizationId,
                $or: [
                    { fullName: { $regex: search, $options: 'i' } },
                    { contactEmail: { $regex: search, $options: 'i' } },
                    { contactPhone: { $regex: search, $options: 'i' } },
                    { skillset: { $in: [new RegExp(search, 'i')] } },
                ],
                isDeleted: false,
            }
            : {
                organizationId: organizationId,
                isDeleted: false,
            };

        const homelessUsers = await Homeless.find(searchQuery)
            .populate('userId', 'email username isVerified isActive')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean();

        const total = await Homeless.countDocuments(searchQuery);

        const formattedHomeless = homelessUsers.map((homeless) => ({
            id: homeless._id.toString(),
            _id: homeless._id.toString(),
            fullName: homeless.fullName,
            name: homeless.fullName,
            username: (homeless.userId && homeless.userId.username) || '',
            email: homeless.contactEmail || (homeless.userId && homeless.userId.email) || '',
            phone: homeless.contactPhone || '',
            contactPhone: homeless.contactPhone || '',
            contactEmail: homeless.contactEmail || '',
            age: homeless.age || '',
            gender: homeless.gender || '',
            skillset: homeless.skillset || [],
            skills: homeless.skillset || [],
            organizationCutPercentage: homeless.organizationCutPercentage !== undefined && homeless.organizationCutPercentage !== null ? homeless.organizationCutPercentage : null,
            experience: homeless.experience || '',
            address: homeless.address || '',
            bio: homeless.bio || '',
            languages: homeless.languages || [],
            healthConditions: homeless.healthConditions || '',
            profilePicture: homeless.profilePicture || '',
            verificationDocument: homeless.verificationDocument || '',
            verified: homeless.userId && homeless.userId.isVerified ? homeless.userId.isVerified : false,
            isActive: homeless.userId && homeless.userId.isActive !== undefined ? homeless.userId.isActive : true,
            createdAt: homeless.createdAt ? new Date(homeless.createdAt).toISOString() : '',
            organizationId: homeless.organizationId ? homeless.organizationId.toString() : organizationId,
        }));

        res.status(200).json({
            success: true,
            data: {
                homeless: formattedHomeless,
                organization: {
                    id: organization._id.toString(),
                    name: organization.orgName || organization.name || '',
                },
                pagination: {
                    currentPage: page,
                    totalPages: Math.ceil(total / limit),
                    totalItems: total,
                    itemsPerPage: limit,
                },
            },
            message: 'Homeless users fetched successfully',
        });
    } catch (error) {
        console.error('Get homeless by organization error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching homeless users',
            error: error.message,
        });
    }
};

/**
 * @desc    Get organization for homeless user (the organization they belong to)
 * @route   GET /api/v1/homeless/me/organization
 * @access  Private - Homeless role only
 */
const getMyOrganization = async (req, res) => {
    try {
        // i want to print whole req.user object for debugging
        console.log('req.user:', req.user);
        console.log('req.headers:', req.headers);
        console.log('req.params:', req.params);
        console.log('req.query:', req.query);
        console.log('req.method:', req.method);
        console.log('req.url:', req.originalUrl);

        // Ensure user has homeless role
        if (!req.user || req.user.role !== 'homeless') {
            return res.status(403).json({
                success: false,
                message: 'Only homeless users can access this endpoint',
            });
        }

        // Find homeless user by userId
        const homeless = await Homeless.findOne({
            userId: req.user._id,
            isDeleted: false,
        })
            .populate('organizationId')
            .lean();

        if (!homeless) {
            console.log('Homeless user not found for userId:', req.user._id);

            return res.status(404).json({
                success: false,
                message: 'Homeless user not found for this user',
            });
        }

        if (!homeless.organizationId) {
            return res.status(404).json({
                success: false,
                message: 'No organization assigned to this homeless user',
            });
        }

        const organization = homeless.organizationId;

        // Format the response
        const formattedOrganization = {
            id: organization._id.toString(),
            _id: organization._id.toString(),
            orgName: organization.orgName || organization.name || '',
            name: organization.orgName || organization.name || '',
            email: organization.contactEmail || '',
            contactEmail: organization.contactEmail || '',
            contactPhone: organization.contactPhone || '',
            orgType: organization.orgType || '',
            city: organization.city || '',
            state: organization.state || '',
            streetAddress: organization.streetAddress || '',
            zipCode: organization.zipCode || '',
            country: organization.country || '',
            logo: organization.logo || '',
            currentStatus: organization.currentStatus || 'Pending',
        };

        res.status(200).json({
            success: true,
            data: formattedOrganization,
            message: 'Organization fetched successfully',
        });
    } catch (error) {
        console.error('Get my organization error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching organization',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
        });
    }
};

/**
 * @desc    Get homeless user by authenticated user (for homeless users to get their own profile)
 * @route   GET /api/v1/homeless/me
 * @access  Private - Homeless role only
 */
const getMyHomeless = async (req, res) => {
    try {
        // Double-check: Ensure user has homeless role (extra security layer)
        if (!req.user || req.user.role !== 'homeless') {
            return res.status(403).json({
                success: false,
                message: `Only specific roles can access it.`,
            });
        }

        // Find homeless user by userId from authenticated user
        const homeless = await Homeless.findOne({
            userId: req.user._id,
            isDeleted: false,
        })
            .populate('userId', 'email username isVerified isActive')
            .lean();

        if (!homeless) {
            return res.status(404).json({
                success: false,
                message: 'Homeless user not found for this user',
            });
        }

        // Format the response
        const formattedHomeless = {
            id: homeless._id.toString(),
            name: homeless.fullName,
            fullName: homeless.fullName,
            username: (homeless.userId && homeless.userId.username) || '',
            age: homeless.age || '',
            gender: homeless.gender || '',
            organizationCutPercentage: homeless.organizationCutPercentage !== undefined && homeless.organizationCutPercentage !== null ? homeless.organizationCutPercentage : null,
            skillset: homeless.skillset || [],
            skills: homeless.skillset || [],
            experience: homeless.experience || '',
            location: homeless.location || '',
            address: homeless.address || '',
            contactPhone: homeless.contactPhone || '',
            contactEmail: homeless.contactEmail || '',
            email: homeless.contactEmail || (homeless.userId && homeless.userId.email) || '',
            bio: homeless.bio || '',
            languages: homeless.languages || [],
            healthConditions: homeless.healthConditions || '',
            profilePicture: homeless.profilePicture || '',
            verificationDocument: homeless.verificationDocument || '',
            // verified: homeless.userId && homeless.userId.isVerified ? homeless.userId.isVerified : false,
            isActive: homeless.userId && homeless.userId.isActive !== undefined ? homeless.userId.isActive : true,
            userEmail: homeless.userId && homeless.userId.email ? homeless.userId.email : '',
            isUserVerified: homeless.userId && homeless.userId.isVerified ? homeless.userId.isVerified : false,
            isUserActive: homeless.userId && homeless.userId.isActive !== undefined ? homeless.userId.isActive : true,
            createdAt: homeless.createdAt ? new Date(homeless.createdAt).toISOString() : '',
            updatedAt: homeless.updatedAt ? new Date(homeless.updatedAt).toISOString() : '',
        };

        res.status(200).json({
            success: true,
            data: formattedHomeless,
            message: 'Homeless user fetched successfully',
        });
    } catch (error) {
        console.error('Get my homeless error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching homeless user',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
        });
    }
};

/**
 * @desc    Get single homeless user by ID
 * @route   GET /api/v1/homeless/:id
 * @access  Public
 */
const getHomelessById = async (req, res) => {
    try {
        const homeless = await Homeless.findOne({
            _id: req.params.id,
            isDeleted: false,
        })
            .populate('userId', 'email isVerified isActive')
            .populate('organizationId', 'orgName name city state')
            .lean();

        if (!homeless) {
            return res.status(404).json({
                success: false,
                message: 'Homeless user not found',
            });
        }

        // Check if user has a password and get username
        const User = require('../models/User');
        const user = await User.findById(homeless.userId).select('+password').lean();
        const hasPassword = user && user.password && user.password.length > 0;
        const username = user && user.username ? user.username : '';

        // Format the response
        const formattedHomeless = {
            id: homeless._id.toString(),
            name: homeless.fullName,
            fullName: homeless.fullName,
            username: username,
            age: homeless.age || '',
            gender: homeless.gender || '',
            organizationCutPercentage: homeless.organizationCutPercentage !== undefined && homeless.organizationCutPercentage !== null ? homeless.organizationCutPercentage : null,
            skillset: homeless.skillset || [],
            skills: homeless.skillset || [],
            experience: homeless.experience || '',
            location: homeless.location || '',
            address: homeless.address || '',
            contactPhone: homeless.contactPhone || '',
            contactEmail: homeless.contactEmail || '',
            email: homeless.contactEmail || (homeless.userId && homeless.userId.email) || '',
            bio: homeless.bio || '',
            languages: homeless.languages || [],
            healthConditions: homeless.healthConditions || '',
            profilePicture: homeless.profilePicture || '',
            verificationDocument: homeless.verificationDocument || '',
            // verified: homeless.userId && homeless.userId.isVerified ? homeless.userId.isVerified : false,
            isActive: homeless.userId && homeless.userId.isActive !== undefined ? homeless.userId.isActive : true,
            userEmail: homeless.userId && homeless.userId.email ? homeless.userId.email : '',
            hasPassword: hasPassword,
            organizationId: homeless.organizationId ? homeless.organizationId._id.toString() : '',
            organization: homeless.organizationId ? {
                id: homeless.organizationId._id.toString(),
                name: homeless.organizationId.orgName || homeless.organizationId.name || '',
                city: homeless.organizationId.city || '',
                state: homeless.organizationId.state || '',
            } : null,
            createdAt: homeless.createdAt ? new Date(homeless.createdAt).toISOString() : '',
            updatedAt: homeless.updatedAt ? new Date(homeless.updatedAt).toISOString() : '',
        };

        res.status(200).json({
            success: true,
            data: formattedHomeless,
            message: 'Homeless user fetched successfully',
        });
    } catch (error) {
        console.error('Get homeless by ID error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching homeless user',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
        });
    }
};

/**
 * @desc    Register a new homeless user
 * @route   POST /api/v1/homeless/register
 * @access  Public
 */
const registerHomeless = async (req, res) => {
    try {
        const {
            username,
            password,
            fullName,
            age,
            gender,
            skillset,
            experience,
            organizationCutPercentage,
            location,
            address,
            contactPhone,
            contactEmail,
            bio,
            languages,
            healthConditions,
            organizationId,
        } = req.body;

        // Parse JSON strings if they come as strings
        const parsedSkillset = typeof skillset === 'string' ? JSON.parse(skillset) : skillset;
        const parsedLanguages = typeof languages === 'string' ? JSON.parse(languages) : languages;

        // Validate required fields
        if (!username || !password || !fullName || !age || !gender || !parsedSkillset || parsedSkillset.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Please provide all required fields: username, password, fullName, age, gender, and at least one skill',
            });
        }

        // Validate organizationId is provided
        if (!organizationId) {
            return res.status(400).json({
                success: false,
                message: 'Organization is required. Every homeless individual must be linked to an organization.',
            });
        }

        // Validate that the organization exists
        const Organization = require('../models/Organization');
        const organization = await Organization.findById(organizationId);
        if (!organization) {
            return res.status(400).json({
                success: false,
                message: 'Invalid organization. The specified organization does not exist.',
            });
        }

        // Check if organization is deleted
        if (organization.isDeleted) {
            return res.status(400).json({
                success: false,
                message: 'Cannot add homeless to a deleted organization.',
            });
        }

        // Validate username format
        const usernameTrimmed = username.trim().toLowerCase();
        if (usernameTrimmed.length < 3 || usernameTrimmed.length > 30) {
            return res.status(400).json({
                success: false,
                message: 'Username must be between 3 and 30 characters long',
            });
        }

        // Username validation: not all digits, no consecutive dots, cannot start/end with dot
        // Allows letters, numbers, dots, and underscores
        const usernameRegex = /^(?![0-9]+$)(?!.*\.\.)(?!\.)(?!.*\.$)[a-z0-9._]{3,30}$/;
        if (!usernameRegex.test(usernameTrimmed)) {
            return res.status(400).json({
                success: false,
                message: 'Username must be 3-30 characters, can contain letters, numbers, dots, and underscores. Cannot be all digits, cannot start/end with a dot, and cannot have consecutive dots.',
            });
        }

        // Validate password length
        if (password.length < 8) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 8 characters long',
            });
        }

        // Check if username already exists
        const existingUserByUsername = await User.findOne({ username: usernameTrimmed });
        if (existingUserByUsername) {
            return res.status(400).json({
                success: false,
                message: 'Username already taken. Please choose a different username.',
            });
        }

        // Validate age
        const ageNum = parseInt(age);
        if (isNaN(ageNum) || ageNum < 10 || ageNum > 90) {
            return res.status(400).json({
                success: false,
                message: 'Age must be between 10 and 90',
            });
        }

        // Validate gender
        const validGenders = ['Male', 'Female', 'Prefer not to say'];
        if (!validGenders.includes(gender)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid gender. Must be one of: Male, Female, Prefer not to say',
            });
        }

        // Validate email format if provided (optional for homeless users)
        let email = null;
        if (contactEmail && contactEmail.trim()) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(contactEmail.trim())) {
                return res.status(400).json({
                    success: false,
                    message: 'Please enter a valid email address',
                });
            }
            email = contactEmail.trim().toLowerCase();

            // Check if email already exists (only if it's a real email)
            const existingUserByEmail = await User.findOne({ email: email });
            if (existingUserByEmail) {
                return res.status(400).json({
                    success: false,
                    message: 'Email already registered',
                });
            }
        }

        // Handle file uploads
        let profilePicturePath = null;
        let verificationDocumentPath = null;

        // Create uploads directory if it doesn't exist
        const uploadsDir = path.join(__dirname, '../uploads/homeless');
        if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
        }

        // Handle file uploads from multer
        if (req.files) {
            if (req.files.profilePicture && req.files.profilePicture[0]) {
                profilePicturePath = `/uploads/homeless/${req.files.profilePicture[0].filename}`;
            }
            if (req.files.verificationDocument && req.files.verificationDocument[0]) {
                verificationDocumentPath = `/uploads/homeless/${req.files.verificationDocument[0].filename}`;
            }
        }

        // Create user with username and password (required for homeless users)
        let user = null;
        try {
            // Ensure username is always set for homeless users
            const userData = {
                username: usernameTrimmed,
                password: password, // Will be encrypted by pre-save hook
                role: 'homeless',
                isVerified: false,
                isActive: true,
            };

            // Add email only if provided (optional for homeless users)
            if (email) {
                userData.email = email;
            }

            console.log('Creating user with data:', { ...userData, password: '[REDACTED]' });

            user = await User.create(userData);

            console.log('User created successfully:', {
                id: user._id,
                username: user.username,
                email: user.email
            });
        } catch (userError) {
            // Handle duplicate username error (in case of race condition)
            if (userError.code === 11000) {
                const duplicateField = Object.keys(userError.keyPattern)[0];
                if (duplicateField === 'username') {
                    return res.status(400).json({
                        success: false,
                        message: 'Username already taken. Please choose a different username.',
                    });
                } else if (duplicateField === 'email') {
                    return res.status(400).json({
                        success: false,
                        message: 'Email already registered',
                    });
                }
            }
            throw userError;
        }



        let finalOrgCutPercentage;

        if (organizationCutPercentage !== undefined && organizationCutPercentage !== null) {
            const cut = Number(organizationCutPercentage);

            if (isNaN(cut) || cut < 0 || cut > 30) {
                return res.status(400).json({
                    success: false,
                    message: 'Organization cut percentage must be between 0 and 30',
                });
            }

            finalOrgCutPercentage = cut;
        } else {
            // Fallback to organization default
            if (organization.defaultCommissionPercentage === undefined) {
                return res.status(400).json({
                    success: false,
                    message: 'Organization default commission is not configured',
                });
            }

            finalOrgCutPercentage = organization.defaultCommissionPercentage;
        }


        // Create homeless profile (userId and organizationId are required)
        const homeless = await Homeless.create({
            userId: user._id, // Required - user is always created now
            organizationId: organizationId, // Required - must be linked to an organization
            organizationCutPercentage: finalOrgCutPercentage,
            fullName,
            age: ageNum,
            gender,
            skillset: parsedSkillset || [],
            experience: experience || '',
            location: location || '',
            address: address || '',
            contactPhone: contactPhone || '',
            contactEmail: contactEmail || '',
            bio: bio || '',
            languages: parsedLanguages || [],

            healthConditions: healthConditions || '',
            profilePicture: profilePicturePath,
            verificationDocument: verificationDocumentPath,
        });

        // Generate JWT token (user is always created now)
        const token = generateToken(user._id, user.role);

        res.status(201).json({
            success: true,
            data: {
                user: {
                    id: user._id,
                    username: user.username,
                    email: user.email || null,
                    role: user.role,
                    isVerified: user.isVerified,
                    isActive: user.isActive,
                },
                homeless: {
                    id: homeless._id,
                    fullName: homeless.fullName,
                    age: homeless.age,
                    gender: homeless.gender,
                    skillset: homeless.skillset,
                    organizationCutPercentage: homeless.organizationCutPercentage !== undefined && homeless.organizationCutPercentage !== null ? homeless.organizationCutPercentage : null,
                },
                token,
            },
            message: 'Homeless user registered successfully',
        });

    } catch (error) {
        console.error('Homeless registration error:', error);

        // Handle validation errors
        if (error.name === 'ValidationError') {
            const errors = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                errors,
            });
        }

        // Handle duplicate key error
        if (error.code === 11000) {
            const duplicateField = Object.keys(error.keyPattern)[0];
            if (duplicateField === 'username') {
                return res.status(400).json({
                    success: false,
                    message: 'Username already taken. Please choose a different username.',
                });
            } else if (duplicateField === 'email') {
                return res.status(400).json({
                    success: false,
                    message: 'Email already registered',
                });
            }
            return res.status(400).json({
                success: false,
                message: 'Duplicate entry. Please check your input.',
            });
        }

        // Generic error response
        res.status(500).json({
            success: false,
            message: 'Server error during homeless registration',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
        });
    }
};

/**
 * @desc    Update homeless user details
 * @route   PUT /api/v1/homeless/:id
 * @access  Public (should be Private with admin auth in production)
 */
const updateHomeless = async (req, res) => {
    try {
        const {
            fullName,
            age,
            gender,
            skillset,
            experience,
            location,
            address,
            contactPhone,
            contactEmail,
            bio,
            languages,
            healthConditions,
            email,
            password,
            organizationId,
            organizationCutPercentage,
        } = req.body;

        console.log('[DEBUG] updateHomeless Body:', JSON.stringify(req.body));
        console.log('[DEBUG] organizationCutPercentage received:', organizationCutPercentage);

        // Find homeless user
        const homeless = await Homeless.findById(req.params.id);

        if (!homeless) {
            return res.status(404).json({
                success: false,
                message: 'Homeless user not found',
            });
        }

        if (homeless.isDeleted) {
            return res.status(400).json({
                success: false,
                message: 'Cannot update deleted homeless user',
            });
        }

        // Validate and update organizationId if provided
        if (organizationId !== undefined) {
            if (!organizationId || organizationId.trim() === '') {
                return res.status(400).json({
                    success: false,
                    message: 'Organization is required. Every homeless individual must be linked to an organization.',
                });
            }

            // Validate that the organization exists
            const Organization = require('../models/Organization');
            const organization = await Organization.findById(organizationId);
            if (!organization) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid organization. The specified organization does not exist.',
                });
            }

            // Check if organization is deleted
            if (organization.isDeleted) {
                return res.status(400).json({
                    success: false,
                    message: 'Cannot assign homeless to a deleted organization.',
                });
            }

            homeless.organizationId = organizationId;
        }

        // Validate required fields
        if (fullName !== undefined && !fullName.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Full name is required',
            });
        }

        if (age !== undefined && (isNaN(age) || age < 10 || age > 90)) {
            return res.status(400).json({
                success: false,
                message: 'Age must be between 10 and 90',
            });
        }

        if (gender !== undefined && !['Male', 'Female', 'Prefer not to say'].includes(gender)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid gender. Must be Male, Female, or Prefer not to say',
            });
        }

        // Update user email and password if provided
        if (email !== undefined || password !== undefined) {
            const User = require('../models/User');
            const user = await User.findById(homeless.userId).select('+password');

            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'Associated user not found',
                });
            }

            // Validate and update email
            if (email !== undefined && email.trim() !== "") {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!email.trim()) {
                    return res.status(400).json({
                        success: false,
                        message: 'NOTY',
                    });
                }
                if (!emailRegex.test(email)) {
                    return res.status(400).json({
                        success: false,
                        message: 'Please enter a valid email address',
                    });
                }

                // Check if email is already taken by another user
                const existingUser = await User.findOne({
                    email: email.toLowerCase().trim(),
                    _id: { $ne: user._id }
                });

                if (existingUser) {
                    return res.status(400).json({
                        success: false,
                        message: 'Email is already registered',
                    });
                }

                user.email = email.toLowerCase().trim();
            }

            // Update password if provided
            if (password !== undefined && password.trim() !== '') {
                // Validate password length
                if (password.length < 8) {
                    return res.status(400).json({
                        success: false,
                        message: 'Password must be at least 8 characters long',
                    });
                }

                user.password = password; // Will be hashed by pre-save hook
            }

            await user.save();
        }

        // Parse JSON strings if they come as strings (for skillset and languages)
        let parsedSkillset = skillset;
        let parsedLanguages = languages;

        if (skillset !== undefined) {
            try {
                parsedSkillset = typeof skillset === 'string' ? JSON.parse(skillset) : skillset;
            } catch (e) {
                // If parsing fails, treat as array if it's already an array, otherwise empty array
                parsedSkillset = Array.isArray(skillset) ? skillset : [];
            }
        }

        if (languages !== undefined) {
            try {
                parsedLanguages = typeof languages === 'string' ? JSON.parse(languages) : languages;
            } catch (e) {
                // If parsing fails, treat as array if it's already an array, otherwise empty array
                parsedLanguages = Array.isArray(languages) ? languages : [];
            }
        }

        // Update fields (only update provided fields)
        if (fullName !== undefined) homeless.fullName = fullName.trim();
        if (age !== undefined) homeless.age = parseInt(age);
        if (gender !== undefined) homeless.gender = gender;
        if (skillset !== undefined) homeless.skillset = Array.isArray(parsedSkillset) ? parsedSkillset : [];
        if (experience !== undefined) homeless.experience = experience !== null && experience !== '' ? experience.trim() : '';
        if (location !== undefined) homeless.location = location.trim();
        if (address !== undefined) homeless.address = address.trim();
        if (contactPhone !== undefined) homeless.contactPhone = contactPhone.trim();
        if (contactEmail !== undefined) homeless.contactEmail = contactEmail.trim().toLowerCase();
        if (bio !== undefined) homeless.bio = bio.trim();

        if (languages !== undefined) homeless.languages = Array.isArray(parsedLanguages) ? parsedLanguages : [];
        if (healthConditions !== undefined) homeless.healthConditions = healthConditions.trim();

        if (organizationCutPercentage !== undefined && organizationCutPercentage !== null && organizationCutPercentage !== '') {
            const cutPercentage = parseFloat(organizationCutPercentage);
            if (isNaN(cutPercentage) || cutPercentage < 0 || cutPercentage > 30) {
                return res.status(400).json({
                    success: false,
                    message: 'Organization cut percentage must be between 0 and 30',
                });
            }
            homeless.organizationCutPercentage = cutPercentage;
        }

        // Handle profile picture upload
        if (req.files && req.files.profilePicture && req.files.profilePicture[0]) {
            // Delete old profile picture if it exists
            if (homeless.profilePicture) {
                const oldPicturePath = path.join(__dirname, '..', homeless.profilePicture);
                if (fs.existsSync(oldPicturePath)) {
                    try {
                        fs.unlinkSync(oldPicturePath);
                    } catch (err) {
                        console.error('Error deleting old profile picture:', err);
                    }
                }
            }
            homeless.profilePicture = `/uploads/homeless/${req.files.profilePicture[0].filename}`;
        }

        // Handle verification document upload
        if (req.files && req.files.verificationDocument && req.files.verificationDocument[0]) {
            // Delete old verification document if it exists
            if (homeless.verificationDocument) {
                const oldDocPath = path.join(__dirname, '..', homeless.verificationDocument);
                if (fs.existsSync(oldDocPath)) {
                    try {
                        fs.unlinkSync(oldDocPath);
                    } catch (err) {
                        console.error('Error deleting old verification document:', err);
                    }
                }
            }
            homeless.verificationDocument = `/uploads/homeless/${req.files.verificationDocument[0].filename}`;
        }

        await homeless.save();

        // Populate user data for response
        await homeless.populate('userId', 'email isVerified isActive');

        res.status(200).json({
            success: true,
            message: 'Homeless user updated successfully',
            data: {
                id: homeless._id.toString(),
                fullName: homeless.fullName,
                age: homeless.age,
                gender: homeless.gender,
                skillset: homeless.skillset,
                experience: homeless.experience,
                location: homeless.location,
                address: homeless.address,
                contactPhone: homeless.contactPhone,
                contactEmail: homeless.contactEmail,
                bio: homeless.bio,
                languages: homeless.languages,
                healthConditions: homeless.healthConditions,
                profilePicture: homeless.profilePicture || '',
                organizationCutPercentage: homeless.organizationCutPercentage !== undefined && homeless.organizationCutPercentage !== null ? homeless.organizationCutPercentage : null,
            },
        });
    } catch (error) {
        console.error('Update homeless error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while updating homeless user',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
        });
    }
};

/**
 * @desc    Soft delete homeless user
 * @route   DELETE /api/v1/homeless/:id
 * @access  Public (should be Private with admin auth in production)
 */
const deleteHomeless = async (req, res) => {
    try {
        const homeless = await Homeless.findById(req.params.id);

        if (!homeless) {
            return res.status(404).json({
                success: false,
                message: 'Homeless user not found',
            });
        }

        if (homeless.isDeleted) {
            return res.status(400).json({
                success: false,
                message: 'Homeless user is already deleted',
            });
        }

        // Soft delete: mark as deleted
        homeless.isDeleted = true;
        homeless.deletedAt = new Date();
        await homeless.save();

        res.status(200).json({
            success: true,
            message: 'Homeless user deleted successfully',
            data: {
                id: homeless._id,
                deletedAt: homeless.deletedAt,
            },
        });
    } catch (error) {
        console.error('Delete homeless error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while deleting homeless user',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
        });
    }
};

module.exports = {

    getAllHomeless,
    getHomelessById,
    getMyHomeless,
    getMyOrganization,
    getHomelessByOrganization,
    registerHomeless,
    updateHomeless,
    deleteHomeless,
}

