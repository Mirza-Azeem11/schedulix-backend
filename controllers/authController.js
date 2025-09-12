const { validationResult } = require('express-validator');
const { User, Role, Doctor, Patient, Tenant } = require('../models');

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { email, password, first_name, last_name, phone, date_of_birth, gender, role, tenant_slug, ...profileFields } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    // Determine tenant - either from tenant_slug, domain, or default
    let tenant;
    if (tenant_slug) {
      tenant = await Tenant.findOne({ where: { slug: tenant_slug, status: 'Active' } });
      if (!tenant) {
        return res.status(400).json({
          success: false,
          message: 'Invalid tenant or tenant not active'
        });
      }
    } else {
      // Use default tenant for new registrations
      tenant = await Tenant.findOne({ where: { slug: 'default' } });
      if (!tenant) {
        return res.status(500).json({
          success: false,
          message: 'Default tenant not found. Please contact support.'
        });
      }
    }

    // Create user with tenant_id
    const user = await User.create({
      email,
      password_hash: password,
      first_name,
      last_name,
      phone,
      date_of_birth,
      gender,
      tenant_id: tenant.id
    });

    let assignedRole = 'Patient';
    if (role && role === 'Doctor') {
      assignedRole = 'Doctor';
    }
    const dbRole = await Role.findOne({ where: { name: assignedRole } });
    if (dbRole) {
      await user.addRole(dbRole);
    }

    // Create profile based on role with tenant_id
    if (assignedRole === 'Doctor') {
      // Doctor-specific fields
      await Doctor.create({
        user_id: user.id,
        tenant_id: tenant.id,
        license_number: profileFields.license_number,
        specialization: profileFields.specialization,
        qualification: profileFields.qualification,
        experience_years: profileFields.experience_years,
        consultation_fee: profileFields.consultation_fee,
        bio: profileFields.bio,
        office_address: profileFields.office_address,
        consultation_hours: profileFields.consultation_hours,
        languages_spoken: profileFields.languages_spoken,
        rating: 0,
        total_reviews: 0,
        verified: false,
        availability_status: 'Available'
      });
    } else {
      // Patient-specific fields
      await Patient.create({
        user_id: user.id,
        tenant_id: tenant.id,
        patient_code: profileFields.patient_code,
        blood_type: profileFields.blood_type,
        height: profileFields.height,
        weight: profileFields.weight,
        allergies: profileFields.allergies,
        current_medications: profileFields.current_medications,
        insurance_provider: profileFields.insurance_provider,
        insurance_policy_number: profileFields.insurance_policy_number
      });
    }

    // Generate JWT token (includes tenant_id)
    const token = user.getSignedJwtToken();

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: {
          id: user.id,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          phone: user.phone,
          status: user.status,
          roles: [assignedRole],
          tenant: {
            id: tenant.id,
            name: tenant.name,
            slug: tenant.slug
          }
        },
        token
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during registration'
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { email, password } = req.body;

    // Check for user and include roles and tenant - use withPassword scope to get password_hash
    const user = await User.scope('withPassword').findOne({
      where: { email },
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
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if user is active
    if (user.status !== 'Active') {
      return res.status(401).json({
        success: false,
        message: 'Account is not active'
      });
    }

    // Check if tenant is active
    if (!user.Tenant || user.Tenant.status !== 'Active') {
      return res.status(403).json({
        success: false,
        message: 'Tenant access suspended'
      });
    }

    // Check password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if user is a doctor and verify approval status
    const userRoles = user.Roles?.map(role => role.name) || [];
    if (userRoles.includes('Doctor')) {
      const doctorRecord = await Doctor.findOne({
        where: {
          user_id: user.id,
          tenant_id: user.tenant_id
        }
      });

      if (doctorRecord) {
        if (doctorRecord.approval_status === 'Pending') {
          return res.status(403).json({
            success: false,
            message: 'Your doctor registration is pending approval from the healthcare organization admin. Please wait for approval before logging in.'
          });
        }

        if (doctorRecord.approval_status === 'Rejected') {
          return res.status(403).json({
            success: false,
            message: 'Your doctor registration has been rejected. Please contact the healthcare organization for more information.',
            rejection_reason: doctorRecord.rejection_reason
          });
        }

        // Only approved doctors can proceed
        if (doctorRecord.approval_status !== 'Approved') {
          return res.status(403).json({
            success: false,
            message: 'Access denied. Please ensure your doctor profile is approved.'
          });
        }
      }
    }

    // Update last login
    await user.update({ last_login: new Date() });

    // Generate JWT token (includes tenant_id)
    const token = user.getSignedJwtToken();

    // Prepare user data with role-specific IDs
    const userData = {
      user_id: user.id,
      id: user.id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      phone: user.phone,
      status: user.status,
      roles: user.Roles?.map(role => role.name) || [],
      tenant: {
        id: user.Tenant.id,
        name: user.Tenant.name,
        slug: user.Tenant.slug
      }
    };

    // Get role-specific IDs based on user roles
    // Note: userRoles already declared above, so we reuse it

    // If user is a patient, include patient_id
    if (userRoles.includes('Patient')) {
      const patientRecord = await Patient.findOne({ where: { user_id: user.id, tenant_id: user.tenant_id } });
      if (patientRecord) {
        userData.patient_id = patientRecord.id;
        userData.id = patientRecord.id;
      }
    }

    // If user is a doctor, include doctor_id
    if (userRoles.includes('Doctor')) {
      const doctorRecord = await Doctor.findOne({ where: { user_id: user.id, tenant_id: user.tenant_id } });
      if (doctorRecord) {
        userData.doctor_id = doctorRecord.id;
        userData.id = doctorRecord.id;
      }
    }

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: userData,
        token
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id, {
      include: [{
        model: Role,
        through: { attributes: [] }
      }],
      attributes: { exclude: ['password_hash'] }
    });

    res.status(200).json({
      success: true,
      data: {
        user: {
          ...user.toJSON(),
          roles: user.Roles?.map(role => role.name) || []
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { first_name, last_name, phone, date_of_birth, gender, avatar_url } = req.body;

    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    await user.update({
      first_name: first_name || user.first_name,
      last_name: last_name || user.last_name,
      phone: phone || user.phone,
      date_of_birth: date_of_birth || user.date_of_birth,
      gender: gender || user.gender,
      avatar_url: avatar_url || user.avatar_url
    });

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: {
          id: user.id,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          phone: user.phone,
          date_of_birth: user.date_of_birth,
          gender: user.gender,
          avatar_url: user.avatar_url
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
const changePassword = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { current_password, new_password } = req.body;

    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check current password
    const isMatch = await user.matchPassword(current_password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Update password
    await user.update({ password_hash: new_password });

    res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get list of healthcare organizations for doctor registration
// @route   GET /api/auth/organizations
// @access  Public
const getOrganizations = async (req, res, next) => {
  try {
    const organizations = await Tenant.findAll({
      where: {
        status: 'Active'
      },
      attributes: ['id', 'name', 'slug'],
      order: [['name', 'ASC']]
    });

    res.status(200).json({
      success: true,
      data: { organizations }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Register new doctor with organization selection
// @route   POST /api/auth/register-doctor
// @access  Public
const registerDoctor = async (req, res, next) => {
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
      // Personal info
      email,
      password,
      first_name,
      last_name,
      phone,
      date_of_birth,
      gender,

      // Organization selection
      tenant_id,

      // Doctor-specific info
      license_number,
      specialization,
      qualification,
      experience_years,
      consultation_fee,
      bio,
      office_address,
      consultation_hours,
      languages_spoken
    } = req.body;

    // Check if tenant exists and is active
    const tenant = await Tenant.findOne({
      where: {
        id: tenant_id,
        status: 'Active'
      }
    });

    if (!tenant) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or inactive healthcare organization selected'
      });
    }

    // Check if user with email already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    // Check if license number already exists
    const existingLicense = await Doctor.findOne({ where: { license_number } });
    if (existingLicense) {
      return res.status(400).json({
        success: false,
        message: 'License number already exists'
      });
    }

    // Create user account (inactive until approved)
    const user = await User.create({
      email,
      password_hash: password,
      first_name,
      last_name,
      phone,
      date_of_birth,
      gender,
      tenant_id,
      status: 'Inactive' // Set to inactive until approved
    });

    // Assign Doctor role
    const doctorRole = await Role.findOne({ where: { name: 'Doctor' } });
    if (doctorRole) {
      await user.addRole(doctorRole);
    }

    // Create doctor profile with pending approval
    const doctor = await Doctor.create({
      user_id: user.id,
      tenant_id,
      license_number,
      specialization,
      qualification,
      experience_years: experience_years || 0,
      consultation_fee: consultation_fee || 0,
      bio,
      office_address,
      consultation_hours,
      languages_spoken,
      approval_status: 'Pending',
      verified: false
    });

    res.status(201).json({
      success: true,
      message: 'Doctor registration submitted successfully. Your application is pending approval from the healthcare organization admin.',
      data: {
        doctor: {
          id: doctor.id,
          user_id: user.id,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          specialization: doctor.specialization,
          license_number: doctor.license_number,
          approval_status: doctor.approval_status,
          organization: {
            id: tenant.id,
            name: tenant.name
          }
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  getMe,
  updateProfile,
  changePassword,
  getOrganizations,
  registerDoctor
};
