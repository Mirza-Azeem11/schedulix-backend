const { sequelize } = require('./models');
const seedRoles = require('./seeders/seedRoles');

const initializeDatabase = async () => {
  try {
    console.log('🚀 Initializing database...');

    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');

    // Sync database models
    await sequelize.sync({ force: false, alter: true });
    console.log('✅ Database models synchronized.');

    // Seed initial data
    await seedRoles();

    console.log('🎉 Database initialization completed successfully!');
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    process.exit(1);
  }
};

// Run if this file is executed directly
if (require.main === module) {
  initializeDatabase();
}

module.exports = initializeDatabase;
