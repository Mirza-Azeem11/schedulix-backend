const { validationResult } = require('express-validator');
const { User, Role, Doctor, Patient ,UserRole} = require('../models');

// @desc    Get all users
// @route   GET /api/users
// @access  Private (Admin only)
const getUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status, role } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = {};
    if (status) whereClause.status = status;

    const includeClause = [{
      model: Role,
      through: { attributes: [] }
    }];

    if (role) {
      includeClause[0].where = { name: role };
      includeClause[0].required = true;
    }

    const { count, rows: users } = await User.findAndCountAll({
      where: whereClause,
      include: includeClause,
      attributes: { exclude: ['password_hash'] },
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['created_at', 'DESC']]
    });

    res.status(200).json({
      success: true,
      data: {
        users: users.map(user => ({
          ...user.toJSON(),
          roles: user.Roles?.map(role => role.name) || []
        })),
        pagination: {
          current_page: parseInt(page),
          total_pages: Math.ceil(count / limit),
          total_records: count,
          per_page: parseInt(limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single user
// @route   GET /api/users/:id
// @access  Private
const getUser = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id, {
      include: [
        {
          model: Role,
          through: { attributes: [] }
        },
        {
          model: Doctor,
          required: false
        },
        {
          model: Patient,
          required: false
        }
      ],
      attributes: { exclude: ['password_hash'] }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        user: {
          ...user.toJSON(),
          roles: user.Roles?.map(role => role.name) || []
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new user
// @route   POST /api/users
// @access  Private (Admin only)
const createUser = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { email, password, first_name, last_name, phone, date_of_birth, gender, role } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    // Create user
    const user = await User.create({
      email,
      password_hash: password,
      first_name,
      last_name,
      phone,
      date_of_birth,
      gender
    });

    // Assign roles if provided
    if (role) {
      console.log(role);
      const roleObject = await Role.findByPk(role);

      console.log(roleObject);
      await UserRole.create({
        user_id: user.id,
        role_id: roleObject.id
      });
      // await user.setRoles(roleObjects);
    }

    // Fetch user with roles
    const newUser = await User.findByPk(user.id, {
      include: [{
        model: Role,
        through: { attributes: [] }
      }],
      attributes: { exclude: ['password_hash'] }
    });

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: {
        user: {
          ...newUser.toJSON(),
          roles: newUser.Roles?.map(role => role.name) || []
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private (Admin only)
const updateUser = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const { first_name, last_name, phone, date_of_birth, gender, status, roles } = req.body;

    await user.update({
      first_name: first_name || user.first_name,
      last_name: last_name || user.last_name,
      phone: phone || user.phone,
      date_of_birth: date_of_birth || user.date_of_birth,
      gender: gender || user.gender,
      status: status || user.status
    });

    // Update roles if provided
    if (roles && roles.length > 0) {
      const roleObjects = await Role.findAll({
        where: { name: roles }
      });
      await UserRole.create({
        user_id: user.id,
        role_id: role.id
      });

      // await user.setRoles(roleObjects);
    }

    // Fetch updated user with roles
    const updatedUser = await User.findByPk(user.id, {
      include: [{
        model: Role,
        through: { attributes: [] }
      }],
      attributes: { exclude: ['password_hash'] }
    });

    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: {
        user: {
          ...updatedUser.toJSON(),
          roles: updatedUser.Roles?.map(role => role.name) || []
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private (Admin only)
const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    await user.destroy();

    res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser
};
