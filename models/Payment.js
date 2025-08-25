const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Payment = sequelize.define('Payment', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  payment_reference: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true
  },
  invoice_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'invoices',
      key: 'id'
    }
  },
  payment_method: {
    type: DataTypes.ENUM('Cash', 'Credit_Card', 'Debit_Card', 'Bank_Transfer', 'Insurance', 'Online'),
    allowNull: false
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  currency: {
    type: DataTypes.STRING(3),
    defaultValue: 'USD'
  },
  payment_date: {
    type: DataTypes.DATE,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('Pending', 'Completed', 'Failed', 'Refunded', 'Cancelled'),
    allowNull: false
  },
  transaction_id: {
    type: DataTypes.STRING(255)
  },
  gateway_response: {
    type: DataTypes.JSON
  },
  failure_reason: {
    type: DataTypes.TEXT
  },
  refund_amount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00
  },
  refund_date: {
    type: DataTypes.DATE
  },
  processed_by: {
    type: DataTypes.INTEGER,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  notes: {
    type: DataTypes.TEXT
  }
}, {
  tableName: 'payments',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['payment_reference']
    },
    {
      fields: ['invoice_id']
    },
    {
      fields: ['status']
    },
    {
      fields: ['payment_date']
    }
  ]
});

module.exports = Payment;
