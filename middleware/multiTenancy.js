const { Tenant } = require('../models');

// Multi-tenancy middleware that sets up tenant context after authentication
const multiTenancy = async (req, res, next) => {
  try {
    // Skip tenant check for public routes
    const publicRoutes = [
      '/auth/login',
      '/auth/register',
      '/auth/forgot-password',
      '/company/register',
      '/company/check-slug',
      '/health'
    ];

    const isPublicRoute = publicRoutes.some(route => req.path.includes(route));

    if (isPublicRoute) {
      return next();
    }

    // Ensure user is authenticated (should be set by authMiddleware)
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Get tenant_id from authenticated user
    const tenantId = req.user.tenant_id;

    if (!tenantId) {
      return res.status(400).json({
        success: false,
        message: 'No tenant associated with user'
      });
    }

    // Store tenant info in request for easy access
    req.tenant = req.user.Tenant || await Tenant.findByPk(tenantId);
    req.tenantId = tenantId;

    // Verify tenant is active
    if (!req.tenant || req.tenant.status !== 'Active') {
      return res.status(403).json({
        success: false,
        message: 'Tenant access denied or suspended'
      });
    }

    console.log('Multi-tenancy middleware: User', req.user.email, 'accessing tenant', req.tenant.name);

    next();
  } catch (error) {
    console.error('Multi-tenancy middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Tenant isolation error'
    });
  }
};

// Helper function to add tenant filtering to query options
const addTenantFilter = (options = {}, tenantId) => {
  if (!tenantId) return options;

  return {
    ...options,
    where: {
      ...options.where,
      tenant_id: tenantId
    }
  };
};

// Helper function to add tenant_id to create data
const addTenantData = (data = {}, tenantId) => {
  if (!tenantId) return data;

  return {
    ...data,
    tenant_id: tenantId
  };
};

module.exports = {
  multiTenancy,
  addTenantFilter,
  addTenantData
};
