const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const {
  getAllTimeSlots,
  getAvailableTimeSlots,
  createTimeSlot,
  updateTimeSlot,
  deleteTimeSlot,
  bulkCreateTimeSlots
} = require('../controllers/doctorTimeSlotsController');

// Public routes
router.get('/available', getAvailableTimeSlots);

// Protected routes
router.use(protect);

// Get all time slots (Patients can view for booking, Doctors can see their own, Admins can see all)
router.get('/', authorize('Patient', 'Doctor', 'Admin', 'SuperAdmin'), getAllTimeSlots);

// Create time slot (Doctors and Admins only)
router.post('/', authorize('Doctor', 'Admin', 'SuperAdmin'), createTimeSlot);

// Bulk create time slots (Doctors and Admins only)
router.post('/bulk', authorize('Doctor', 'Admin', 'SuperAdmin'), bulkCreateTimeSlots);

// Update time slot (Doctors and Admins only)
router.put('/:id', authorize('Doctor', 'Admin', 'SuperAdmin'), updateTimeSlot);

// Delete time slot (Doctors and Admins only)
router.delete('/:id', authorize('Doctor', 'Admin', 'SuperAdmin'), deleteTimeSlot);

module.exports = router;
