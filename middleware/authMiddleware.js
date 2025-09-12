const jwt = require('jsonwebtoken');
const { User, Role, Tenant } = require('../models');

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
        message: 'Not authorized to access this route - No token provided'
      });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('Decoded JWT:', decoded); // Debug log

      // Validate decoded token has required fields
      if (!decoded.id || !decoded.tenant_id) {
        console.log('Invalid JWT payload - missing id or tenant_id:', decoded);
        return res.status(401).json({
          success: false,
          message: 'Invalid token format'
        });
      }

      // Get user from token with explicit tenant_id filter to avoid multi-tenancy middleware conflicts
      const user = await User.findOne({
        where: {
          id: decoded.id,
          tenant_id: decoded.tenant_id
        },
        include: [
          {
            model: Role,
            through: { attributes: [] }
          },
          {
            model: Tenant,
            attributes: ['id', 'name', 'slug', 'status']
          }
        ]
      });

      if (!user) {
        console.log('User not found for ID:', decoded.id, 'with tenant_id:', decoded.tenant_id);
        return res.status(401).json({
          success: false,
          message: 'Not authorized to access this route - User not found'
        });
      }

      // Check if user is active
      if (user.status !== 'Active') {
        console.log('User account not active:', user.email, 'Status:', user.status);
        return res.status(401).json({
          success: false,
          message: 'Account is not active'
        });
      }

      // Check if tenant is active
      if (!user.Tenant || user.Tenant.status !== 'Active') {
        console.log('Tenant not active for user:', user.email, 'Tenant status:', user.Tenant?.status);
        return res.status(403).json({
          success: false,
          message: 'Tenant access suspended'
        });
      }

      console.log('Auth successful for user:', user.email, 'with tenant_id:', user.tenant_id);

      req.user = user;
      next();
    } catch (error) {
      console.log('JWT verification error:', error.message);
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route - Invalid token'
      });
    }
  } catch (error) {
    console.log('Auth middleware error:', error);
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
