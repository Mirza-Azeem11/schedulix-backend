const jwt = require('jsonwebtoken');

// Generate unique codes
const generatePatientCode = () => {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.random().toString(36).substr(2, 4).toUpperCase();
  return `PAT-${timestamp}-${random}`;
};

const generateAppointmentNumber = () => {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.random().toString(36).substr(2, 4).toUpperCase();
  return `APT-${timestamp}-${random}`;
};

// Format response
const formatResponse = (success, message, data = null, errors = null) => {
  const response = {
    success,
    message,
    timestamp: new Date().toISOString()
  };

  if (data) response.data = data;
  if (errors) response.errors = errors;

  return response;
};

// Pagination helper
const getPagination = (page, size) => {
  const limit = size ? +size : 10;
  const offset = page ? page * limit : 0;

  return { limit, offset };
};

const getPagingData = (data, page, limit) => {
  const { count: totalItems, rows: items } = data;
  const currentPage = page ? +page : 0;
  const totalPages = Math.ceil(totalItems / limit);

  return {
    items,
    pagination: {
      totalItems,
      totalPages,
      currentPage,
      itemsPerPage: limit
    }
  };
};

// Date helpers
const isValidDate = (dateString) => {
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date);
};

const formatDate = (date) => {
  return new Date(date).toISOString().split('T')[0];
};

const formatTime = (time) => {
  return time.slice(0, 5); // HH:MM format
};

// Validation helpers
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const isValidPhone = (phone) => {
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
  return phoneRegex.test(phone);
};

// Error helpers
const createError = (message, statusCode = 500) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

module.exports = {
  generatePatientCode,
  generateAppointmentNumber,
  formatResponse,
  getPagination,
  getPagingData,
  isValidDate,
  formatDate,
  formatTime,
  isValidEmail,
  isValidPhone,
  createError
};
