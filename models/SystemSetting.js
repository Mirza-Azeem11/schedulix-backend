const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const SystemSetting = sequelize.define('SystemSetting', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  setting_key: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true
  },
  setting_value: {
    type: DataTypes.TEXT
  },
  setting_type: {
    type: DataTypes.ENUM('String', 'Number', 'Boolean', 'JSON'),
    defaultValue: 'String'
  },
  category: {
    type: DataTypes.STRING(50),
    defaultValue: 'General'
  },
  description: {
    type: DataTypes.TEXT
  },
  is_public: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  updated_by: {
    type: DataTypes.INTEGER,
    references: {
      model: 'users',
      key: 'id'
    }
  }
}, {
  tableName: 'system_settings',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['setting_key']
    },
    {
      fields: ['category']
    }
  ]
});

module.exports = SystemSetting;
