const mongoose = require('mongoose');
const { encrypt, decrypt } = require('../services/cryptoService');

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: function () {
            // Email is required if username is not provided
            return !this.username;
        },
        unique: true,
        sparse: true, // Allow null/undefined values while maintaining uniqueness
        lowercase: true,
        trim: true,
        validate: {
            validator: function (v) {
                // If email is provided, it must be valid format
                if (!v) return true; // Allow empty if username is provided
                return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
            },
            message: 'Please enter a valid email address'
        },
    },
    username: {
        type: String,
        unique: true,
        sparse: true, // Allow null/undefined values while maintaining uniqueness
        lowercase: true,
        trim: true,
        minlength: [3, 'Username must be at least 3 characters long'],
        maxlength: [30, 'Username must be at most 30 characters long'],
        validate: {
            validator: function (v) {
                if (!v) return true; // Allow empty if not required
                // Username validation: not all digits, no consecutive dots, cannot start/end with dot
                // Allows letters, numbers, dots, and underscores
                return /^(?![0-9]+$)(?!.*\.\.)(?!\.)(?!.*\.$)[a-z0-9._]{3,30}$/.test(v);
            },
            message: 'Username must be 3-30 characters, can contain letters, numbers, dots, and underscores. Cannot be all digits, cannot start/end with a dot, and cannot have consecutive dots.'
        },
        required: function () {
            // Username is required for homeless role
            return this.role === 'homeless';
        },
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [8, 'Password must be at least 8 characters long'],
        select: false,
    },
    role: {
        type: String,
        enum: ['homeless', 'organization', 'merchant', 'donor', 'admin'],
        required: [true, 'Role is required'],
    },
    isVerified: {
        type: Boolean,
        default: false,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    fcmTokens: {
        type: [String],
        default: [],
    },
}, { timestamps: true }); // timestamps will add createdAt and updatedAt fields to the schema

// Custom validation: require either email or username
userSchema.pre('validate', function (next) {
    if (!this.email && !this.username) {
        this.invalidate('email', 'Either email or username is required');
        this.invalidate('username', 'Either email or username is required');
    }
    next();
});

userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        return next();
    }
    // Encrypt password before saving
    try {
        this.password = encrypt(this.password);
        next();
    } catch (error) {
        next(error);
    }
});

userSchema.methods.comparePassword = function (candidatePassword) {
    try {

        // Check if password is encrypted (starts with hex characters and has proper length)
        // Encrypted passwords will be longer than 32 chars (IV + encrypted data)
        if (!this.password || this.password.length < 32) {
            console.error('[comparePassword] ❌ Password is too short or missing');
            return false;
        }

        // Validate that the password is a valid hex string
        const hexPattern = /^[0-9a-fA-F]+$/;
        if (!hexPattern.test(this.password)) {
            console.error('[comparePassword] ❌ Password is not in valid hex format');
            console.error(`[comparePassword] Password preview: ${this.password.substring(0, 20)}...`);
            return false;
        }

        // Decrypt stored password and compare with candidate password
        console.log('[comparePassword] Attempting to decrypt stored password...');
        const decryptedPassword = decrypt(this.password);
        console.log(`[comparePassword] Decrypted password length: ${decryptedPassword ? decryptedPassword.length : 'null'}`);
        console.log(`[comparePassword] Decrypted password (for debugging): "${decryptedPassword}"`);
        console.log(`[comparePassword] Candidate password (for debugging): "${candidatePassword}"`);
        console.log(`[comparePassword] Password comparison (===): ${decryptedPassword === candidatePassword}`);
        console.log(`[comparePassword] Password comparison (trimmed): ${decryptedPassword.trim() === candidatePassword.trim()}`);

        // Compare passwords (handle potential whitespace issues)
        const isMatch = decryptedPassword.trim() === candidatePassword.trim();
        console.log(`[comparePassword] ${isMatch ? '✅' : '❌'} Password ${isMatch ? 'matches' : 'does not match'}`);

        return isMatch;
    } catch (error) {
        console.error('[comparePassword] ❌ Password comparison error:', error);
        console.error('[comparePassword] Error details:', error.message);
        // If decryption fails, the password might be in old format (bcrypt)
        // Return false to indicate password mismatch
        return false;
    }
};

const User = mongoose.model('User', userSchema);

module.exports = User;