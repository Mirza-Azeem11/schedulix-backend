const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const DoctorTimeSlot = sequelize.define('DoctorTimeSlot', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  tenant_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'tenants',
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
  day_of_week: {
    type: DataTypes.ENUM('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'),
    allowNull: false
  },
  start_time: {
    type: DataTypes.TIME,
    allowNull: false
  },
  end_time: {
    type: DataTypes.TIME,
    allowNull: false
  },
  duration_minutes: {
    type: DataTypes.INTEGER,
    defaultValue: 30
  },
  appointment_types: {
    type: DataTypes.JSON
  },
  location: {
    type: DataTypes.STRING(100),
    defaultValue: 'Clinic'
  },
  consultation_type: {
    type: DataTypes.ENUM('In-Person', 'Online', 'Both'),
    defaultValue: 'In-Person'
  },
  max_patients: {
    type: DataTypes.INTEGER,
    defaultValue: 1
  },
  is_recurring: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  break_time_minutes: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
}, {
  tableName: 'doctor_time_slots',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  scopes: {
    tenant: (tenantId) => ({
      where: { tenant_id: tenantId }
    })
  },
  indexes: [
    {
      fields: ['doctor_id', 'day_of_week']
    },
    {
      fields: ['is_active']
    }
  ]
});

module.exports = DoctorTimeSlot;
