const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/errorMiddleware');
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

// Get all time slots (Doctors can see their own, Admins can see all)
router.get('/', authorize('Doctor', 'Admin', 'SuperAdmin'), getAllTimeSlots);

// Create time slot (Doctors and Admins)
router.post('/', authorize('Doctor', 'Admin', 'SuperAdmin'), createTimeSlot);

// Bulk create time slots (Doctors and Admins)
router.post('/bulk', authorize('Doctor', 'Admin', 'SuperAdmin'), bulkCreateTimeSlots);

// Update time slot (Doctors and Admins)
router.put('/:id', authorize('Doctor', 'Admin', 'SuperAdmin'), updateTimeSlot);

// Delete time slot (Doctors and Admins)
router.delete('/:id', authorize('Doctor', 'Admin', 'SuperAdmin'), deleteTimeSlot);

module.exports = router;
