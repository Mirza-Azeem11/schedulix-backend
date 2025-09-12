const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const {
  getPatients,
  getPatient,
  createPatient,
  updatePatient,
  deletePatient
} = require('../controllers/patientController');

// Validation rules
const createPatientValidation = [
  body('user_id').optional().isInt().withMessage('User ID must be an integer'),
  body('blood_type').optional().isIn(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']).withMessage('Invalid blood type'),
  body('height').optional().isDecimal().withMessage('Height must be a valid number'),
  body('weight').optional().isDecimal().withMessage('Weight must be a valid number'),
  body('allergies').optional().custom((value) => {
    if (typeof value === 'string') {
      try {
        JSON.parse(value);
        return true;
      } catch {
        throw new Error('Allergies must be valid JSON');
      }
    } else if (Array.isArray(value) || typeof value === 'object') {
      return true;
    }
    throw new Error('Allergies must be valid JSON');
  }),
  body('current_medications').optional().custom((value) => {
    if (typeof value === 'string') {
      try {
        JSON.parse(value);
        return true;
      } catch {
        throw new Error('Current medications must be valid JSON');
      }
    } else if (Array.isArray(value) || typeof value === 'object') {
      return true;
    }
    throw new Error('Current medications must be valid JSON');
  }),
  body('insurance_provider').optional().trim(),
  body('insurance_policy_number').optional().trim(),
  body('emergency_contact_name').optional().trim(),
  body('emergency_contact_relation').optional().trim(),
  body('emergency_contact_phone').optional().matches(/^[\+]?[1-9][\d]{0,15}$/).withMessage('Invalid emergency contact phone format'),
  body('address').optional().trim(),
  body('city').optional().trim(),
  body('state').optional().trim(),
  body('postal_code').optional().trim(),
  body('country').optional().trim()
];

const updatePatientValidation = [
  body('blood_type').optional().isIn(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']).withMessage('Invalid blood type'),
  body('height').optional().isDecimal().withMessage('Height must be a valid number'),
  body('weight').optional().isDecimal().withMessage('Weight must be a valid number'),
  body('allergies').optional().custom((value) => {
    if (typeof value === 'string') {
      try {
        JSON.parse(value);
        return true;
      } catch {
        throw new Error('Allergies must be valid JSON');
      }
    } else if (Array.isArray(value) || typeof value === 'object') {
      return true;
    }
    throw new Error('Allergies must be valid JSON');
  }),
  body('current_medications').optional().custom((value) => {
    if (typeof value === 'string') {
      try {
        JSON.parse(value);
        return true;
      } catch {
        throw new Error('Current medications must be valid JSON');
      }
    } else if (Array.isArray(value) || typeof value === 'object') {
      return true;
    }
    throw new Error('Current medications must be valid JSON');
  }),
  body('insurance_provider').optional().trim(),
  body('insurance_policy_number').optional().trim(),
  body('emergency_contact_name').optional().trim(),
  body('emergency_contact_relation').optional().trim(),
  body('emergency_contact_phone').optional().matches(/^[\+]?[1-9][\d]{0,15}$/).withMessage('Invalid emergency contact phone format'),
  body('address').optional().trim(),
  body('city').optional().trim(),
  body('state').optional().trim(),
  body('postal_code').optional().trim(),
  body('country').optional().trim(),
  body('status').optional().isIn(['Active', 'Inactive', 'Critical']).withMessage('Invalid status')
];

// Routes
router.get('/', protect, authorize('Doctor', 'Admin'), getPatients);
router.get('/:id', protect, authorize('Doctor', 'Admin'), getPatient);
router.post('/', protect, authorize('Doctor', 'Admin'), createPatientValidation, createPatient);
router.put('/:id', protect, authorize('Doctor', 'Admin'), updatePatientValidation, updatePatient);
router.delete('/:id', protect, authorize('Admin'), deletePatient);

module.exports = router;
