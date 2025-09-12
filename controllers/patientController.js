const { validationResult } = require('express-validator');
const { Patient, User, Doctor, Appointment } = require('../models');
const { Op } = require('sequelize');
const { v4: uuidv4 } = require('uuid');

// @desc    Get all patients
// @route   GET /api/patients
// @access  Private (Doctor/Admin)
const getPatients = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      search,
      registered_by,
      doctor_id
    } = req.query;
    const offset = (page - 1) * limit;

    // Multi-tenancy: Filter by tenant_id
    const whereClause = {};
    if (req.user && req.user.tenant_id) {
      whereClause.tenant_id = req.user.tenant_id;
    }

    if (status) whereClause.status = status;
    if (registered_by) whereClause.registered_by = registered_by;
    if (doctor_id) whereClause.registered_by = doctor_id;

    const userWhereClause = {};
    if (search) {
      userWhereClause[Op.or] = [
        { first_name: { [Op.like]: `%${search}%` } },
        { last_name: { [Op.like]: `%${search}%` } },
        { '$Patient.patient_code$': { [Op.like]: `%${search}%` } }
      ];
    }

    // Add tenant filter to user include
    if (req.user && req.user.tenant_id) {
      userWhereClause.tenant_id = req.user.tenant_id;
    }

    const { count, rows: patients } = await Patient.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          where: Object.keys(userWhereClause).length ? userWhereClause : (req.user && req.user.tenant_id ? { tenant_id: req.user.tenant_id } : undefined),
          required: false,
          attributes: { exclude: ['password_hash'] }
        }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['created_at', 'DESC']]
    });

    res.status(200).json({
      success: true,
      data: {
        patients,
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

// @desc    Get single patient
// @route   GET /api/patients/:id
// @access  Private (Doctor/Admin)
const getPatient = async (req, res, next) => {
  try {
    const whereClause = { id: req.params.id };

    // Multi-tenancy: Filter by tenant_id
    if (req.user && req.user.tenant_id) {
      whereClause.tenant_id = req.user.tenant_id;
    }

    const userWhereClause = {};
    if (req.user && req.user.tenant_id) {
      userWhereClause.tenant_id = req.user.tenant_id;
    }

    const patient = await Patient.findOne({
      where: whereClause,
      include: [
        {
          model: User,
          where: Object.keys(userWhereClause).length ? userWhereClause : undefined,
          attributes: { exclude: ['password_hash'] }
        }
      ]
    });

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    res.status(200).json({
      success: true,
      data: { patient }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new patient
// @route   POST /api/patients
// @access  Private (Doctor/Admin)
const createPatient = async (req, res, next) => {
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
      blood_type,
      height,
      weight,
      allergies,
      current_medications,
      insurance_provider,
      insurance_policy_number,
      emergency_contact_name,
      emergency_contact_relation,
      emergency_contact_phone,
      address,
      city,
      state,
      postal_code,
      country
    } = req.body;

    // Generate unique patient code
    const patient_code = `PAT-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

    // Check if user_id is provided and valid
    if (user_id) {
      const user = await User.findByPk(user_id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      const existingPatient = await Patient.findOne({ where: { user_id } });
      if (existingPatient) {
        return res.status(400).json({
          success: false,
          message: 'Patient profile already exists for this user'
        });
      }
    }

    // Get the doctor who is registering the patient
    const doctor = await Doctor.findOne({ where: { user_id: req.user.id } });
    const registered_by = doctor ? doctor.id : null;

    const patient = await Patient.create({
      user_id,
      patient_code,
      blood_type,
      height,
      weight,
      allergies,
      current_medications,
      insurance_provider,
      insurance_policy_number,
      emergency_contact_name,
      emergency_contact_relation,
      emergency_contact_phone,
      address,
      city,
      state,
      postal_code,
      country,
      registered_by,
      tenant_id: req.user.tenant_id // Set tenant_id from the authenticated user
    });

    const newPatient = await Patient.findByPk(patient.id, {
      include: [
        {
          model: User,
          attributes: { exclude: ['password_hash'] }
        },
        {
          model: Doctor,
          as: 'RegisteredBy',
          include: [{ model: User, attributes: ['first_name', 'last_name'] }]
        }
      ]
    });

    res.status(201).json({
      success: true,
      message: 'Patient created successfully',
      data: { patient: newPatient }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update patient
// @route   PUT /api/patients/:id
// @access  Private (Doctor/Admin)
const updatePatient = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const patient = await Patient.findByPk(req.params.id);
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    const {
      blood_type,
      height,
      weight,
      allergies,
      current_medications,
      insurance_provider,
      insurance_policy_number,
      emergency_contact_name,
      emergency_contact_relation,
      emergency_contact_phone,
      address,
      city,
      state,
      postal_code,
      country,
      status
    } = req.body;

    await patient.update({
      blood_type: blood_type || patient.blood_type,
      height: height || patient.height,
      weight: weight || patient.weight,
      allergies: allergies || patient.allergies,
      current_medications: current_medications || patient.current_medications,
      insurance_provider: insurance_provider || patient.insurance_provider,
      insurance_policy_number: insurance_policy_number || patient.insurance_policy_number,
      emergency_contact_name: emergency_contact_name || patient.emergency_contact_name,
      emergency_contact_relation: emergency_contact_relation || patient.emergency_contact_relation,
      emergency_contact_phone: emergency_contact_phone || patient.emergency_contact_phone,
      address: address || patient.address,
      city: city || patient.city,
      state: state || patient.state,
      postal_code: postal_code || patient.postal_code,
      country: country || patient.country,
      status: status || patient.status
    });

    const updatedPatient = await Patient.findByPk(patient.id, {
      include: [
        {
          model: User,
          attributes: { exclude: ['password_hash'] }
        },
        {
          model: Doctor,
          as: 'RegisteredBy',
          include: [{ model: User, attributes: ['first_name', 'last_name'] }]
        }
      ]
    });

    res.status(200).json({
      success: true,
      message: 'Patient updated successfully',
      data: { patient: updatedPatient }
    });
  } catch (error) {
    next(error);
  }
};

// @access  Private (Doctor/Admin)

// @desc    Delete patient
// @route   DELETE /api/patients/:id
// @access  Private (Admin only)
const deletePatient = async (req, res, next) => {
  try {
    const patient = await Patient.findByPk(req.params.id);
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    await patient.destroy();

    res.status(200).json({
      success: true,
      message: 'Patient deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPatients,
  getPatient,
  createPatient,
  updatePatient,
  deletePatient
};
