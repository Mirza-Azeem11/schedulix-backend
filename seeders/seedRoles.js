'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const roles = [
      {
        name: 'Admin',
        description: 'System administrator with full access to all features',
        color: 'bg-red-500',
        permissions: JSON.stringify([
          'user_management',
          'doctor_management',
          'patient_management',
          'appointment_management',
          'system_settings',
          'reports',
          'messaging'
        ]),
        is_system_role: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'Doctor',
        description: 'Medical practitioner with access to patient care features',
        color: 'bg-blue-500',
        permissions: JSON.stringify([
          'patient_management',
          'appointment_management',
          'messaging',
          'reports'
        ]),
        is_system_role: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'Patient',
        description: 'Patient with access to personal health information',
        color: 'bg-green-500',
        permissions: JSON.stringify([
          'view_appointments',
          'book_appointments',
          'messaging',
          'profile_management'
        ]),
        is_system_role: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'Nurse',
        description: 'Nursing staff with patient care access',
        color: 'bg-purple-500',
        permissions: JSON.stringify([
          'patient_management',
          'appointment_management',
          'messaging'
        ]),
        is_system_role: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'Receptionist',
        description: 'Front desk staff with appointment and patient registration access',
        color: 'bg-yellow-500',
        permissions: JSON.stringify([
          'appointment_management',
          'patient_registration',
          'messaging'
        ]),
        is_system_role: true,
        created_at: new Date(),
        updated_at: new Date()
      }
    ];

    await queryInterface.bulkInsert('roles', roles, {
      ignoreDuplicates: true
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('roles', {
      is_system_role: true
    }, {});
  }
};
