# Schedulix Healthcare Management System - Backend API

A comprehensive Node.js backend API for healthcare management system built with Express.js, Sequelize ORM, and MySQL.

## 🚀 Features

- **User Management**: Registration, authentication, and profile management
- **Role-Based Access Control**: Admin, Doctor, Patient roles with JWT authentication
- **Doctor Management**: Doctor profiles, specializations, and availability
- **Patient Management**: Patient records, and insurance details
- **Appointment System**: Scheduling, updating, cancellation with conflict detection
- **RESTful API**: Complete CRUD operations for all entities
- **Input Validation**: Express-validator for request validation
- **Security**: Helmet, CORS, rate limiting, and password hashing
- **Error Handling**: Centralized error handling with detailed responses

## 🛠️ Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MySQL
- **ORM**: Sequelize
- **Authentication**: JWT (JSON Web Tokens)
- **Validation**: Express-validator
- **Security**: Helmet, CORS, bcryptjs
- **Logging**: Morgan
- **Environment**: dotenv

## 📋 Prerequisites

- Node.js (v14 or higher)
- MySQL (v5.7 or higher)
- npm or yarn

## ⚙️ Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd schedulix-app-backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env
   ```
   
   Update the `.env` file with your configuration:
   ```env
   DB_HOST=localhost
   DB_PORT=3306
   DB_NAME=schedulix_healthcare
   DB_USER=root
   DB_PASSWORD=your_password
   
   PORT=3000
   NODE_ENV=development
   
   JWT_SECRET=your_super_secret_jwt_key_here
   JWT_EXPIRE=7d
   
   CORS_ORIGIN=http://localhost:3000
   ```

4. **Database Setup**
   - Create a MySQL database named `schedulix_healthcare`
   - The application will automatically create tables on first run

5. **Start the server**
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm start
   ```

## 📚 API Documentation

### Base URL
```
http://localhost:3000/api
```

### Authentication Endpoints
- `POST /auth/register` - Register new user
- `POST /auth/login` - User login
- `GET /auth/me` - Get current user profile
- `PUT /auth/profile` - Update user profile
- `PUT /auth/change-password` - Change password

### User Management (Admin only)
- `GET /users` - Get all users
- `GET /users/:id` - Get user by ID
- `POST /users` - Create new user
- `PUT /users/:id` - Update user
- `DELETE /users/:id` - Delete user

### Doctor Management
- `GET /doctors` - Get all doctors (Public)
- `GET /doctors/:id` - Get doctor by ID (Public)
- `GET /doctors/:id/appointments` - Get doctor's appointments (Private)
- `POST /doctors` - Create doctor profile (Admin)
- `PUT /doctors/:id` - Update doctor profile (Doctor/Admin)
- `DELETE /doctors/:id` - Delete doctor profile (Admin)

### Patient Management
- `GET /patients` - Get all patients (Doctor/Admin)
- `GET /patients/:id` - Get patient by ID (Doctor/Admin)
- `POST /patients` - Create patient (Doctor/Admin)
- `PUT /patients/:id` - Update patient (Doctor/Admin)
- `DELETE /patients/:id` - Delete patient (Admin)

### Appointment Management
- `GET /appointments` - Get appointments (Private)
- `GET /appointments/:id` - Get appointment by ID (Private)
- `POST /appointments` - Create appointment (Private)
- `PUT /appointments/:id` - Update appointment (Private)
- `PUT /appointments/:id/cancel` - Cancel appointment (Private)
- `PUT /appointments/:id/complete` - Complete appointment (Doctor)
- `DELETE /appointments/:id` - Delete appointment (Admin)

## 🔐 Authentication

The API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## 📊 Database Schema

The application uses the following main entities:
- **Users**: Core user information
- **Roles**: User roles (Admin, Doctor, Patient)
- **Doctors**: Doctor-specific information
- **Patients**: Patient-specific information
- **Appointments**: Appointment scheduling

## 🛡️ Security Features

- Password hashing with bcryptjs
- JWT token authentication
- Input validation and sanitization
- Rate limiting
- CORS protection
- Helmet security headers
- SQL injection prevention (Sequelize ORM)

## 🔧 Development

```bash
# Install dependencies
npm install

# Run in development mode with auto-restart
npm run dev

# Run tests
npm test

# Database migrations
npm run db:migrate

# Database seeding
npm run db:seed
```

## 📁 Project Structure

```
schedulix-app-backend/
├── config/
│   └── db.js                 # Database configuration
├── controllers/
│   ├── authController.js     # Authentication logic
│   ├── userController.js     # User management
│   ├── doctorController.js   # Doctor management
│   ├── patientController.js  # Patient management
│   └── appointmentController.js # Appointment management
├── middleware/
│   └── errorMiddleware.js    # Error handling & auth
├── models/
│   ├── index.js             # Model associations
│   ├── User.js              # User model
│   ├── Role.js              # Role model
│   ├── Doctor.js            # Doctor model
│   ├── Patient.js           # Patient model
│   ├── Appointment.js       # Appointment model
├── routes/
│   ├── index.js             # Main router
│   ├── auth.js              # Auth routes
│   ├── users.js             # User routes
│   ├── doctors.js           # Doctor routes
│   ├── patients.js          # Patient routes
│   └── appointments.js      # Appointment routes
├── .env.example             # Environment variables template
├── .gitignore              # Git ignore rules
├── package.json            # Dependencies and scripts
├── server.js               # Application entry point
└── README.md               # Documentation
```

## 🚦 Health Check

Check if the API is running:
```
GET /health
```

Response:
```json
{
  "success": true,
  "message": "Schedulix Healthcare API is running",
  "timestamp": "2024-01-20T10:30:00.000Z",
  "environment": "development"
}
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the ISC License.

## 🆘 Support

For support, please contact the development team or create an issue in the repository.
