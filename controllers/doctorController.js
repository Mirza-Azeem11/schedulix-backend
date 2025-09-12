const { validationResult } = require('express-validator');
const { Doctor, User, Appointment, Patient } = require('../models');
const { Op } = require('sequelize');

// @desc    Get all doctors
// @route   GET /api/doctors
// @access  Public
const getDoctors = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      specialization,
      verified,
      availability_status,
      search
    } = req.query;
    const offset = (page - 1) * limit;

    // Multi-tenancy: Filter by tenant_id if user is authenticated
    const whereClause = {};
    if (req.user && req.user.tenant_id) {
      whereClause.tenant_id = req.user.tenant_id;
    }

    if (specialization) whereClause.specialization = { [Op.like]: `%${specialization}%` };
    if (verified !== undefined) whereClause.verified = verified === 'true';
    if (availability_status) whereClause.availability_status = availability_status;

    const userWhereClause = {};
    if (search) {
      userWhereClause[Op.or] = [
        { first_name: { [Op.like]: `%${search}%` } },
        { last_name: { [Op.like]: `%${search}%` } }
      ];
    }

    // Add tenant filter to user include if authenticated
    if (req.user && req.user.tenant_id) {
      userWhereClause.tenant_id = req.user.tenant_id;
    }

    const { count, rows: doctors } = await Doctor.findAndCountAll({
      where: whereClause,
      include: [{
        model: User,
        where: userWhereClause,
        attributes: { exclude: ['password_hash'] }
      }],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['rating', 'DESC'], ['total_reviews', 'DESC']]
    });

    res.status(200).json({
      success: true,
      data: {
        doctors,
        pagination: {
          current_page: parseInt(page),
          total_pages: Math.ceil(count / limit),
          total_records: count,
          per_page: parseInt(limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single doctor
// @route   GET /api/doctors/:id
// @access  Public
const getDoctor = async (req, res, next) => {
  try {
    const whereClause = { id: req.params.id };

    // Multi-tenancy: Filter by tenant_id if user is authenticated
    if (req.user && req.user.tenant_id) {
      whereClause.tenant_id = req.user.tenant_id;
    }

    const userWhereClause = {};
    if (req.user && req.user.tenant_id) {
      userWhereClause.tenant_id = req.user.tenant_id;
    }

    const doctor = await Doctor.findOne({
      where: whereClause,
      include: [{
        model: User,
        where: Object.keys(userWhereClause).length ? userWhereClause : undefined,
        attributes: { exclude: ['password_hash'] }
      }]
    });

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }

    res.status(200).json({
      success: true,
      data: { doctor }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new doctor profile
// @route   POST /api/doctors
// @access  Private (Admin only)
const createDoctor = async (req, res, next) => {
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
      user_id,
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

    // Check if user exists and doesn't already have a doctor profile
    const user = await User.findByPk(user_id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const existingDoctor = await Doctor.findOne({ where: { user_id } });
    if (existingDoctor) {
      return res.status(400).json({
        success: false,
        message: 'Doctor profile already exists for this user'
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

    const doctor = await Doctor.create({
      user_id,
      license_number,
      specialization,
      qualification,
      experience_years,
      consultation_fee,
      bio,
      office_address,
      consultation_hours,
      languages_spoken
    });

    const newDoctor = await Doctor.findByPk(doctor.id, {
      include: [{
        model: User,
        attributes: { exclude: ['password_hash'] }
      }]
    });

    res.status(201).json({
      success: true,
      message: 'Doctor profile created successfully',
      data: { doctor: newDoctor }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update doctor profile
// @route   PUT /api/doctors/:id
// @access  Private (Doctor/Admin)
const updateDoctor = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const doctor = await Doctor.findByPk(req.params.id, {
      include: [{ model: User }]
    });

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }

    // Check if user is the doctor or admin
    const userRoles = req.user.Roles?.map(role => role.name) || [];
    if (doctor.user_id !== req.user.id && !userRoles.includes('Admin')) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this doctor profile'
      });
    }

    const {
      specialization,
      qualification,
      experience_years,
      consultation_fee,
      bio,
      office_address,
      consultation_hours,
      languages_spoken,
      availability_status,
      approval_status
    } = req.body;

    await doctor.update({
      specialization: specialization || doctor.specialization,
      qualification: qualification || doctor.qualification,
      experience_years: experience_years || doctor.experience_years,
      consultation_fee: consultation_fee || doctor.consultation_fee,
      bio: bio || doctor.bio,
      office_address: office_address || doctor.office_address,
      consultation_hours: consultation_hours || doctor.consultation_hours,
      languages_spoken: languages_spoken || doctor.languages_spoken,
      availability_status: availability_status || doctor.availability_status,
      approval_status: approval_status || doctor.approval_status
    });

    const updatedDoctor = await Doctor.findByPk(doctor.id, {
      include: [{
        model: User,
        attributes: { exclude: ['password_hash'] }
      }]
    });

    res.status(200).json({
      success: true,
      message: 'Doctor profile updated successfully',
      data: { doctor: updatedDoctor }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get doctor's appointments
// @route   GET /api/doctors/:id/appointments
// @access  Private (Doctor/Admin)
const getDoctorAppointments = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status, date } = req.query;
    const offset = (page - 1) * limit;

    const doctor = await Doctor.findByPk(req.params.id);
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }

    // Check authorization
    const userRoles = req.user.Roles?.map(role => role.name) || [];
    if (doctor.user_id !== req.user.id && !userRoles.includes('Admin')) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view these appointments'
      });
    }

    const whereClause = { doctor_id: req.params.id };
    if (status) whereClause.status = status;
    if (date) whereClause.appointment_date = date;

    const { count, rows: appointments } = await Appointment.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Patient,
          include: [{ model: User, attributes: { exclude: ['password_hash'] } }]
        }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['appointment_date', 'ASC'], ['appointment_time', 'ASC']]
    });

    res.status(200).json({
      success: true,
      data: {
        appointments,
        pagination: {
          current_page: parseInt(page),
          total_pages: Math.ceil(count / limit),
          total_records: count,
          per_page: parseInt(limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete doctor profile
// @route   DELETE /api/doctors/:id
// @access  Private (Admin only)
const deleteDoctor = async (req, res, next) => {
  try {
    const doctor = await Doctor.findByPk(req.params.id);
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }

    await doctor.destroy();

    res.status(200).json({
      success: true,
      message: 'Doctor profile deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get pending doctor registrations for admin approval
// @route   GET /api/doctors/pending
// @access  Private (Admin only)
const getPendingRegistrations = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    // Multi-tenancy: Filter by tenant_id
    const whereClause = {
      approval_status: 'Pending'
    };

    if (req.user && req.user.tenant_id) {
      whereClause.tenant_id = req.user.tenant_id;
    }

    const { count, rows: pendingDoctors } = await Doctor.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          attributes: { exclude: ['password_hash'] },
          where: req.user && req.user.tenant_id ? { tenant_id: req.user.tenant_id } : {}
        }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['created_at', 'DESC']]
    });

    res.status(200).json({
      success: true,
      data: {
        pending_registrations: pendingDoctors,
        pagination: {
          current_page: parseInt(page),
          total_pages: Math.ceil(count / limit),
          total_records: count,
          per_page: parseInt(limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Approve doctor registration
// @route   PUT /api/doctors/approve/:id
// @access  Private (Admin only)
const approveDoctor = async (req, res, next) => {
  try {
    const doctorId = req.params.id;

    // Find doctor with tenant filtering
    const doctor = await Doctor.findOne({
      where: {
        id: doctorId,
        tenant_id: req.user.tenant_id,
        approval_status: 'Pending'
      },
      include: [{ model: User, attributes: { exclude: ['password_hash'] } }]
    });

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Pending doctor registration not found'
      });
    }

    // Update doctor approval status
    await doctor.update({
      approval_status: 'Approved',
      approved_by: req.user.id,
      approval_date: new Date(),
      verified: true
    });

    // Activate user account
    await doctor.User.update({
      status: 'Active'
    });

    // Fetch updated doctor with user info
    const approvedDoctor = await Doctor.findByPk(doctor.id, {
      include: [
        {
          model: User,
          attributes: { exclude: ['password_hash'] }
        }
      ]
    });

    res.status(200).json({
      success: true,
      message: 'Doctor registration approved successfully',
      data: { doctor: approvedDoctor }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reject doctor registration
// @route   PUT /api/doctors/reject/:id
// @access  Private (Admin only)
const rejectDoctor = async (req, res, next) => {
  try {
    const doctorId = req.params.id;
    const { rejection_reason } = req.body;

    // Find doctor with tenant filtering
    const doctor = await Doctor.findOne({
      where: {
        id: doctorId,
        tenant_id: req.user.tenant_id,
        approval_status: 'Pending'
      },
      include: [{ model: User, attributes: { exclude: ['password_hash'] } }]
    });

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Pending doctor registration not found'
      });
    }

    // Update doctor approval status
    await doctor.update({
      approval_status: 'Rejected',
      approved_by: req.user.id,
      approval_date: new Date(),
      rejection_reason: rejection_reason || 'No reason provided'
    });

    // Fetch updated doctor with user info
    const rejectedDoctor = await Doctor.findByPk(doctor.id, {
      include: [
        {
          model: User,
          attributes: { exclude: ['password_hash'] }
        }
      ]
    });

    res.status(200).json({
      success: true,
      message: 'Doctor registration rejected',
      data: { doctor: rejectedDoctor }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDoctors,
  getDoctor,
  createDoctor,
  updateDoctor,
  getDoctorAppointments,
  deleteDoctor,
  getPendingRegistrations,
  approveDoctor,
  rejectDoctor
};
