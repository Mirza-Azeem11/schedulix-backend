const express = require('express');
const router = express.Router();

// Import route modules
const authRoutes = require('./auth');
const userRoutes = require('./users');
const doctorRoutes = require('./doctors');
const patientRoutes = require('./patients');
const appointmentRoutes = require('./appointments');
const roleRoutes = require('./roles');
const userRoleRoutes = require('./userRoles');
const doctorTimeSlotRoutes = require('./doctorTimeSlots');
const invoiceRoutes = require('./invoices');
const invoiceItemRoutes = require('./invoiceItems');
const paymentRoutes = require('./payments');
const systemSettingRoutes = require('./systemSettings');
const notificationRoutes = require('./notifications');
const appointmentReminderRoutes = require('./appointmentReminders');
const analyticsRoutes = require('./analytics'); // Add analytics routes
const seederRoutes = require('./seeder');
const companyRoutes = require('./company');

// Health check route
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API is healthy',
    timestamp: new Date().toISOString()
  });
});

// Route definitions
router.use('/auth', authRoutes);
router.use('/company', companyRoutes);
router.use('/users', userRoutes);
router.use('/doctors', doctorRoutes);
router.use('/patients', patientRoutes);
router.use('/appointments', appointmentRoutes);
router.use('/roles', roleRoutes);
router.use('/user-roles', userRoleRoutes);
router.use('/doctor-time-slots', doctorTimeSlotRoutes);
router.use('/invoices', invoiceRoutes);
router.use('/invoice-items', invoiceItemRoutes);
router.use('/payments', paymentRoutes);
router.use('/system-settings', systemSettingRoutes);
router.use('/notifications', notificationRoutes);
router.use('/appointment-reminders', appointmentReminderRoutes);
router.use('/analytics', analyticsRoutes); // Add analytics route
router.use('/seeder', seederRoutes);

// API documentation endpoint
router.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Schedulix Healthcare Management API',
    version: '1.0.0',
    endpoints: {
      auth: {
        register: 'POST /api/auth/register',
        login: 'POST /api/auth/login',
        profile: 'GET /api/auth/me',
        updateProfile: 'PUT /api/auth/profile',
        changePassword: 'PUT /api/auth/change-password'
      },
      users: {
        getAll: 'GET /api/users',
        getById: 'GET /api/users/:id',
        create: 'POST /api/users',
        update: 'PUT /api/users/:id',
        delete: 'DELETE /api/users/:id'
      },
      doctors: {
        getAll: 'GET /api/doctors',
        getById: 'GET /api/doctors/:id',
        getAppointments: 'GET /api/doctors/:id/appointments',
        create: 'POST /api/doctors',
        update: 'PUT /api/doctors/:id',
        delete: 'DELETE /api/doctors/:id'
      },
      patients: {
        getAll: 'GET /api/patients',
        getById: 'GET /api/patients/:id',
        create: 'POST /api/patients',
        update: 'PUT /api/patients/:id',
        delete: 'DELETE /api/patients/:id'
      },
      appointments: {
        getAll: 'GET /api/appointments',
        getById: 'GET /api/appointments/:id',
        create: 'POST /api/appointments',
        update: 'PUT /api/appointments/:id',
        cancel: 'PUT /api/appointments/:id/cancel',
        complete: 'PUT /api/appointments/:id/complete',
        delete: 'DELETE /api/appointments/:id'
      },
      roles: {
        getAll: 'GET /api/roles',
        getById: 'GET /api/roles/:id',
        create: 'POST /api/roles',
        update: 'PUT /api/roles/:id',
        delete: 'DELETE /api/roles/:id'
      },
      'user-roles': {
        getAll: 'GET /api/user-roles',
        getById: 'GET /api/user-roles/:id',
        create: 'POST /api/user-roles',
        update: 'PUT /api/user-roles/:id',
        delete: 'DELETE /api/user-roles/:id'
      },
      'doctor-time-slots': {
        getAll: 'GET /api/doctor-time-slots',
        getById: 'GET /api/doctor-time-slots/:id',
        create: 'POST /api/doctor-time-slots',
        update: 'PUT /api/doctor-time-slots/:id',
        delete: 'DELETE /api/doctor-time-slots/:id'
      },
      invoices: {
        getAll: 'GET /api/invoices',
        getById: 'GET /api/invoices/:id',
        create: 'POST /api/invoices',
        update: 'PUT /api/invoices/:id',
        delete: 'DELETE /api/invoices/:id'
      },
      'invoice-items': {
        getAll: 'GET /api/invoice-items',
        getById: 'GET /api/invoice-items/:id',
        create: 'POST /api/invoice-items',
        update: 'PUT /api/invoice-items/:id',
        delete: 'DELETE /api/invoice-items/:id'
      },
      payments: {
        getAll: 'GET /api/payments',
        getById: 'GET /api/payments/:id',
        create: 'POST /api/payments',
        update: 'PUT /api/payments/:id',
        delete: 'DELETE /api/payments/:id'
      },
      'system-settings': {
        getAll: 'GET /api/system-settings',
        getById: 'GET /api/system-settings/:id',
        update: 'PUT /api/system-settings/:id'
      },
      notifications: {
        getAll: 'GET /api/notifications',
        getById: 'GET /api/notifications/:id',
        create: 'POST /api/notifications',
        update: 'PUT /api/notifications/:id',
        delete: 'DELETE /api/notifications/:id'
      },
      'appointment-reminders': {
        getAll: 'GET /api/appointment-reminders',
        getById: 'GET /api/appointment-reminders/:id',
        create: 'POST /api/appointment-reminders',
        update: 'PUT /api/appointment-reminders/:id',
        delete: 'DELETE /api/appointment-reminders/:id'
      },
      analytics: {
        getAll: 'GET /api/analytics',
        getById: 'GET /api/analytics/:id',
        create: 'POST /api/analytics',
        update: 'PUT /api/analytics/:id',
        delete: 'DELETE /api/analytics/:id'
      }
    },
    documentation: 'Visit /api for this overview'
  });
});

module.exports = router;
