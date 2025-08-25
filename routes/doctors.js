const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const { protect, authorize } = require('../middleware/errorMiddleware');
const {
  getDoctors,
  getDoctor,
  createDoctor,
  updateDoctor,
  getDoctorAppointments,
  deleteDoctor
} = require('../controllers/doctorController');

// Validation rules
const createDoctorValidation = [
  body('user_id').isInt().withMessage('User ID must be an integer'),
  body('license_number').notEmpty().trim().withMessage('License number is required'),
  body('specialization').notEmpty().trim().withMessage('Specialization is required'),
  body('qualification').optional().trim(),
  body('experience_years').optional().isInt({ min: 0 }).withMessage('Experience years must be a positive integer'),
  body('consultation_fee').optional().isDecimal({ decimal_digits: '0,2' }).withMessage('Invalid consultation fee'),
  body('bio').optional().trim(),
  body('office_address').optional().trim(),
  body('consultation_hours').optional().isJSON().withMessage('Consultation hours must be valid JSON'),
  body('languages_spoken').optional().isJSON().withMessage('Languages spoken must be valid JSON')
];

const updateDoctorValidation = [
  body('specialization').optional().notEmpty().trim().withMessage('Specialization cannot be empty'),
  body('qualification').optional().trim(),
  body('experience_years').optional().isInt({ min: 0 }).withMessage('Experience years must be a positive integer'),
  body('consultation_fee').optional().isDecimal({ decimal_digits: '0,2' }).withMessage('Invalid consultation fee'),
  body('bio').optional().trim(),
  body('office_address').optional().trim(),
  body('consultation_hours').optional().isJSON().withMessage('Consultation hours must be valid JSON'),
  body('languages_spoken').optional().isJSON().withMessage('Languages spoken must be valid JSON'),
  body('availability_status').optional().isIn(['Available', 'Busy', 'Offline']).withMessage('Invalid availability status')
];

// Routes
router.get('/', getDoctors);
router.get('/:id', getDoctor);
router.get('/:id/appointments', protect, getDoctorAppointments);
router.post('/', protect, authorize('Admin'), createDoctorValidation, createDoctor);
router.put('/:id', protect, updateDoctorValidation, updateDoctor);
router.delete('/:id', protect, authorize('Admin'), deleteDoctor);

module.exports = router;
