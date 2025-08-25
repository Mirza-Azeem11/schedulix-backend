'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Create users table
    await queryInterface.createTable('users', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      email: {
        type: Sequelize.STRING(255),
        allowNull: false,
        unique: true
      },
      password_hash: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      first_name: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      last_name: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      phone: {
        type: Sequelize.STRING(20),
        allowNull: true
      },
      date_of_birth: {
        type: Sequelize.DATE,
        allowNull: true
      },
      gender: {
        type: Sequelize.ENUM('Male', 'Female', 'Other'),
        allowNull: true
      },
      avatar_url: {
        type: Sequelize.STRING(500),
        allowNull: true
      },
      status: {
        type: Sequelize.ENUM('Active', 'Inactive', 'Suspended'),
        defaultValue: 'Active'
      },
      email_verified: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      phone_verified: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      last_login: {
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

    // Create roles table
    await queryInterface.createTable('roles', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      name: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      color: {
        type: Sequelize.STRING(20),
        defaultValue: 'bg-blue-500'
      },
      permissions: {
        type: Sequelize.JSON,
        allowNull: true
      },
      is_system_role: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
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

    // Create user_roles table
    await queryInterface.createTable('user_roles', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      role_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'roles',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      assigned_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      assigned_by: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onDelete: 'SET NULL'
      }
    });

    // Create doctors table
    await queryInterface.createTable('doctors', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        unique: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      license_number: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true
      },
      specialization: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      qualification: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      experience_years: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      consultation_fee: {
        type: Sequelize.DECIMAL(10, 2),
        defaultValue: 0.00
      },
      bio: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      office_address: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      consultation_hours: {
        type: Sequelize.JSON,
        allowNull: true
      },
      languages_spoken: {
        type: Sequelize.JSON,
        allowNull: true
      },
      rating: {
        type: Sequelize.DECIMAL(3, 2),
        defaultValue: 0.00
      },
      total_reviews: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      verified: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      availability_status: {
        type: Sequelize.ENUM('Available', 'Busy', 'Offline'),
        defaultValue: 'Available'
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

    // Create patients table
    await queryInterface.createTable('patients', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        unique: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onDelete: 'SET NULL'
      },
      patient_code: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true
      },
      blood_type: {
        type: Sequelize.ENUM('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'),
        allowNull: true
      },
      height: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: true
      },
      weight: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: true
      },
      allergies: {
        type: Sequelize.JSON,
        allowNull: true
      },
      current_medications: {
        type: Sequelize.JSON,
        allowNull: true
      },
      insurance_provider: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      insurance_policy_number: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      emergency_contact_name: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      emergency_contact_relation: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      emergency_contact_phone: {
        type: Sequelize.STRING(20),
        allowNull: true
      },
      address: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      city: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      state: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      postal_code: {
        type: Sequelize.STRING(20),
        allowNull: true
      },
      country: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      status: {
        type: Sequelize.ENUM('Active', 'Inactive', 'Critical'),
        defaultValue: 'Active'
      },
      registered_by: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'doctors',
          key: 'id'
        },
        onDelete: 'SET NULL'
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

    // Create appointments table
    await queryInterface.createTable('appointments', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      appointment_number: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true
      },
      patient_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'patients',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      doctor_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'doctors',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      appointment_date: {
        type: Sequelize.DATE,
        allowNull: false
      },
      appointment_time: {
        type: Sequelize.TIME,
        allowNull: false
      },
      duration_minutes: {
        type: Sequelize.INTEGER,
        defaultValue: 30
      },
      appointment_type: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      consultation_type: {
        type: Sequelize.ENUM('In-Person', 'Online'),
        defaultValue: 'In-Person'
      },
      reason: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      status: {
        type: Sequelize.ENUM('Scheduled', 'Confirmed', 'In_Progress', 'Completed', 'Cancelled', 'No_Show'),
        defaultValue: 'Scheduled'
      },
      priority: {
        type: Sequelize.ENUM('Low', 'Normal', 'High', 'Urgent'),
        defaultValue: 'Normal'
      },
      location: {
        type: Sequelize.STRING(200),
        allowNull: true
      },
      meeting_link: {
        type: Sequelize.STRING(500),
        allowNull: true
      },
      reminder_sent: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      reminder_time: {
        type: Sequelize.INTEGER,
        defaultValue: 24
      },
      cancellation_reason: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      cancelled_by: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onDelete: 'SET NULL'
      },
      cancelled_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      checked_in_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      completed_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      created_by: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onDelete: 'SET NULL'
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

    // Add remaining tables (messages, invoices, payments, etc.)
    // ... (continuing with other tables based on schema.md)

    // Add indexes
    await queryInterface.addIndex('users', ['email']);
    await queryInterface.addIndex('users', ['status']);
    await queryInterface.addIndex('roles', ['name']);
    await queryInterface.addIndex('user_roles', ['user_id', 'role_id'], { unique: true });
    await queryInterface.addIndex('doctors', ['specialization']);
    await queryInterface.addIndex('doctors', ['verified']);
    await queryInterface.addIndex('patients', ['patient_code']);
    await queryInterface.addIndex('patients', ['status']);
    await queryInterface.addIndex('appointments', ['appointment_number']);
    await queryInterface.addIndex('appointments', ['patient_id', 'doctor_id']);
    await queryInterface.addIndex('appointments', ['appointment_date', 'appointment_time']);
    await queryInterface.addIndex('appointments', ['status']);
  },

  async down(queryInterface, Sequelize) {
    // Drop tables in reverse order
    await queryInterface.dropTable('appointments');
    await queryInterface.dropTable('patients');
    await queryInterface.dropTable('doctors');
    await queryInterface.dropTable('user_roles');
    await queryInterface.dropTable('roles');
    await queryInterface.dropTable('users');
  }
};
