const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * @desc    Protect routes - Verify JWT token
 * @access  Private
 */
const protect = async (req, res, next) => {
  try {
    let token;

    // Check for token in Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
      // Handle case with multiple spaces (e.g., "Bearer  token")
      if (!token) {
        const parts = req.headers.authorization.split(' ');
        for (let i = 1; i < parts.length; i++) {
          if (parts[i] !== '') {
            token = parts[i];
            break;
          }
        }
      }
    }

    // If no token, return error
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route. Please provide a valid token.',
      });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from token
      const user = await User.findById(decoded.userId).select('-password');

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'User not found',
        });
      }

      // Check if user is active
      if (!user.isActive) {
        return res.status(401).json({
          success: false,
          message: 'User account has been deactivated',
        });
      }

      // Attach user to request object
      req.user = user;
      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token',
      });
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during authentication',
    });
  }
};

/**
 * @desc    Authorize routes - Check user role
 * @access  Private
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route',
      });
    }

    console.log(req.user.role);
    console.log(roles);


    if (!roles.includes(req.user.role)) {
      console.log(`[Authorization] Access denied - User role: '${req.user.role}', Required roles: [${roles.join(', ')}]`);
      return res.status(403).json({
        success: false,
        message: 'Access denied.',
      });
    }

    next();
  };
};

module.exports = { protect, authorize };

