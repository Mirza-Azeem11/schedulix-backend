const { validationResult } = require('express-validator');
const { User, Role, Doctor, Patient } = require('../models');

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

    const { email, password, first_name, last_name, phone, date_of_birth, gender, role, ...profileFields } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    // Create user
    const user = await User.create({
      email,
      password_hash: password,
      first_name,
      last_name,
      phone,
      date_of_birth,
      gender
    });

    let assignedRole = 'Patient';
    if (role && role === 'Doctor') {
      assignedRole = 'Doctor';
    }
    const dbRole = await Role.findOne({ where: { name: assignedRole } });
    if (dbRole) {
      await user.addRole(dbRole);
    }

    // Create profile based on role
    if (assignedRole === 'Doctor') {
      // Doctor-specific fields
      await Doctor.create({
        user_id: user.id,
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
        availability_status: 'Available',
        created_at: new Date(),
        updated_at: new Date()
      });
    } else {
      // Patient-specific fields
      await Patient.create({
        user_id: user.id,
        patient_code: profileFields.patient_code,
        blood_type: profileFields.blood_type,
        height: profileFields.height,
        weight: profileFields.weight,
        allergies: profileFields.allergies,
        current_medications: profileFields.current_medications,
        insurance_provider: profileFields.insurance_provider,
        insurance_policy_number: profileFields.insurance_policy_number,
        created_at: new Date(),
        updated_at: new Date()
      });
    }

    // Generate JWT token
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
          role: assignedRole
        },
        token
      }
    });
  } catch (error) {
    next(error);
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

    // Check for user and include roles
    const user = await User.findOne({
      where: { email },
      include: [{
        model: Role,
        through: { attributes: [] }
      }]
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

    // Check password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Update last login
    await user.update({ last_login: new Date() });

    // Generate JWT token
    const token = user.getSignedJwtToken();
    // Prepare user data with role-specific IDs
    const userData = {
      user_id: user.id,  // Always include the user ID
      id: user.id,       // Keep existing id field for backward compatibility
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      phone: user.phone,
      status: user.status,
      roles: user.Roles?.map(role => role.name) || []
    };
    // Get role-specific IDs based on user roles
    const userRoles = user.Roles?.map(role => role.name) || [];

    // If user is a patient, include patient_id
    if (userRoles.includes('Patient')) {
      const { Patient } = require('../models');
      console.log("Has Patient",user.id);
      const patientRecord = await Patient.findOne({ where: { user_id: user.id } });
      console.log("patientRecord",patientRecord);

      if (patientRecord) {
        userData.patient_id = patientRecord.id;
        userData.id = patientRecord.id; // Set primary role ID
      }
    }

    // If user is a doctor, include doctor_id
    if (userRoles.includes('Doctor')) {
      const { Doctor } = require('../models');
      const doctorRecord = await Doctor.findOne({ where: { user_id: user.id } });
      if (doctorRecord) {
        userData.doctor_id = doctorRecord.id;
        userData.id = doctorRecord.id; // Set primary role ID
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

module.exports = {
  register,
  login,
  getMe,
  updateProfile,
  changePassword
};
