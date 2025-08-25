const express = require('express');
const router = express.Router();
const seedRoles = require('../seeders/seedRoles');
const seedUsers = require('../seeders/seedUsers');
const { User } = require('../models'); // Adjust the path as necessary

// Run seeder endpoint
router.post('/seed-roles', async (req, res) => {
  try {
    console.log('�������� Starting roles seeding via API...');
    await seedRoles();

    res.json({
      success: true,
      message: 'Roles seeded successfully!',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Error seeding roles:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to seed roles',
      error: error.message
    });
  }
});

// Run users seeder endpoint
router.post('/seed-users', async (req, res) => {
  try {
    console.log('🌱 Starting users seeding via API...');
    await seedUsers();

    res.json({
      success: true,
      message: 'Users seeded successfully!',
      timestamp: new Date().toISOString(),
      credentials: {
        admin: 'admin@schedulix.com / password123',
        doctor: 'doctor@schedulix.com / password123',
        patient: 'patient@schedulix.com / password123'
      }
    });
  } catch (error) {
    console.error('❌ Error seeding users:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to seed users',
      error: error.message
    });
  }
});

// Run all seeders at once
router.post('/seed-all', async (req, res) => {
  try {
    console.log('🌱 Starting complete database seeding...');

    await seedRoles();
    console.log('✅ Roles seeded');

    await seedUsers();
    console.log('✅ Users seeded');

    res.json({
      success: true,
      message: 'All seeders completed successfully!',
      timestamp: new Date().toISOString(),
      credentials: {
        admin: 'admin@schedulix.com / password123',
        doctor: 'doctor@schedulix.com / password123',
        patient: 'patient@schedulix.com / password123'
      }
    });
  } catch (error) {
    console.error('❌ Error running seeders:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to run seeders',
      error: error.message
    });
  }
});

// Reset and recreate users with correct password hashing
router.post('/reset-users', async (req, res) => {
  try {
    console.log('🔄 Resetting users with correct password hashing...');

    // Delete existing test users first
    const testEmails = ['admin@schedulix.com', 'doctor@schedulix.com', 'patient@schedulix.com'];

    for (const email of testEmails) {
      const user = await User.findOne({ where: { email } });
      if (user) {
        await user.destroy();
        console.log(`🗑️ Deleted existing user: ${email}`);
      }
    }

    // Now recreate them with correct password hashing
    await seedUsers();

    res.json({
      success: true,
      message: 'Users reset and recreated successfully!',
      timestamp: new Date().toISOString(),
      credentials: {
        admin: 'admin@schedulix.com / password123',
        doctor: 'doctor@schedulix.com / password123',
        patient: 'patient@schedulix.com / password123'
      }
    });
  } catch (error) {
    console.error('❌ Error resetting users:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset users',
      error: error.message
    });
  }
});

// Manually fix user passwords (for debugging)
router.post('/fix-passwords', async (req, res) => {
  try {
    console.log('🔧 Manually fixing user passwords...');

    const testUsers = [
      { email: 'admin@schedulix.com', password: 'password123' },
      { email: 'doctor@schedulix.com', password: 'password123' },
      { email: 'patient@schedulix.com', password: 'password123' }
    ];

    const bcrypt = require('bcryptjs');

    for (const userInfo of testUsers) {
      const user = await User.findOne({ where: { email: userInfo.email } });
      if (user) {
        // Manually hash the password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(userInfo.password, salt);

        // Update the user with properly hashed password
        await user.update({ password_hash: hashedPassword }, { hooks: false });
        console.log(`✅ Fixed password for: ${userInfo.email}`);
      } else {
        console.log(`❌ User not found: ${userInfo.email}`);
      }
    }

    res.json({
      success: true,
      message: 'Passwords fixed successfully!',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Error fixing passwords:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fix passwords',
      error: error.message
    });
  }
});

module.exports = router;
