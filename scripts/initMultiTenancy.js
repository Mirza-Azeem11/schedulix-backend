const { Tenant, User, Doctor, Patient, Appointment, DoctorTimeSlot } = require('../models');
const sequelize = require('../config/db');

const initMultiTenancy = async () => {
  try {
    console.log('🔄 Starting multi-tenancy initialization...');

    // Step 1: Create tables without foreign key constraints first
    await sequelize.sync({ force: false, alter: false });
    console.log('✅ Basic tables synchronized');

    // Step 2: Check if default tenant exists, if not create it
    let defaultTenant = await Tenant.findOne({ where: { slug: 'default' } });

    if (!defaultTenant) {
      console.log('📝 Creating default tenant...');
      defaultTenant = await Tenant.create({
        name: 'Default Organization',
        slug: 'default',
        status: 'Active',
        plan_type: 'Enterprise',
        max_users: 1000,
        settings: {
          initialized: true,
          created_via: 'auto-migration'
        }
      });
      console.log('✅ Default tenant created with ID:', defaultTenant.id);
    } else {
      console.log('✅ Default tenant already exists with ID:', defaultTenant.id);
    }

    // Step 3: Add tenant_id columns as nullable first
    const queryInterface = sequelize.getQueryInterface();

    const tablesToUpdate = [
      'users', 'doctors', 'patients', 'appointments', 'doctor_time_slots',
      'payments', 'invoices', 'invoice_items', 'notifications'
    ];

    for (const tableName of tablesToUpdate) {
      try {
        // Check if tenant_id column exists
        const tableDescription = await queryInterface.describeTable(tableName);

        if (!tableDescription.tenant_id) {
          console.log(`📝 Adding tenant_id column to ${tableName}...`);

          // Add as nullable first
          await queryInterface.addColumn(tableName, 'tenant_id', {
            type: sequelize.Sequelize.INTEGER,
            allowNull: true,
            references: {
              model: 'tenants',
              key: 'id'
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE'
          });

          // Update all existing records to use default tenant
          await sequelize.query(
            `UPDATE ${tableName} SET tenant_id = ? WHERE tenant_id IS NULL`,
            { replacements: [defaultTenant.id] }
          );

          // Make it NOT NULL after populating
          await queryInterface.changeColumn(tableName, 'tenant_id', {
            type: sequelize.Sequelize.INTEGER,
            allowNull: false,
            references: {
              model: 'tenants',
              key: 'id'
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE'
          });

          console.log(`✅ tenant_id added to ${tableName}`);
        } else {
          console.log(`⏭️  tenant_id already exists in ${tableName}`);
        }
      } catch (error) {
        if (error.message.includes('already exists')) {
          console.log(`⏭️  tenant_id already exists in ${tableName}`);
        } else {
          console.error(`❌ Error updating ${tableName}:`, error.message);
        }
      }
    }

    // Step 4: Final sync to ensure all relationships are properly set
    await sequelize.sync({ force: false, alter: false });
    console.log('✅ Multi-tenancy initialization completed successfully!');

    return defaultTenant;
  } catch (error) {
    console.error('❌ Multi-tenancy initialization failed:', error);
    throw error;
  }
};

module.exports = { initMultiTenancy };
