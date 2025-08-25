const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/errorMiddleware');
const {
  getDashboardStats,
  getRevenueTrends,
  getAppointmentTrends,
  getDoctorPerformance,
  getPatientDemographics,
  getDoctorRevenueStats,
  getDoctorDashboardStats,
  getDoctorRevenue
} = require('../controllers/analyticsController');

// All analytics routes require authentication
router.use(protect);

// Admin and Doctor analytics routes (system-wide data accessible to both)
router.get('/dashboard-stats', authorize('Admin', 'SuperAdmin', 'Doctor'), getDashboardStats);
router.get('/revenue-trends', authorize('Admin', 'SuperAdmin', 'Doctor'), getRevenueTrends);
router.get('/appointment-trends', authorize('Admin', 'SuperAdmin', 'Doctor'), getAppointmentTrends);
router.get('/doctor-performance', authorize('Admin', 'SuperAdmin', 'Doctor'), getDoctorPerformance);
router.get('/patient-demographics', authorize('Admin', 'SuperAdmin', 'Doctor'), getPatientDemographics);

// Doctor-specific analytics routes (doctors can access their own data)
router.get('/dashboard', authorize('Doctor', 'Admin', 'SuperAdmin'), getDoctorDashboardStats);
router.get('/revenue-stats', authorize('Doctor', 'Admin', 'SuperAdmin'), getDoctorRevenueStats);
router.get('/revenue', authorize('Doctor', 'Admin', 'SuperAdmin'), getDoctorRevenue);

module.exports = router;
