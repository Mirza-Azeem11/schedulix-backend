const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const AppointmentReminder = sequelize.define('AppointmentReminder', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  appointment_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'appointments',
      key: 'id'
    }
  },
  reminder_type: {
    type: DataTypes.ENUM('Email', 'SMS', 'Push_Notification'),
    allowNull: false
  },
  scheduled_time: {
    type: DataTypes.DATE,
    allowNull: false
  },
  sent_at: {
    type: DataTypes.DATE
  },
  status: {
    type: DataTypes.ENUM('Pending', 'Sent', 'Failed'),
    defaultValue: 'Pending'
  },
  message_content: {
    type: DataTypes.TEXT
  },
  error_message: {
    type: DataTypes.TEXT
  }
}, {
  tableName: 'appointment_reminders',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
  indexes: [
    {
      fields: ['appointment_id']
    },
    {
      fields: ['scheduled_time']
    },
    {
      fields: ['status']
    }
  ]
});

module.exports = AppointmentReminder;
