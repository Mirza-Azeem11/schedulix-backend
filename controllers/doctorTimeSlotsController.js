const { DoctorTimeSlot, Doctor, Appointment } = require('../models');
const { Op } = require('sequelize');
const asyncHandler = require('express-async-handler');

// @desc    Get all time slots with filtering
// @route   GET /api/doctor-time-slots
// @access  Private
const getAllTimeSlots = asyncHandler(async (req, res) => {
  try {
    const { doctor_id, day_of_week, date } = req.query;
    const userRole = req.user.role;

    let whereClause = {};

    // If user is a doctor, they can only access their own time slots
    if (userRole === 'Doctor') {
      whereClause.doctor_id = req.user.doctor_id || req.user.id;
    } else if (doctor_id) {
      whereClause.doctor_id = doctor_id;
    }

    if (day_of_week) {
      whereClause.day_of_week = day_of_week;
    }

    if (date) {
      whereClause[Op.or] = [
        { specific_date: date },
        { is_recurring: true, specific_date: null }
      ];
    }

    const timeSlots = await DoctorTimeSlot.findAll({
      where: whereClause,
      include: [{
        model: Doctor,
        attributes: ['id', 'specialization', 'consultation_fee']
      }],
      order: [['day_of_week', 'ASC'], ['start_time', 'ASC']]
    });

    res.status(200).json({
      success: true,
      count: timeSlots.length,
      data: timeSlots
    });
  } catch (error) {
    console.error('Get time slots error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch time slots'
    });
  }
});

// @desc    Get available time slots for booking
// @route   GET /api/doctor-time-slots/available
// @access  Public
const getAvailableTimeSlots = asyncHandler(async (req, res) => {
  try {
    const { doctor_id, date } = req.query;

    if (!doctor_id || !date) {
      return res.status(400).json({
        success: false,
        message: 'Doctor ID and date are required'
      });
    }

    const requestedDate = new Date(date);
    const dayOfWeek = requestedDate.toLocaleDateString('en-US', { weekday: 'long' });

    // Get doctor's time slots for the requested day
    const timeSlots = await DoctorTimeSlot.findAll({
      where: {
        doctor_id: doctor_id,
        day_of_week: dayOfWeek,
        is_available: true,
        [Op.or]: [
          { specific_date: date },
          { is_recurring: true, specific_date: null }
        ]
      },
      order: [['start_time', 'ASC']]
    });

    // Get existing appointments for the date
    const existingAppointments = await Appointment.findAll({
      where: {
        doctor_id: doctor_id,
        appointment_date: date,
        status: {
          [Op.not]: 'Cancelled'
        }
      },
      attributes: ['appointment_time', 'duration_minutes']
    });

    // Generate available slots
    const availableSlots = [];

    for (const slot of timeSlots) {
      const slots = generateTimeSlots(slot, existingAppointments, date);
      availableSlots.push(...slots);
    }

    res.status(200).json({
      success: true,
      date: date,
      dayOfWeek: dayOfWeek,
      count: availableSlots.length,
      data: availableSlots
    });
  } catch (error) {
    console.error('Get available slots error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch available time slots'
    });
  }
});

// @desc    Create new time slot
// @route   POST /api/doctor-time-slots
// @access  Private (Doctor/Admin)
const createTimeSlot = asyncHandler(async (req, res) => {
  try {
    const {
      doctor_id,
      day_of_week,
      start_time,
      end_time,
      slot_duration = 30,
      max_appointments = 1,
      break_start_time,
      break_end_time,
      is_recurring = true,
      specific_date,
      notes
    } = req.body;

    const userRole = req.user.role;
    let targetDoctorId = doctor_id;

    // If user is a doctor, they can only create slots for themselves
    if (userRole === 'Doctor') {
      targetDoctorId = req.user.doctor_id || req.user.id;
    }

    // Validate required fields
    if (!targetDoctorId || !day_of_week || !start_time || !end_time) {
      return res.status(400).json({
        success: false,
        message: 'Doctor ID, day of week, start time, and end time are required'
      });
    }

    // Check for overlapping time slots
    const overlappingSlot = await DoctorTimeSlot.findOne({
      where: {
        doctor_id: targetDoctorId,
        day_of_week: day_of_week,
        [Op.or]: [
          {
            start_time: {
              [Op.between]: [start_time, end_time]
            }
          },
          {
            end_time: {
              [Op.between]: [start_time, end_time]
            }
          },
          {
            [Op.and]: [
              { start_time: { [Op.lte]: start_time } },
              { end_time: { [Op.gte]: end_time } }
            ]
          }
        ]
      }
    });

    if (overlappingSlot) {
      return res.status(400).json({
        success: false,
        message: 'Time slot overlaps with existing slot'
      });
    }

    const timeSlot = await DoctorTimeSlot.create({
      doctor_id: targetDoctorId,
      day_of_week,
      start_time,
      end_time,
      slot_duration,
      max_appointments,
      break_start_time,
      break_end_time,
      is_recurring,
      specific_date,
      notes
    });

    res.status(201).json({
      success: true,
      data: timeSlot
    });
  } catch (error) {
    console.error('Create time slot error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create time slot'
    });
  }
});

// @desc    Update time slot
// @route   PUT /api/doctor-time-slots/:id
// @access  Private (Doctor/Admin)
const updateTimeSlot = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const userRole = req.user.role;

    const timeSlot = await DoctorTimeSlot.findByPk(id);

    if (!timeSlot) {
      return res.status(404).json({
        success: false,
        message: 'Time slot not found'
      });
    }

    // Check if doctor can modify this time slot
    if (userRole === 'Doctor') {
      const doctorId = req.user.doctor_id || req.user.id;
      if (timeSlot.doctor_id !== doctorId) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to modify this time slot'
        });
      }
    }

    const updatedTimeSlot = await timeSlot.update(req.body);

    res.status(200).json({
      success: true,
      data: updatedTimeSlot
    });
  } catch (error) {
    console.error('Update time slot error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update time slot'
    });
  }
});

// @desc    Delete time slot
// @route   DELETE /api/doctor-time-slots/:id
// @access  Private (Doctor/Admin)
const deleteTimeSlot = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const userRole = req.user.role;

    const timeSlot = await DoctorTimeSlot.findByPk(id);

    if (!timeSlot) {
      return res.status(404).json({
        success: false,
        message: 'Time slot not found'
      });
    }

    // Check if doctor can delete this time slot
    if (userRole === 'Doctor') {
      const doctorId = req.user.doctor_id || req.user.id;
      if (timeSlot.doctor_id !== doctorId) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to delete this time slot'
        });
      }
    }

    await timeSlot.destroy();

    res.status(200).json({
      success: true,
      message: 'Time slot deleted successfully'
    });
  } catch (error) {
    console.error('Delete time slot error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete time slot'
    });
  }
});

// @desc    Bulk create time slots
// @route   POST /api/doctor-time-slots/bulk
// @access  Private (Doctor/Admin)
const bulkCreateTimeSlots = asyncHandler(async (req, res) => {
  try {
    const { doctor_id, schedule } = req.body;
    const userRole = req.user.role;

    let targetDoctorId = doctor_id;
    if (userRole === 'Doctor') {
      targetDoctorId = req.user.doctor_id || req.user.id;
    }

    if (!targetDoctorId || !schedule || !Array.isArray(schedule)) {
      return res.status(400).json({
        success: false,
        message: 'Doctor ID and schedule array are required'
      });
    }

    const timeSlots = [];
    for (const slot of schedule) {
      const timeSlot = await DoctorTimeSlot.create({
        doctor_id: targetDoctorId,
        ...slot
      });
      timeSlots.push(timeSlot);
    }

    res.status(201).json({
      success: true,
      count: timeSlots.length,
      data: timeSlots
    });
  } catch (error) {
    console.error('Bulk create time slots error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create time slots'
    });
  }
});

// Helper function to generate time slots
const generateTimeSlots = (slotConfig, existingAppointments, date) => {
  const slots = [];
  const start = new Date(`${date}T${slotConfig.start_time}`);
  const end = new Date(`${date}T${slotConfig.end_time}`);
  const breakStart = slotConfig.break_start_time ? new Date(`${date}T${slotConfig.break_start_time}`) : null;
  const breakEnd = slotConfig.break_end_time ? new Date(`${date}T${slotConfig.break_end_time}`) : null;

  let current = new Date(start);

  while (current < end) {
    const slotEnd = new Date(current.getTime() + slotConfig.slot_duration * 60000);

    // Skip if slot is during break time
    if (breakStart && breakEnd &&
        current >= breakStart && current < breakEnd) {
      current = new Date(breakEnd);
      continue;
    }

    // Check if slot is available (not booked)
    const isBooked = existingAppointments.some(apt => {
      const aptTime = new Date(`${date}T${apt.appointment_time}`);
      const aptEnd = new Date(aptTime.getTime() + (apt.duration_minutes || 30) * 60000);
      return (current >= aptTime && current < aptEnd) ||
             (slotEnd > aptTime && slotEnd <= aptEnd);
    });

    if (!isBooked && slotEnd <= end) {
      slots.push({
        time: current.toTimeString().slice(0, 5),
        datetime: current.toISOString(),
        duration: slotConfig.slot_duration,
        available: true
      });
    }

    current = slotEnd;
  }

  return slots;
};

module.exports = {
  getAllTimeSlots,
  getAvailableTimeSlots,
  createTimeSlot,
  updateTimeSlot,
  deleteTimeSlot,
  bulkCreateTimeSlots
};
