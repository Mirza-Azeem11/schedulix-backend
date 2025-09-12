const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const {
  registerCompany,
  getCompanyBySlug,
  checkSlugAvailability
} = require('../controllers/companyController');

// Validation rules for company registration
const registerCompanyValidation = [
  // Company/Tenant validation
  body('company_name')
    .notEmpty()
    .withMessage('Company name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Company name must be between 2 and 100 characters'),

  body('company_slug')
    .notEmpty()
    .withMessage('Company slug is required')
    .isLength({ min: 3, max: 50 })
    .withMessage('Company slug must be between 3 and 50 characters')
    .matches(/^[a-z0-9-]+$/)
    .withMessage('Company slug can only contain lowercase letters, numbers, and hyphens'),

  // body('domain')
  //   .optional()
  //   .isURL()
  //   .withMessage('Domain must be a valid URL'),

  body('plan_type')
    .optional()
    .isIn(['Basic', 'Premium', 'Enterprise'])
    .withMessage('Plan type must be Basic, Premium, or Enterprise'),

  body('max_users')
    .optional()
    .isInt({ min: 1, max: 10000 })
    .withMessage('Max users must be between 1 and 10000'),

  // Admin user validation
  body('admin_email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid admin email is required'),

  body('admin_first_name')
    .notEmpty()
    .withMessage('Admin first name is required')
    .isLength({ min: 1, max: 50 })
    .withMessage('Admin first name must be between 1 and 50 characters'),

  body('admin_last_name')
    .notEmpty()
    .withMessage('Admin last name is required')
    .isLength({ min: 1, max: 50 })
    .withMessage('Admin last name must be between 1 and 50 characters'),

  body('admin_phone')
    .optional()
    .isMobilePhone()
    .withMessage('Valid phone number is required'),

  // Company details validation
  body('address')
    .optional()
    .isLength({ max: 255 })
    .withMessage('Address must be less than 255 characters'),

  body('city')
    .optional()
    .isLength({ max: 100 })
    .withMessage('City must be less than 100 characters'),

  body('state')
    .optional()
    .isLength({ max: 100 })
    .withMessage('State must be less than 100 characters'),

  body('country')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Country must be less than 100 characters'),

  body('postal_code')
    .optional()
    .isLength({ max: 20 })
    .withMessage('Postal code must be less than 20 characters'),

  body('website')
    .optional()
    .isURL()
    .withMessage('Website must be a valid URL')
];

// Routes
router.post('/register', registerCompanyValidation, registerCompany);
router.get('/check-slug/:slug', checkSlugAvailability);
router.get('/:slug', getCompanyBySlug);

module.exports = router;
