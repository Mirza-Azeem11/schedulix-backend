// Simple test to check if basic Node.js execution works
console.log('🚀 Script started successfully!');

// Test environment variable loading
require('dotenv').config();
console.log('📋 Environment variables loaded:');
console.log(`  DB_HOST: ${process.env.DB_HOST}`);
console.log(`  DB_PORT: ${process.env.DB_PORT}`);
console.log(`  DB_NAME: ${process.env.DB_NAME}`);
console.log(`  DB_USER: ${process.env.DB_USER}`);

// Test Sequelize import
try {
  console.log('📦 Testing Sequelize import...');
  const { Sequelize } = require('sequelize');
  console.log('✅ Sequelize imported successfully');

  // Test database config import
  console.log('🔧 Testing database config import...');
  const sequelize = require('../config/db');
  console.log('✅ Database config imported successfully');

  console.log('🎉 All imports successful!');

} catch (error) {
  console.error('❌ Import error:', error.message);
  console.error('📍 Full error:', error);
}

console.log('🏁 Script completed!');
