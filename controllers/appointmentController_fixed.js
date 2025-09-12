const { validationResult } = require('express-validator');
const { Appointment, Patient, Doctor, User } = require('../models');
const { Op } = require('sequelize');
const moment = require('moment');

// @desc    Get all appointments
// @route   GET /api/appointments
// @access  Private
const getAppointments = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      doctor_id,
      patient_id,
      date_from,
      date_to,
      consultation_type
    } = req.query;
    const offset = (page - 1) * limit;

    // Multi-tenancy: Filter by tenant_id
    const whereClause = {};
    if (req.user && req.user.tenant_id) {
      whereClause.tenant_id = req.user.tenant_id;
    }

    if (status) whereClause.status = status;
    if (doctor_id) whereClause.doctor_id = doctor_id;
    if (patient_id) whereClause.patient_id = patient_id;
    if (consultation_type) whereClause.consultation_type = consultation_type;

    if (date_from && date_to) {
      whereClause.appointment_date = {
        [Op.between]: [date_from, date_to]
      };
    } else if (date_from) {
      whereClause.appointment_date = {
        [Op.gte]: date_from
      };
    } else if (date_to) {
      whereClause.appointment_date = {
        [Op.lte]: date_to
      };
    }

    // Check user role and filter accordingly
    const userRoles = req.user.Roles?.map(role => role.name) || [];
    if (!userRoles.includes('Admin')) {
      // If user is a doctor, show only their appointments
      const doctor = await Doctor.findOne({
        where: {
          user_id: req.user.id,
          tenant_id: req.user.tenant_id // Add tenant filter
        }
      });
      if (doctor) {
        whereClause.doctor_id = doctor.id;
      } else {
        // If user is a patient, show only their appointments
        const patient = await Patient.findOne({
          where: {
            user_id: req.user.id,
            tenant_id: req.user.tenant_id // Add tenant filter
          }
        });
        if (patient) {
          whereClause.patient_id = patient.id;
        }
      }
    }

    const { count, rows: appointments } = await Appointment.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Patient,
          include: [{
            model: User,
            attributes: ['first_name', 'last_name', 'phone'],
            where: req.user && req.user.tenant_id ? { tenant_id: req.user.tenant_id } : {}
          }],
          where: req.user && req.user.tenant_id ? { tenant_id: req.user.tenant_id } : {}
        },
        {
          model: Doctor,
          include: [{
            model: User,
            attributes: ['first_name', 'last_name'],
            where: req.user && req.user.tenant_id ? { tenant_id: req.user.tenant_id } : {}
          }],
          where: req.user && req.user.tenant_id ? { tenant_id: req.user.tenant_id } : {}
        },
        {
          model: User,
          as: 'CreatedBy',
          attributes: ['first_name', 'last_name'],
          required: false,
          where: req.user && req.user.tenant_id ? { tenant_id: req.user.tenant_id } : {}
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

// @desc    Get single appointment
// @route   GET /api/appointments/:id
// @access  Private
const getAppointment = async (req, res, next) => {
  try {
    const whereClause = { id: req.params.id };

    // Multi-tenancy: Filter by tenant_id
    if (req.user && req.user.tenant_id) {
      whereClause.tenant_id = req.user.tenant_id;
    }

    const appointment = await Appointment.findOne({
      where: whereClause,
      include: [
        {
          model: Patient,
          include: [{
            model: User,
            attributes: { exclude: ['password_hash'] },
            where: req.user && req.user.tenant_id ? { tenant_id: req.user.tenant_id } : {}
          }],
          where: req.user && req.user.tenant_id ? { tenant_id: req.user.tenant_id } : {}
        },
        {
          model: Doctor,
          include: [{
            model: User,
            attributes: { exclude: ['password_hash'] },
            where: req.user && req.user.tenant_id ? { tenant_id: req.user.tenant_id } : {}
          }],
          where: req.user && req.user.tenant_id ? { tenant_id: req.user.tenant_id } : {}
        },
        {
          model: User,
          as: 'CreatedBy',
          attributes: ['first_name', 'last_name'],
          required: false,
          where: req.user && req.user.tenant_id ? { tenant_id: req.user.tenant_id } : {}
        },
        {
          model: User,
          as: 'CancelledBy',
          attributes: ['first_name', 'last_name'],
          required: false,
          where: req.user && req.user.tenant_id ? { tenant_id: req.user.tenant_id } : {}
        }
      ]
    });

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    // Check authorization
    const userRoles = req.user.Roles?.map(role => role.name) || [];
    if (!userRoles.includes('Admin')) {
      const doctor = await Doctor.findOne({
        where: {
          user_id: req.user.id,
          tenant_id: req.user.tenant_id
        }
      });
      const patient = await Patient.findOne({
        where: {
          user_id: req.user.id,
          tenant_id: req.user.tenant_id
        }
      });

      const hasAccess = (doctor && appointment.doctor_id === doctor.id) ||
                       (patient && appointment.patient_id === patient.id);

      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to view this appointment'
        });
      }
    }

    res.status(200).json({
      success: true,
      data: { appointment }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new appointment
// @route   POST /api/appointments
// @access  Private
const createAppointment = async (req, res, next) => {
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
      patient_id,
      doctor_id,
      appointment_date,
      appointment_time,
      duration_minutes = 30,
      appointment_type,
      consultation_type = 'In-Person',
      reason,
      notes,
      priority = 'Normal',
      location,
      meeting_link
    } = req.body;

    // Verify patient and doctor exist and belong to the same tenant
    const patient = await Patient.findOne({
      where: {
        id: patient_id,
        tenant_id: req.user.tenant_id
      }
    });

    const doctor = await Doctor.findOne({
      where: {
        id: doctor_id,
        tenant_id: req.user.tenant_id
      }
    });

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }

    // Check for conflicts
    const appointmentDateTime = moment(`${appointment_date} ${appointment_time}`);
    const appointmentEndTime = appointmentDateTime.clone().add(duration_minutes, 'minutes');

    const conflictingAppointments = await Appointment.findAll({
      where: {
        doctor_id,
        appointment_date,
        status: { [Op.in]: ['Scheduled', 'Confirmed', 'In_Progress'] },
        tenant_id: req.user.tenant_id, // Filter by tenant
        [Op.or]: [
          {
            appointment_time: {
              [Op.between]: [appointment_time, appointmentEndTime.format('HH:mm')]
            }
          },
          {
            [Op.and]: [
              { appointment_time: { [Op.lte]: appointment_time } },
              {
                [Op.literal]: `TIME(ADDTIME(appointment_time, CONCAT(duration_minutes, ':00'))) > '${appointment_time}'`
              }
            ]
          }
        ]
      }
    });

    if (conflictingAppointments.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Doctor is not available at the selected time'
      });
    }

    const appointment = await Appointment.create({
      patient_id,
      doctor_id,
      appointment_date,
      appointment_time,
      duration_minutes,
      appointment_type,
      consultation_type,
      reason,
      notes,
      priority,
      location,
      meeting_link,
      status: 'Scheduled',
      created_by: req.user.id,
      tenant_id: req.user.tenant_id // Set tenant_id
    });

    const newAppointment = await Appointment.findByPk(appointment.id, {
      include: [
        {
          model: Patient,
          include: [{ model: User, attributes: ['first_name', 'last_name', 'phone'] }]
        },
        {
          model: Doctor,
          include: [{ model: User, attributes: ['first_name', 'last_name'] }]
        },
        {
          model: User,
          as: 'CreatedBy',
          attributes: ['first_name', 'last_name']
        }
      ]
    });

    res.status(201).json({
      success: true,
      message: 'Appointment created successfully',
      data: { appointment: newAppointment }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update appointment
// @route   PUT /api/appointments/:id
// @access  Private
const updateAppointment = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const whereClause = {
      id: req.params.id,
      tenant_id: req.user.tenant_id // Filter by tenant
    };

    const appointment = await Appointment.findOne({ where: whereClause });

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    const {
      appointment_date,
      appointment_time,
      duration_minutes,
      appointment_type,
      consultation_type,
      reason,
      notes,
      status,
      priority,
      location,
      meeting_link
    } = req.body;

    await appointment.update({
      appointment_date: appointment_date || appointment.appointment_date,
      appointment_time: appointment_time || appointment.appointment_time,
      duration_minutes: duration_minutes || appointment.duration_minutes,
      appointment_type: appointment_type || appointment.appointment_type,
      consultation_type: consultation_type || appointment.consultation_type,
      reason: reason || appointment.reason,
      notes: notes || appointment.notes,
      status: status || appointment.status,
      priority: priority || appointment.priority,
      location: location || appointment.location,
      meeting_link: meeting_link || appointment.meeting_link,
      updated_by: req.user.id
    });

    const updatedAppointment = await Appointment.findByPk(appointment.id, {
      include: [
        {
          model: Patient,
          include: [{ model: User, attributes: ['first_name', 'last_name', 'phone'] }]
        },
        {
          model: Doctor,
          include: [{ model: User, attributes: ['first_name', 'last_name'] }]
        },
        {
          model: User,
          as: 'CreatedBy',
          attributes: ['first_name', 'last_name']
        }
      ]
    });

    res.status(200).json({
      success: true,
      message: 'Appointment updated successfully',
      data: { appointment: updatedAppointment }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Cancel appointment
// @route   PUT /api/appointments/:id/cancel
// @access  Private
const cancelAppointment = async (req, res, next) => {
  try {
    const whereClause = {
      id: req.params.id,
      tenant_id: req.user.tenant_id // Filter by tenant
    };

    const appointment = await Appointment.findOne({ where: whereClause });

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    const { cancellation_reason } = req.body;

    await appointment.update({
      status: 'Cancelled',
      cancellation_reason,
      cancelled_by: req.user.id,
      cancelled_at: new Date()
    });

    const cancelledAppointment = await Appointment.findByPk(appointment.id, {
      include: [
        {
          model: Patient,
          include: [{ model: User, attributes: ['first_name', 'last_name', 'phone'] }]
        },
        {
          model: Doctor,
          include: [{ model: User, attributes: ['first_name', 'last_name'] }]
        },
        {
          model: User,
          as: 'CancelledBy',
          attributes: ['first_name', 'last_name']
        }
      ]
    });

    res.status(200).json({
      success: true,
      message: 'Appointment cancelled successfully',
      data: { appointment: cancelledAppointment }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Complete appointment
// @route   PUT /api/appointments/:id/complete
// @access  Private (Doctor only)
const completeAppointment = async (req, res, next) => {
  try {
    const whereClause = {
      id: req.params.id,
      tenant_id: req.user.tenant_id // Filter by tenant
    };

    const appointment = await Appointment.findOne({ where: whereClause });

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    await appointment.update({
      status: 'Completed',
      completed_at: new Date()
    });

    const completedAppointment = await Appointment.findByPk(appointment.id, {
      include: [
        {
          model: Patient,
          include: [{ model: User, attributes: ['first_name', 'last_name', 'phone'] }]
        },
        {
          model: Doctor,
          include: [{ model: User, attributes: ['first_name', 'last_name'] }]
        }
      ]
    });

    res.status(200).json({
      success: true,
      message: 'Appointment completed successfully',
      data: { appointment: completedAppointment }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete appointment
// @route   DELETE /api/appointments/:id
// @access  Private (Admin only)
const deleteAppointment = async (req, res, next) => {
  try {
    const whereClause = {
      id: req.params.id,
      tenant_id: req.user.tenant_id // Filter by tenant
    };

    const appointment = await Appointment.findOne({ where: whereClause });

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    await appointment.destroy();

    res.status(200).json({
      success: true,
      message: 'Appointment deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAppointments,
  getAppointment,
  createAppointment,
  updateAppointment,
  cancelAppointment,
  completeAppointment,
  deleteAppointment
};
