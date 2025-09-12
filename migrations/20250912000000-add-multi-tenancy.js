'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Create tenants table first
    await queryInterface.createTable('tenants', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      name: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      slug: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true
      },
      domain: {
        type: Sequelize.STRING(100),
        allowNull: true,
        unique: true
      },
      status: {
        type: Sequelize.ENUM('Active', 'Inactive', 'Suspended'),
        defaultValue: 'Active'
      },
      plan_type: {
        type: Sequelize.ENUM('Basic', 'Premium', 'Enterprise'),
        defaultValue: 'Basic'
      },
      max_users: {
        type: Sequelize.INTEGER,
        defaultValue: 10
      },
      settings: {
        type: Sequelize.JSON,
        defaultValue: {}
      },
      subscription_expires_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
      }
    });

    // Add indexes for tenants table
    await queryInterface.addIndex('tenants', ['slug']);
    await queryInterface.addIndex('tenants', ['domain']);
    await queryInterface.addIndex('tenants', ['status']);

    // Add tenant_id column to all major tables
    const tablesToUpdate = [
      'users',
      'doctors',
      'patients',
      'appointments',
      'doctor_time_slots',
      'payments',
      'invoices',
      'invoice_items',
      'notifications',
      'appointment_reminders'
    ];

    for (const table of tablesToUpdate) {
      // Add tenant_id column
      await queryInterface.addColumn(table, 'tenant_id', {
        type: Sequelize.INTEGER,
        allowNull: true, // Initially nullable for existing data
        references: {
          model: 'tenants',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      });

      // Add index for tenant_id
      await queryInterface.addIndex(table, ['tenant_id']);
    }

    // Create a default tenant for existing data
    await queryInterface.bulkInsert('tenants', [{
      name: 'Default Tenant',
      slug: 'default',
      domain: null,
      status: 'Active',
      plan_type: 'Enterprise',
      max_users: 1000,
      settings: JSON.stringify({}),
      created_at: new Date(),
      updated_at: new Date()
    }]);

    // Update all existing records to use the default tenant (ID = 1)
    for (const table of tablesToUpdate) {
      await queryInterface.sequelize.query(
        `UPDATE ${table} SET tenant_id = 1 WHERE tenant_id IS NULL`
      );
    }

    // Make tenant_id NOT NULL after populating existing data
    for (const table of tablesToUpdate) {
      await queryInterface.changeColumn(table, 'tenant_id', {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'tenants',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      });
    }
  },

  async down(queryInterface, Sequelize) {
    // Remove tenant_id columns from all tables
    const tablesToUpdate = [
      'users',
      'doctors',
      'patients',
      'appointments',
      'doctor_time_slots',
      'payments',
      'invoices',
      'invoice_items',
      'notifications',
      'appointment_reminders'
    ];

    for (const table of tablesToUpdate) {
      await queryInterface.removeColumn(table, 'tenant_id');
    }

    // Drop tenants table
    await queryInterface.dropTable('tenants');
  }
};
