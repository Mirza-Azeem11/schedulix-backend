const express = require('express');
const router = express.Router();
const appointmentReminderController = require('../controllers/appointmentReminderController');

router.get('/', appointmentReminderController.getAllReminders);
router.get('/:id', appointmentReminderController.getReminderById);
router.get('/appointment/:appointmentId', appointmentReminderController.getRemindersByAppointment);
router.get('/pending', appointmentReminderController.getPendingReminders);
router.post('/', appointmentReminderController.createReminder);
router.put('/:id', appointmentReminderController.updateReminder);
router.put('/:id/sent', appointmentReminderController.markAsSent);
router.delete('/:id', appointmentReminderController.deleteReminder);

module.exports = router;
