const seedRoles = require('./seeders/seedRoles');
const sequelize = require('./config/db');

const runSeeders = async () => {
  try {
    console.log('🚀 Starting database seeding...');

    // Ensure database connection is established
    console.log('📡 Connecting to database...');
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully');

    // Sync models to ensure tables exist
    console.log('📋 Synchronizing database models...');
    await sequelize.sync({ force: false });
    console.log('✅ Database models synchronized successfully');

    // Run the roles seeder
    console.log('🌱 Running roles seeder...');
    await seedRoles();

    console.log('🎉 All seeders completed successfully!');

    // Close the connection
    await sequelize.close();
    console.log('📡 Database connection closed');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error running seeders:', error);
    console.error('📍 Error details:', error.message);

    // Close the connection even on error
    try {
      await sequelize.close();
    } catch (closeError) {
      console.error('❌ Error closing database connection:', closeError.message);
    }

    process.exit(1);
  }
};

runSeeders();
