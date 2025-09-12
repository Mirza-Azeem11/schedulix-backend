const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const db = require('./config/db');
const routes = require('./routes');
const { errorHandler, notFound } = require('./middleware/errorMiddleware');
const { initMultiTenancy } = require('./scripts/initMultiTenancy');

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: true, // Allow all origins
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Logging
app.use(morgan('combined'));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Schedulix Healthcare API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

// API routes (removed global multi-tenancy middleware)
app.use('/api', routes);

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 3000;

// Database connection and server startup
const startServer = async () => {
  try {
    // Test database connection
    await db.authenticate();
    console.log('✅ Database connection established successfully.');

    // Sync database models (creates/updates tables)
    if (process.env.NODE_ENV === 'development') {
      await db.sync({ alter: true });
      console.log('✅ Database synchronized successfully.');
    }

    // Initialize multi-tenancy safely
    try {
      await initMultiTenancy();
    } catch (error) {
      console.error('❌ Multi-tenancy initialization failed:', error.message);
      // Continue anyway for development
    }

    // Start server
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📋 Environment: ${process.env.NODE_ENV}`);
      console.log(`🔗 Health check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error('❌ Unable to start server:', error);
    process.exit(1);
  }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.log(`❌ Unhandled Rejection: ${err.message}`);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.log(`❌ Uncaught Exception: ${err.message}`);
  process.exit(1);
});

startServer();

module.exports = app;
