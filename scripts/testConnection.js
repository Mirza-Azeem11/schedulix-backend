const sequelize = require('../config/db');

const testConnection = async () => {
  console.log('🔍 Starting database connection test...');
  console.log('📋 Database Config:');
  console.log(`  Host: ${process.env.DB_HOST || 'localhost'}`);
  console.log(`  Port: ${process.env.DB_PORT || 3306}`);
  console.log(`  Database: ${process.env.DB_NAME || 'schedulix_healthcare'}`);
  console.log(`  User: ${process.env.DB_USER || 'root'}`);

  try {
    console.log('🔍 Testing database connection...');

    await sequelize.authenticate();
    console.log('✅ Database connection successful!');

    console.log('📋 Testing model sync...');
    await sequelize.sync({ force: false });
    console.log('✅ Models synchronized successfully!');

    await sequelize.close();
    console.log('📡 Connection closed');

    process.exit(0);

  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.error('📍 Full error:', error);
    process.exit(1);
  }
};

testConnection();
