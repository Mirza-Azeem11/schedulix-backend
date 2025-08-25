const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const { protect } = require('../middleware/errorMiddleware');
const {
  register,
  login,
  getMe,
  updateProfile,
  changePassword
} = require('../controllers/authController');

// Validation rules
const registerValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('first_name').notEmpty().trim().withMessage('First name is required'),
  body('last_name').notEmpty().trim().withMessage('Last name is required'),
  body('phone').optional().matches(/^[\+]?[1-9][\d]{0,15}$/).withMessage('Please provide a valid phone number'),
  body('date_of_birth').optional().isISO8601().withMessage('Please provide a valid date'),
  body('gender').optional().isIn(['Male', 'Female', 'Other']).withMessage('Invalid gender'),
  body('role').optional().isIn(['Patient', 'Doctor']).withMessage('Invalid role'),

  // Doctor-specific validations
  body('license_number').if(body('role').equals('Doctor')).notEmpty().withMessage('License number is required for doctors'),
  body('specialization').if(body('role').equals('Doctor')).notEmpty().withMessage('Specialization is required for doctors'),
  body('qualification').optional(),
  body('experience_years').optional().isInt({ min: 0 }).withMessage('Experience years must be a positive integer'),
  body('consultation_fee').optional().isFloat({ min: 0 }).withMessage('Consultation fee must be a positive number'),
  body('bio').optional(),
  body('office_address').optional(),
  body('consultation_hours').optional(),
  body('languages_spoken').optional(),

  // Patient-specific validations
  body('patient_code').if(body('role').equals('Patient')).notEmpty().withMessage('Patient code is required for patients'),
  body('blood_type').optional().isIn(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']).withMessage('Invalid blood type'),
  body('height').optional().isFloat({ min: 0 }).withMessage('Height must be a positive number'),
  body('weight').optional().isFloat({ min: 0 }).withMessage('Weight must be a positive number'),
  body('allergies').optional(),
  body('current_medications').optional(),
  body('insurance_provider').optional(),
  body('insurance_policy_number').optional()
];

const loginValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('password').notEmpty().withMessage('Password is required')
];

const updateProfileValidation = [
  body('first_name').optional().notEmpty().trim().withMessage('First name cannot be empty'),
  body('last_name').optional().notEmpty().trim().withMessage('Last name cannot be empty'),
  body('phone').optional().matches(/^[\+]?[1-9][\d]{0,15}$/).withMessage('Please provide a valid phone number'),
  body('date_of_birth').optional().isISO8601().withMessage('Please provide a valid date'),
  body('gender').optional().isIn(['Male', 'Female', 'Other']).withMessage('Invalid gender'),
  body('avatar_url').optional().isURL().withMessage('Please provide a valid URL')
];

const changePasswordValidation = [
  body('current_password').notEmpty().withMessage('Current password is required'),
  body('new_password').isLength({ min: 6 }).withMessage('New password must be at least 6 characters')
];

// Routes
router.post('/register', registerValidation, register);
router.post('/login', loginValidation, login);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfileValidation, updateProfile);
router.put('/change-password', protect, changePasswordValidation, changePassword);

module.exports = router;
