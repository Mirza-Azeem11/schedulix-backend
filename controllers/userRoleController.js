const { UserRole, User, Role } = require('../models');

// Get all user roles
exports.getAllUserRoles = async (req, res) => {
  try {
    const userRoles = await UserRole.findAll({ include: [User, Role] });
    res.json({ success: true, data: userRoles });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get user role by ID
exports.getUserRoleById = async (req, res) => {
  try {
    const userRole = await UserRole.findByPk(req.params.id, { include: [User, Role] });
    if (!userRole) return res.status(404).json({ success: false, message: 'User role not found' });
    res.json({ success: true, data: userRole });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Assign role to user
exports.createUserRole = async (req, res) => {
  try {
    const { user_id, role_id, assigned_by } = req.body;
    const userRole = await UserRole.create({ user_id, role_id, assigned_by });
    res.status(201).json({ success: true, data: userRole });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// Update user role
exports.updateUserRole = async (req, res) => {
  try {
    const userRole = await UserRole.findByPk(req.params.id);
    if (!userRole) return res.status(404).json({ success: false, message: 'User role not found' });
    await userRole.update(req.body);
    res.json({ success: true, data: userRole });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// Remove user role
exports.deleteUserRole = async (req, res) => {
  try {
    const userRole = await UserRole.findByPk(req.params.id);
    if (!userRole) return res.status(404).json({ success: false, message: 'User role not found' });
    await userRole.destroy();
    res.json({ success: true, message: 'User role deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

