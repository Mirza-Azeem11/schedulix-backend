const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser
} = require('../controllers/userController');

// Validation rules
const createUserValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('first_name').notEmpty().trim().withMessage('First name is required'),
  body('last_name').notEmpty().trim().withMessage('Last name is required'),
  body('phone').optional().isMobilePhone().withMessage('Please provide a valid phone number'),
  body('date_of_birth').optional().isISO8601().withMessage('Please provide a valid date'),
  body('gender').optional().isIn(['Male', 'Female', 'Other']).withMessage('Invalid gender'),
  body('roles').optional().isArray().withMessage('Roles must be an array')
];

const updateUserValidation = [
  body('first_name').optional().notEmpty().trim().withMessage('First name cannot be empty'),
  body('last_name').optional().notEmpty().trim().withMessage('Last name cannot be empty'),
  body('phone').optional().isMobilePhone().withMessage('Please provide a valid phone number'),
  body('date_of_birth').optional().isISO8601().withMessage('Please provide a valid date'),
  body('gender').optional().isIn(['Male', 'Female', 'Other']).withMessage('Invalid gender'),
  body('status').optional().isIn(['Active', 'Inactive', 'Suspended']).withMessage('Invalid status'),
  body('roles').optional().isArray().withMessage('Roles must be an array')
];

// Routes
router.get('/', protect, authorize('Admin'), getUsers);
router.get('/:id', protect, getUser);
router.post('/', protect, authorize('Admin'), createUserValidation, createUser);
router.put('/:id', protect, authorize('Admin'), updateUserValidation, updateUser);
router.delete('/:id', protect, authorize('Admin'), deleteUser);

module.exports = router;
