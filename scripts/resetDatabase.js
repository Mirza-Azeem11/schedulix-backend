const sequelize = require('../config/db');

async function resetDatabase() {
  try {
    console.log('🔄 Resetting database...');

    // Drop all tables if they exist
    await sequelize.drop({ cascade: true });
    console.log('✅ All tables dropped');

    // Sync all models to create fresh tables
    await sequelize.sync({ force: true });
    console.log('✅ All tables created');

    console.log('🎉 Database reset completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error resetting database:', error);
    process.exit(1);
  }
}

resetDatabase();
