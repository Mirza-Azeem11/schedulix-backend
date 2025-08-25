const { AppointmentReminder, Appointment } = require('../models');
const { Op } = require('sequelize');

// Get all appointment reminders
exports.getAllReminders = async (req, res) => {
  try {
    const reminders = await AppointmentReminder.findAll({ include: [Appointment] });
    res.json({ success: true, data: reminders });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get reminder by ID
exports.getReminderById = async (req, res) => {
  try {
    const reminder = await AppointmentReminder.findByPk(req.params.id, { include: [Appointment] });
    if (!reminder) return res.status(404).json({ success: false, message: 'Reminder not found' });
    res.json({ success: true, data: reminder });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get reminders by appointment
exports.getRemindersByAppointment = async (req, res) => {
  try {
    const reminders = await AppointmentReminder.findAll({
      where: { appointment_id: req.params.appointmentId },
      include: [Appointment]
    });
    res.json({ success: true, data: reminders });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get pending reminders
exports.getPendingReminders = async (req, res) => {
  try {
    const reminders = await AppointmentReminder.findAll({
      where: {
        status: 'Pending',
        scheduled_time: { [Op.lte]: new Date() }
      },
      include: [Appointment]
    });
    res.json({ success: true, data: reminders });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Create reminder
exports.createReminder = async (req, res) => {
  try {
    const reminder = await AppointmentReminder.create(req.body);
    res.status(201).json({ success: true, data: reminder });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// Update reminder status
exports.updateReminder = async (req, res) => {
  try {
    const reminder = await AppointmentReminder.findByPk(req.params.id);
    if (!reminder) return res.status(404).json({ success: false, message: 'Reminder not found' });
    await reminder.update(req.body);
    res.json({ success: true, data: reminder });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// Mark reminder as sent
exports.markAsSent = async (req, res) => {
  try {
    const reminder = await AppointmentReminder.findByPk(req.params.id);
    if (!reminder) return res.status(404).json({ success: false, message: 'Reminder not found' });

    await reminder.update({
      status: 'Sent',
      sent_at: new Date()
    });

    res.json({ success: true, data: reminder });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// Delete reminder
exports.deleteReminder = async (req, res) => {
  try {
    const reminder = await AppointmentReminder.findByPk(req.params.id);
    if (!reminder) return res.status(404).json({ success: false, message: 'Reminder not found' });
    await reminder.destroy();
    res.json({ success: true, message: 'Reminder deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
