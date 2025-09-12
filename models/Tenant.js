const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Tenant = sequelize.define('Tenant', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  slug: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true
  },
  domain: {
    type: DataTypes.STRING(100),
    allowNull: true,
    unique: true
  },
  status: {
    type: DataTypes.ENUM('Active', 'Inactive', 'Suspended'),
    defaultValue: 'Active'
  },
  plan_type: {
    type: DataTypes.ENUM('Basic', 'Premium', 'Enterprise'),
    defaultValue: 'Basic'
  },
  max_users: {
    type: DataTypes.INTEGER,
    defaultValue: 10
  },
  settings: {
    type: DataTypes.JSON,
    defaultValue: {}
  },
  subscription_expires_at: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'tenants',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['slug']
    },
    {
      fields: ['domain']
    },
    {
      fields: ['status']
    }
  ]
});

module.exports = Tenant;
