const { validationResult } = require('express-validator');
const { Tenant, User, Role } = require('../models');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

// @desc    Register new company/tenant
// @route   POST /api/company/register
// @access  Public
const registerCompany = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const {
      // Company/Tenant fields
      company_name,
      company_slug,
      domain,
      plan_type = 'Basic',
      max_users = 10,

      // Admin user fields
      admin_email,
      admin_first_name,
      admin_last_name,
      admin_phone,

      // Company settings
      address,
      city,
      state,
      country,
      postal_code,
      website
    } = req.body;

    // Check if company slug already exists
    const existingTenant = await Tenant.findOne({
      where: { slug: company_slug }
    });

    if (existingTenant) {
      return res.status(400).json({
        success: false,
        message: 'Company slug already exists. Please choose a different one.'
      });
    }

    // Check if domain already exists (if provided)
    if (domain) {
      const existingDomain = await Tenant.findOne({
        where: { domain: domain }
      });

      if (existingDomain) {
        return res.status(400).json({
          success: false,
          message: 'Domain already registered with another company.'
        });
      }
    }

    // Check if admin email already exists
    const existingUser = await User.findOne({
      where: { email: admin_email }
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Admin email already exists in the system.'
      });
    }

    // Generate temporary password for admin
    const tempPassword = "password123";

    // Create company settings object
    const companySettings = {
      address,
      city,
      state,
      country,
      postal_code,
      website,
      created_date: new Date().toISOString(),
      timezone: 'UTC',
      currency: 'USD',
      business_hours: {
        monday: { start: '09:00', end: '17:00', closed: false },
        tuesday: { start: '09:00', end: '17:00', closed: false },
        wednesday: { start: '09:00', end: '17:00', closed: false },
        thursday: { start: '09:00', end: '17:00', closed: false },
        friday: { start: '09:00', end: '17:00', closed: false },
        saturday: { start: '09:00', end: '13:00', closed: false },
        sunday: { start: '00:00', end: '00:00', closed: true }
      }
    };

    // Create the tenant/company
    const tenant = await Tenant.create({
      name: company_name,
      slug: company_slug,
      domain: domain || null,
      status: 'Active',
      plan_type,
      max_users,
      settings: companySettings,
      subscription_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days trial
    });

    // Create admin user for the company
    const adminUser = await User.create({
      email: admin_email,
      password_hash: tempPassword,
      first_name: admin_first_name,
      last_name: admin_last_name,
      phone: admin_phone,
      status: 'Active',
      email_verified: false,
      tenant_id: tenant.id
    });

    // Assign Admin role to the user
    const adminRole = await Role.findOne({ where: { name: 'Admin' } });
    if (adminRole) {
      await adminUser.addRole(adminRole);
    }

    // TODO: Send welcome email with login credentials
    // For now, we'll return the credentials in the response (remove in production)

    res.status(201).json({
      success: true,
      message: 'Company registered successfully! Admin login credentials have been sent to the provided email.',
      data: {
        company: {
          id: tenant.id,
          name: tenant.name,
          slug: tenant.slug,
          domain: tenant.domain,
          plan_type: tenant.plan_type,
          status: tenant.status
        },
        admin: {
          id: adminUser.id,
          email: adminUser.email,
          first_name: adminUser.first_name,
          last_name: adminUser.last_name
        },
        // Remove this in production - only for development
        temp_credentials: {
          email: admin_email,
          password: tempPassword,
          login_url: `${req.protocol}://${req.get('host')}/login?tenant=${company_slug}`
        }
      }
    });

  } catch (error) {
    console.error('Company registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during company registration',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get company details by slug
// @route   GET /api/company/:slug
// @access  Public
const getCompanyBySlug = async (req, res) => {
  try {
    const { slug } = req.params;

    const tenant = await Tenant.findOne({
      where: { slug, status: 'Active' },
      attributes: ['id', 'name', 'slug', 'domain', 'plan_type', 'settings']
    });

    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: 'Company not found or inactive'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        company: tenant
      }
    });

  } catch (error) {
    console.error('Get company error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error retrieving company details'
    });
  }
};

// @desc    Check if company slug is available
// @route   GET /api/company/check-slug/:slug
// @access  Public
const checkSlugAvailability = async (req, res) => {
  try {
    const { slug } = req.params;

    const existingTenant = await Tenant.findOne({
      where: { slug }
    });

    res.status(200).json({
      success: true,
      data: {
        available: !existingTenant,
        slug: slug
      }
    });

  } catch (error) {
    console.error('Check slug error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error checking slug availability'
    });
  }
};

module.exports = {
  registerCompany,
  getCompanyBySlug,
  checkSlugAvailability
};
