const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const {
  getAppointments,
  getAppointment,
  createAppointment,
  updateAppointment,
  cancelAppointment,
  completeAppointment,
  deleteAppointment
} = require('../controllers/appointmentController');

// Validation rules
const createAppointmentValidation = [
  body('patient_id').isInt().withMessage('Patient ID must be an integer'),
  body('doctor_id').isInt().withMessage('Doctor ID must be an integer'),
  body('appointment_date').isISO8601().withMessage('Please provide a valid appointment date'),
  body('appointment_time').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Please provide a valid appointment time (HH:MM format)'),
  body('duration_minutes').optional().isInt({ min: 15, max: 180 }).withMessage('Duration must be between 15 and 180 minutes'),
  body('appointment_type').notEmpty().trim().withMessage('Appointment type is required'),
  body('consultation_type').optional().isIn(['In-Person', 'Online']).withMessage('Invalid consultation type'),
  body('reason').optional().trim(),
  body('notes').optional().trim(),
  body('priority').optional().isIn(['Low', 'Normal', 'High', 'Urgent']).withMessage('Invalid priority'),
  body('location').optional().trim(),
  body('meeting_link').optional().isURL().withMessage('Meeting link must be a valid URL')
];

const updateAppointmentValidation = [
  body('appointment_date').optional().isISO8601().withMessage('Please provide a valid appointment date'),
  body('appointment_time').optional().matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Please provide a valid appointment time (HH:MM format)'),
  body('duration_minutes').optional().isInt({ min: 15, max: 180 }).withMessage('Duration must be between 15 and 180 minutes'),
  body('appointment_type').optional().notEmpty().trim().withMessage('Appointment type cannot be empty'),
  body('consultation_type').optional().isIn(['In-Person', 'Online']).withMessage('Invalid consultation type'),
  body('reason').optional().trim(),
  body('notes').optional().trim(),
  body('status').optional().isIn(['Scheduled', 'Confirmed', 'In_Progress', 'Completed', 'Cancelled', 'No_Show']).withMessage('Invalid status'),
  body('priority').optional().isIn(['Low', 'Normal', 'High', 'Urgent']).withMessage('Invalid priority'),
  body('location').optional().trim(),
  body('meeting_link').optional().isURL().withMessage('Meeting link must be a valid URL')
];

const cancelAppointmentValidation = [
  body('cancellation_reason').optional().trim()
];

// Routes
router.get('/', protect, getAppointments);
router.get('/:id', protect, getAppointment);
router.post('/', protect, createAppointmentValidation, createAppointment);
router.put('/:id', protect, updateAppointmentValidation, updateAppointment);
router.put('/:id/cancel', protect, cancelAppointmentValidation, cancelAppointment);
router.put('/:id/complete', protect, authorize('Doctor'), completeAppointment);
router.delete('/:id', protect, authorize('Admin'), deleteAppointment);

module.exports = router;
