const { Role, UserRole } = require('../models');
const { Op } = require('sequelize');

// Valid permission IDs for validation
const VALID_PERMISSIONS = [
  'users.view', 'users.create', 'users.edit', 'users.delete',
  'roles.view', 'roles.create', 'roles.edit', 'roles.delete',
  'patients.view', 'patients.create', 'patients.edit', 'patients.delete',
  'doctors.view', 'doctors.create', 'doctors.edit', 'doctors.delete', 'doctors.schedule',
  'appointments.view', 'appointments.create', 'appointments.edit', 'appointments.cancel', 'appointments.complete',
  'payments.view', 'payments.create', 'payments.refund',
  'invoices.view', 'invoices.create',
  'notifications.manage',
  'analytics.view', 'reports.generate',
  'system.settings', 'system.backup', 'system.maintenance'
];

// Get all roles with optional filtering
exports.getAllRoles = async (req, res) => {
  try {
    const { search, permissions } = req.query;

    let whereClause = {};

    // Add search filter
    if (search) {
      whereClause = {
        ...whereClause,
        [Op.or]: [
          { name: { [Op.like]: `%${search}%` } },
          { description: { [Op.like]: `%${search}%` } }
        ]
      };
    }

    const roles = await Role.findAll({
      where: whereClause,
      order: [['created_at', 'DESC']]
    });

    res.json({
      success: true,
      data: roles,
      message: `Retrieved ${roles.length} roles successfully`
    });
  } catch (err) {
    console.error('Error fetching roles:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch roles',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

// Get role by ID
exports.getRoleById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: 'Valid role ID is required'
      });
    }

    const role = await Role.findByPk(id);

    if (!role) {
      return res.status(404).json({
        success: false,
        message: 'Role not found'
      });
    }

    res.json({
      success: true,
      data: role,
      message: 'Role retrieved successfully'
    });
  } catch (err) {
    console.error('Error fetching role:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch role',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

// Create role
exports.createRole = async (req, res) => {
  try {
    const { name, description, permissions = [] } = req.body;

    // Validation
    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Role name is required'
      });
    }

    if (!description || !description.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Role description is required'
      });
    }

    if (!Array.isArray(permissions)) {
      return res.status(400).json({
        success: false,
        message: 'Permissions must be an array'
      });
    }

    // Validate permissions
    const invalidPermissions = permissions.filter(perm => !VALID_PERMISSIONS.includes(perm));
    if (invalidPermissions.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Invalid permissions: ${invalidPermissions.join(', ')}`
      });
    }

    // Check for duplicate role name
    const existingRole = await Role.findOne({ where: { name: name.trim() } });
    if (existingRole) {
      return res.status(409).json({
        success: false,
        message: 'A role with this name already exists'
      });
    }

    const roleData = {
      name: name.trim(),
      description: description.trim(),
      permissions: permissions.length > 0 ? permissions : []
    };

    const role = await Role.create(roleData);

    res.status(201).json({
      success: true,
      data: role,
      message: 'Role created successfully'
    });
  } catch (err) {
    console.error('Error creating role:', err);

    if (err.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({
        success: false,
        message: 'A role with this name already exists'
      });
    }

    res.status(400).json({
      success: false,
      message: 'Failed to create role',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

// Update role
exports.updateRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, permissions = [] } = req.body;

    if (!id || isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: 'Valid role ID is required'
      });
    }

    const role = await Role.findByPk(id);
    if (!role) {
      return res.status(404).json({
        success: false,
        message: 'Role not found'
      });
    }

    // Check if it's a system role
    if (role.is_system_role) {
      return res.status(403).json({
        success: false,
        message: 'System roles cannot be modified'
      });
    }

    // Validation
    if (name !== undefined) {
      if (!name || !name.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Role name cannot be empty'
        });
      }

      // Check for duplicate role name (excluding current role)
      const existingRole = await Role.findOne({
        where: {
          name: name.trim(),
          id: { [Op.ne]: id }
        }
      });
      if (existingRole) {
        return res.status(409).json({
          success: false,
          message: 'A role with this name already exists'
        });
      }
    }

    if (description !== undefined && (!description || !description.trim())) {
      return res.status(400).json({
        success: false,
        message: 'Role description cannot be empty'
      });
    }

    if (permissions !== undefined) {
      if (!Array.isArray(permissions)) {
        return res.status(400).json({
          success: false,
          message: 'Permissions must be an array'
        });
      }

      // Validate permissions
      const invalidPermissions = permissions.filter(perm => !VALID_PERMISSIONS.includes(perm));
      if (invalidPermissions.length > 0) {
        return res.status(400).json({
          success: false,
          message: `Invalid permissions: ${invalidPermissions.join(', ')}`
        });
      }
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description.trim();
    if (permissions !== undefined) updateData.permissions = permissions;

    await role.update(updateData);

    res.json({
      success: true,
      data: role,
      message: 'Role updated successfully'
    });
  } catch (err) {
    console.error('Error updating role:', err);

    if (err.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({
        success: false,
        message: 'A role with this name already exists'
      });
    }

    res.status(400).json({
      success: false,
      message: 'Failed to update role',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

// Delete role
exports.deleteRole = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: 'Valid role ID is required'
      });
    }

    const role = await Role.findByPk(id);
    if (!role) {
      return res.status(404).json({
        success: false,
        message: 'Role not found'
      });
    }

    // Check if it's a system role
    if (role.is_system_role) {
      return res.status(403).json({
        success: false,
        message: 'System roles cannot be deleted'
      });
    }

    // Check if role is assigned to any users
    const userRoleCount = await UserRole.count({ where: { role_id: id } });

    if (userRoleCount > 0) {
      return res.status(409).json({
        success: false,
        message: `Cannot delete role. It is assigned to ${userRoleCount} user(s). Please reassign users before deleting.`
      });
    }

    await role.destroy();

    res.json({
      success: true,
      message: 'Role deleted successfully'
    });
  } catch (err) {
    console.error('Error deleting role:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to delete role',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

// Get available permissions (for frontend use)
exports.getAvailablePermissions = async (req, res) => {
  try {
    const permissionCategories = [
      {
        category: 'User Management',
        permissions: [
          { id: 'users.view', name: 'View Users', description: 'View user list and details' },
          { id: 'users.create', name: 'Create Users', description: 'Add new users to the system' },
          { id: 'users.edit', name: 'Edit Users', description: 'Modify user information' },
          { id: 'users.delete', name: 'Delete Users', description: 'Remove users from the system' },
        ]
      },
      {
        category: 'Role Management',
        permissions: [
          { id: 'roles.view', name: 'View Roles', description: 'View role list and details' },
          { id: 'roles.create', name: 'Create Roles', description: 'Add new roles' },
          { id: 'roles.edit', name: 'Edit Roles', description: 'Modify role permissions' },
          { id: 'roles.delete', name: 'Delete Roles', description: 'Remove roles' },
        ]
      },
      {
        category: 'Patient Management',
        permissions: [
          { id: 'patients.view', name: 'View Patients', description: 'View patient list and details' },
          { id: 'patients.create', name: 'Create Patients', description: 'Add new patient records' },
          { id: 'patients.edit', name: 'Edit Patients', description: 'Modify patient information' },
          { id: 'patients.delete', name: 'Delete Patients', description: 'Remove patient records' },
        ]
      },
      {
        category: 'Doctor Management',
        permissions: [
          { id: 'doctors.view', name: 'View Doctors', description: 'View doctor list and details' },
          { id: 'doctors.create', name: 'Create Doctors', description: 'Add new doctor profiles' },
          { id: 'doctors.edit', name: 'Edit Doctors', description: 'Modify doctor information' },
          { id: 'doctors.delete', name: 'Delete Doctors', description: 'Remove doctor profiles' },
          { id: 'doctors.schedule', name: 'Manage Schedules', description: 'Manage doctor schedules and time slots' },
        ]
      },
      {
        category: 'Appointment Management',
        permissions: [
          { id: 'appointments.view', name: 'View Appointments', description: 'View appointment list and details' },
          { id: 'appointments.create', name: 'Create Appointments', description: 'Schedule new appointments' },
          { id: 'appointments.edit', name: 'Edit Appointments', description: 'Modify appointment details' },
          { id: 'appointments.cancel', name: 'Cancel Appointments', description: 'Cancel appointments' },
          { id: 'appointments.complete', name: 'Complete Appointments', description: 'Mark appointments as completed' },
        ]
      },
      {
        category: 'Financial Management',
        permissions: [
          { id: 'payments.view', name: 'View Payments', description: 'View payment history and details' },
          { id: 'payments.create', name: 'Process Payments', description: 'Process and record payments' },
          { id: 'payments.refund', name: 'Process Refunds', description: 'Issue payment refunds' },
          { id: 'invoices.view', name: 'View Invoices', description: 'View invoice list and details' },
          { id: 'invoices.create', name: 'Create Invoices', description: 'Generate new invoices' },
        ]
      },
      {
        category: 'Communication',
        permissions: [
          { id: 'notifications.manage', name: 'Manage Notifications', description: 'Create and manage notifications' },
        ]
      },
      {
        category: 'Analytics & Reports',
        permissions: [
          { id: 'analytics.view', name: 'View Analytics', description: 'Access dashboard analytics' },
          { id: 'reports.generate', name: 'Generate Reports', description: 'Create and export reports' },
        ]
      },
      {
        category: 'System Administration',
        permissions: [
          { id: 'system.settings', name: 'System Settings', description: 'Manage system configuration' },
          { id: 'system.backup', name: 'System Backup', description: 'Perform system backups' },
          { id: 'system.maintenance', name: 'System Maintenance', description: 'Perform system maintenance' },
        ]
      }
    ];

    res.json({
      success: true,
      data: permissionCategories,
      message: 'Available permissions retrieved successfully'
    });
  } catch (err) {
    console.error('Error fetching permissions:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch available permissions',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};
