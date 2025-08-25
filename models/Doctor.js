const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Doctor = sequelize.define('Doctor', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  license_number: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true
  },
  specialization: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  qualification: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  experience_years: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  consultation_fee: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00
  },
  bio: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  office_address: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  consultation_hours: {
    type: DataTypes.JSON,
    allowNull: true
  },
  languages_spoken: {
    type: DataTypes.JSON,
    allowNull: true
  },
  rating: {
    type: DataTypes.DECIMAL(3, 2),
    defaultValue: 0.00
  },
  total_reviews: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  verified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  availability_status: {
    type: DataTypes.ENUM('Available', 'Busy', 'Offline'),
    defaultValue: 'Available'
  }
}, {
  tableName: 'doctors',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    { fields: ['specialization'] },
    { fields: ['rating'] },
    { fields: ['verified'] }
  ]
});

module.exports = Doctor;
