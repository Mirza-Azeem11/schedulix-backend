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

    const whereClause = {};
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
    const doctor = await Doctor.findByPk(req.params.id, {
      include: [{
        model: User,
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
      availability_status
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
      availability_status: availability_status || doctor.availability_status
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

module.exports = {
  getDoctors,
  getDoctor,
  createDoctor,
  updateDoctor,
  getDoctorAppointments,
  deleteDoctor
};
