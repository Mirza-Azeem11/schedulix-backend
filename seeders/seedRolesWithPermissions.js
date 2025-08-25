const { Role } = require('../models');

const defaultRoles = [
  {
    name: 'Super Admin',
    description: 'Full system access with all permissions',
    permissions: [
      'users.view', 'users.create', 'users.edit', 'users.delete',
      'roles.view', 'roles.create', 'roles.edit', 'roles.delete',
      'patients.view', 'patients.create', 'patients.edit', 'patients.delete',
      'doctors.view', 'doctors.create', 'doctors.edit', 'doctors.delete', 'doctors.schedule',
      'appointments.view', 'appointments.create', 'appointments.edit', 'appointments.cancel', 'appointments.complete',
      'payments.view', 'payments.create', 'payments.refund',
      'invoices.view', 'invoices.create',
      'notifications.manage',
      'analytics.view', 'reports.generate',
      'system.settings', 'system.backup', 'system.maintenance'
    ],
    is_system_role: true,
    color: 'bg-red-500'
  },
  {
    name: 'Admin',
    description: 'Administrative access with most permissions except system maintenance',
    permissions: [
      'users.view', 'users.create', 'users.edit',
      'roles.view', 'roles.create', 'roles.edit',
      'patients.view', 'patients.create', 'patients.edit', 'patients.delete',
      'doctors.view', 'doctors.create', 'doctors.edit', 'doctors.schedule',
      'appointments.view', 'appointments.create', 'appointments.edit', 'appointments.cancel', 'appointments.complete',
      'payments.view', 'payments.create',
      'invoices.view', 'invoices.create',
      'notifications.manage',
      'analytics.view', 'reports.generate'
    ],
    is_system_role: false,
    color: 'bg-purple-500'
  },
  {
    name: 'Doctor',
    description: 'Doctor access with patient and appointment management',
    permissions: [
      'patients.view', 'patients.edit',
      'doctors.view', 'doctors.schedule',
      'appointments.view', 'appointments.edit', 'appointments.complete',
      'analytics.view'
    ],
    is_system_role: false,
    color: 'bg-green-500'
  },
  {
    name: 'Receptionist',
    description: 'Front desk operations - patient registration and appointment scheduling',
    permissions: [
      'patients.view', 'patients.create', 'patients.edit',
      'doctors.view',
      'appointments.view', 'appointments.create', 'appointments.edit', 'appointments.cancel',
    ],
    is_system_role: false,
    color: 'bg-blue-500'
  },
  {
    name: 'Accountant',
    description: 'Financial management - payments, invoices, and financial reports',
    permissions: [
      'patients.view',
      'appointments.view',
      'payments.view', 'payments.create', 'payments.refund',
      'invoices.view', 'invoices.create',
      'analytics.view', 'reports.generate'
    ],
    is_system_role: false,
    color: 'bg-yellow-500'
  },
  {
    name: 'Nurse',
    description: 'Patient care support',
    permissions: [
      'patients.view', 'patients.edit',
      'doctors.view',
      'appointments.view', 'appointments.edit',
    ],
    is_system_role: false,
    color: 'bg-pink-500'
  }
];

async function seedRoles() {
  try {
    console.log('🌱 Starting role seeding...');

    for (const roleData of defaultRoles) {
      const existingRole = await Role.findOne({ where: { name: roleData.name } });

      if (!existingRole) {
        const role = await Role.create(roleData);
        console.log(`✅ Created role: ${role.name} with ${role.permissions?.length || 0} permissions`);
      } else {
        console.log(`⏭️  Role already exists: ${roleData.name}`);
      }
    }

    console.log('🎉 Role seeding completed successfully!');
  } catch (error) {
    console.error('❌ Error seeding roles:', error);
    throw error;
  }
}

// Run seeder if called directly
if (require.main === module) {
  seedRoles()
    .then(() => {
      console.log('Seeding completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Seeding failed:', error);
      process.exit(1);
    });
}

module.exports = seedRoles;
