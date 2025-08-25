const sequelize = require('../config/db');

// Import all models
const User = require('./User');
const Role = require('./Role');
const UserRole = require('./UserRole');
const Doctor = require('./Doctor');
const DoctorTimeSlot = require('./DoctorTimeSlot');
const Patient = require('./Patient');
const Appointment = require('./Appointment');
const AppointmentReminder = require('./AppointmentReminder');
const Invoice = require('./Invoice');
const InvoiceItem = require('./InvoiceItem');
const Payment = require('./Payment');
const SystemSetting = require('./SystemSetting');
const Notification = require('./Notification');

// Define associations according to schema.md
// User associations
User.belongsToMany(Role, { through: UserRole, foreignKey: 'user_id' });
Role.belongsToMany(User, { through: UserRole, foreignKey: 'role_id' });


User.hasOne(Doctor, { foreignKey: 'user_id' });
Doctor.belongsTo(User, { foreignKey: 'user_id' });

User.hasOne(Patient, { foreignKey: 'user_id' });
Patient.belongsTo(User, { foreignKey: 'user_id' });

// UserRole associations
UserRole.belongsTo(User, { foreignKey: 'user_id' });
UserRole.belongsTo(Role, { foreignKey: 'role_id' });
UserRole.belongsTo(User, { as: 'AssignedBy', foreignKey: 'assigned_by' });

// Doctor associations
Doctor.hasMany(DoctorTimeSlot, { foreignKey: 'doctor_id' });
DoctorTimeSlot.belongsTo(Doctor, { foreignKey: 'doctor_id' });

Doctor.hasMany(Appointment, { foreignKey: 'doctor_id' });
Doctor.hasMany(Invoice, { foreignKey: 'doctor_id' });

// Patient associations

Patient.hasMany(Appointment, { foreignKey: 'patient_id' });
Patient.hasMany(Invoice, { foreignKey: 'patient_id' });

Patient.belongsTo(Doctor, { as: 'RegisteredBy', foreignKey: 'registered_by' });
Doctor.hasMany(Patient, { as: 'RegisteredPatients', foreignKey: 'registered_by' });

// Appointment associations
Appointment.belongsTo(Patient, { foreignKey: 'patient_id' });
Appointment.belongsTo(Doctor, { foreignKey: 'doctor_id' });
Appointment.belongsTo(User, { as: 'CancelledBy', foreignKey: 'cancelled_by' });
Appointment.belongsTo(User, { as: 'CreatedBy', foreignKey: 'created_by' });

Appointment.hasMany(AppointmentReminder, { foreignKey: 'appointment_id' });
AppointmentReminder.belongsTo(Appointment, { foreignKey: 'appointment_id' });


// Invoice associations
Invoice.belongsTo(Patient, { foreignKey: 'patient_id' });
Invoice.belongsTo(Doctor, { foreignKey: 'doctor_id' });
Invoice.belongsTo(Appointment, { foreignKey: 'appointment_id' });
Invoice.belongsTo(User, { as: 'CreatedBy', foreignKey: 'created_by' });

Invoice.hasMany(InvoiceItem, { foreignKey: 'invoice_id' });
InvoiceItem.belongsTo(Invoice, { foreignKey: 'invoice_id' });

Invoice.hasMany(Payment, { foreignKey: 'invoice_id' });
Payment.belongsTo(Invoice, { foreignKey: 'invoice_id' });

// Payment associations
Payment.belongsTo(User, { as: 'ProcessedBy', foreignKey: 'processed_by' });

// System Setting associations
SystemSetting.belongsTo(User, { as: 'UpdatedBy', foreignKey: 'updated_by' });

// Notification associations
Notification.belongsTo(User, { foreignKey: 'user_id' });

module.exports = {
  sequelize,
  User,
  Role,
  UserRole,
  Doctor,
  DoctorTimeSlot,
  Patient,
  Appointment,
  AppointmentReminder,
  Invoice,
  InvoiceItem,
  Payment,
  SystemSetting,
  Notification
};
