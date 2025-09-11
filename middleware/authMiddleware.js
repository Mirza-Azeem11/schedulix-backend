const jwt = require('jsonwebtoken');
const { User, Role } = require('../models');

// Protect routes - require authentication
exports.protect = async (req, res, next) => {
  try {
    let token;

    // Get token from header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    // Make sure token exists
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route'
      });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from token
      const user = await User.findByPk(decoded.id, {
        include: [{
          model: Role,
          through: { attributes: [] }
        }]
      });

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Not authorized to access this route'
        });
      }

      // Check if user is active
      if (user.status !== 'Active') {
        return res.status(401).json({
          success: false,
          message: 'Account is not active'
        });
      }

      req.user = user;
      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route'
      });
    }
  } catch (error) {
    next(error);
  }
};

// Grant access to specific roles
exports.authorize = (...roles) => {
  return (req, res, next) => {
    // Role-based authorization removed - all authenticated users can access any route
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route'
      });
    }

    // Skip role checking - allow all authenticated users
    next();
  };
};
