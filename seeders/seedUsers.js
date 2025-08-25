'use strict';

const bcrypt = require('bcryptjs');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Hash passwords for test users
    const hashedPassword = await bcrypt.hash('password123', 10);

    const users = [
      {
        email: 'admin@schedulix.com',
        password_hash: hashedPassword,
        first_name: 'System',
        last_name: 'Administrator',
        phone: '+1234567890',
        date_of_birth: '1980-01-01',
        gender: 'Other',
        status: 'Active',
        email_verified: true,
        phone_verified: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        email: 'doctor@schedulix.com',
        password_hash: hashedPassword,
        first_name: 'Dr. John',
        last_name: 'Smith',
        phone: '+1234567891',
        date_of_birth: '1975-03-15',
        gender: 'Male',
        status: 'Active',
        email_verified: true,
        phone_verified: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        email: 'patient@schedulix.com',
        password_hash: hashedPassword,
        first_name: 'Jane',
        last_name: 'Doe',
        phone: '+1234567892',
        date_of_birth: '1990-06-20',
        gender: 'Female',
        status: 'Active',
        email_verified: true,
        phone_verified: true,
        created_at: new Date(),
        updated_at: new Date()
      }
    ];

    // Insert users
    await queryInterface.bulkInsert('users', users, {
      ignoreDuplicates: true
    });

    // Get the inserted users
    const insertedUsers = await queryInterface.sequelize.query(
      "SELECT id, email FROM users WHERE email IN ('admin@schedulix.com', 'doctor@schedulix.com', 'patient@schedulix.com')",
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    // Get roles
    const roles = await queryInterface.sequelize.query(
      "SELECT id, name FROM roles WHERE name IN ('Admin', 'Doctor', 'Patient')",
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    const adminUser = insertedUsers.find(u => u.email === 'admin@schedulix.com');
    const doctorUser = insertedUsers.find(u => u.email === 'doctor@schedulix.com');
    const patientUser = insertedUsers.find(u => u.email === 'patient@schedulix.com');

    const adminRole = roles.find(r => r.name === 'Admin');
    const doctorRole = roles.find(r => r.name === 'Doctor');
    const patientRole = roles.find(r => r.name === 'Patient');

    // Assign roles to users
    const userRoles = [];
    if (adminUser && adminRole) {
      userRoles.push({
        user_id: adminUser.id,
        role_id: adminRole.id,
        assigned_at: new Date()
      });
    }
    if (doctorUser && doctorRole) {
      userRoles.push({
        user_id: doctorUser.id,
        role_id: doctorRole.id,
        assigned_at: new Date()
      });
    }
    if (patientUser && patientRole) {
      userRoles.push({
        user_id: patientUser.id,
        role_id: patientRole.id,
        assigned_at: new Date()
      });
    }

    if (userRoles.length > 0) {
      await queryInterface.bulkInsert('user_roles', userRoles, {
        ignoreDuplicates: true
      });
    }

    // Create doctor profile for doctor user
    if (doctorUser) {
      await queryInterface.bulkInsert('doctors', [{
        user_id: doctorUser.id,
        license_number: 'DOC-001-2024',
        specialization: 'General Practice',
        qualification: 'MD - Doctor of Medicine',
        experience_years: 10,
        consultation_fee: 150.00,
        bio: 'Experienced general practitioner with 10 years of medical practice.',
        office_address: '123 Medical Center Drive, Healthcare City',
        consultation_hours: JSON.stringify({
          monday: { start: '09:00', end: '17:00' },
          tuesday: { start: '09:00', end: '17:00' },
          wednesday: { start: '09:00', end: '17:00' },
          thursday: { start: '09:00', end: '17:00' },
          friday: { start: '09:00', end: '17:00' }
        }),
        languages_spoken: JSON.stringify(['English', 'Spanish']),
        rating: 4.8,
        total_reviews: 125,
        verified: true,
        availability_status: 'Available',
        created_at: new Date(),
        updated_at: new Date()
      }], {
        ignoreDuplicates: true
      });
    }

    // Create patient profile for patient user
    if (patientUser) {
      await queryInterface.bulkInsert('patients', [{
        user_id: patientUser.id,
        patient_code: 'PAT-001-2024',
        blood_type: 'A+',
        height: 165.00,
        weight: 60.00,
        allergies: JSON.stringify(['None known']),
        current_medications: JSON.stringify([]),
        emergency_contact_name: 'John Doe',
        emergency_contact_relation: 'Spouse',
        emergency_contact_phone: '+1234567893',
        address: '456 Patient Street',
        city: 'Healthcare City',
        state: 'HC',
        postal_code: '12345',
        country: 'USA',
        status: 'Active',
        created_at: new Date(),
        updated_at: new Date()
      }], {
        ignoreDuplicates: true
      });
    }
  },

  async down(queryInterface, Sequelize) {
    // Remove test data in reverse order
    await queryInterface.bulkDelete('patients', {
      patient_code: 'PAT-001-2024'
    }, {});

    await queryInterface.bulkDelete('doctors', {
      license_number: 'DOC-001-2024'
    }, {});

    await queryInterface.bulkDelete('user_roles', {
      user_id: {
        [Sequelize.Op.in]: queryInterface.sequelize.literal(
          "(SELECT id FROM users WHERE email IN ('admin@schedulix.com', 'doctor@schedulix.com', 'patient@schedulix.com'))"
        )
      }
    }, {});

    await queryInterface.bulkDelete('users', {
      email: {
        [Sequelize.Op.in]: ['admin@schedulix.com', 'doctor@schedulix.com', 'patient@schedulix.com']
      }
    }, {});
  }
};
