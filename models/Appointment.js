const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Appointment = sequelize.define('Appointment', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  appointment_number: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true
  },
  patient_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'patients',
      key: 'id'
    }
  },
  doctor_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'doctors',
      key: 'id'
    }
  },
  appointment_date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  appointment_time: {
    type: DataTypes.TIME,
    allowNull: false
  },
  duration_minutes: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 30
  },
  appointment_type: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  consultation_type: {
    type: DataTypes.ENUM('In-Person', 'Online'),
    defaultValue: 'In-Person'
  },
  reason: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('Scheduled', 'Confirmed', 'In_Progress', 'Completed', 'Cancelled', 'No_Show'),
    defaultValue: 'Scheduled'
  },
  priority: {
    type: DataTypes.ENUM('Low', 'Normal', 'High', 'Urgent'),
    defaultValue: 'Normal'
  },
  location: {
    type: DataTypes.STRING(200),
    allowNull: true
  },
  meeting_link: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: 'For online consultations'
  },
  reminder_sent: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  reminder_time: {
    type: DataTypes.INTEGER,
    defaultValue: 24,
    comment: 'Hours before appointment'
  },
  cancellation_reason: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  cancelled_by: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  cancelled_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  checked_in_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  completed_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  created_by: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  tenant_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'tenants',
      key: 'id'
    }
  }
}, {
  tableName: 'appointments',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  scopes: {
    tenant: (tenantId) => ({
      where: { tenant_id: tenantId }
    })
  },
  indexes: [
    { fields: ['appointment_number'] },
    { fields: ['patient_id', 'doctor_id'] },
    { fields: ['appointment_date', 'appointment_time'] },
    { fields: ['status'] },
    { fields: ['doctor_id', 'appointment_date'] }
  ]
});

module.exports = Appointment;
