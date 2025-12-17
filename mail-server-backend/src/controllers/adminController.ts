import { Request, Response } from 'express';
import { Op } from 'sequelize';
import bcrypt from 'bcryptjs';
import User from '../models/User';
import Email from '../models/Email';
import sequelize from '../config/db';

export const getUsers = async (req: Request, res: Response): Promise<Response> => {
  try {
    // Get all users except the current admin
    const users = await User.findAll({
      attributes: { exclude: ['password'] }, // Exclude passwords
      where: {
        id: {
          [Op.ne]: req.user.id, // Not equal to current user
        },
      },
    });

    return res.status(200).json({
      users,
    });
  } catch (error) {
    console.error('Get users error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const getUserById = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { id } = req.params;

    // Find user by ID
    const user = await User.findByPk(id, {
      attributes: { exclude: ['password'] }, // Exclude password
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.status(200).json({
      user,
    });
  } catch (error) {
    console.error('Get user by ID error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateUserRole = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    // Validate role
    if (!role || !['admin', 'user'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role parameter' });
    }

    // Find user by ID
    const user = await User.findByPk(id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent user from changing their own role
    if (user.id === req.user.id) {
      return res.status(400).json({ message: 'Cannot change your own role' });
    }

    // Update user role
    await user.update({ role });

    return res.status(200).json({
      message: 'User role updated successfully',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Update user role error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const deactivateUser = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { id } = req.params;

    // Find user by ID
    const user = await User.findByPk(id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent user from deactivating themselves
    if (user.id === req.user.id) {
      return res.status(400).json({ message: 'Cannot deactivate your own account' });
    }

    // Deactivate user
    await user.update({ isActive: false });

    return res.status(200).json({
      message: 'User deactivated successfully',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        isActive: user.isActive,
      },
    });
  } catch (error) {
    console.error('Deactivate user error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const getSystemStats = async (req: Request, res: Response): Promise<Response> => {
  try {
    // Get system statistics
    const totalUsers = await User.count();
    const totalEmails = await Email.count();
    const activeUsers = await User.count({
      where: {
        isActive: true,
      },
    });

    return res.status(200).json({
      stats: {
        totalUsers,
        totalEmails,
        activeUsers,
      },
    });
  } catch (error) {
    console.error('Get system stats error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const createUser = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { username, email, password, role, domain, isDefaultDomain } = req.body;

    // Validate input
    if (!username || !email || !password) {
      return res.status(400).json({ message: 'Username, email, and password are required' });
    }

    // Validate role
    if (role && !['admin', 'user'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role parameter' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      where: {
        email: email,
      },
    });

    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user
    const user = await User.create({
      username,
      email,
      password: hashedPassword,
      role: role || 'user', // Default to 'user' if not specified
      isActive: true, // Default active status
      domain: domain || null,
      isDefaultDomain: isDefaultDomain || false,
    });

    // Return user data without password
    const userData = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      domain: user.domain,
      isDefaultDomain: user.isDefaultDomain,
    };

    return res.status(201).json({
      message: 'User created successfully',
      user: userData,
    });
  } catch (error) {
    console.error('Create user error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// Bulk create users
export const bulkCreateUsers = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { users } = req.body;

    // Validate input
    if (!Array.isArray(users) || users.length === 0) {
      return res.status(400).json({ message: 'Users array is required and cannot be empty' });
    }

    // Validate each user
    for (const user of users) {
      if (!user.username || !user.email || !user.password) {
        return res.status(400).json({ 
          message: 'Each user must have username, email, and password',
          user: user
        });
      }

      // Validate role if provided
      if (user.role && !['admin', 'user'].includes(user.role)) {
        return res.status(400).json({ 
          message: 'Invalid role parameter',
          user: user
        });
      }
    }

    // Check for existing users
    const emails = users.map(user => user.email);
    const existingUsers = await User.findAll({
      where: {
        email: {
          [Op.in]: emails
        }
      }
    });

    if (existingUsers.length > 0) {
      const existingEmails = existingUsers.map(user => user.email);
      return res.status(400).json({ 
        message: 'Some users with these emails already exist',
        existingEmails: existingEmails
      });
    }

    // Hash passwords and prepare user data
    const usersToCreate = [];
    for (const user of users) {
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(user.password, saltRounds);
      
      usersToCreate.push({
        username: user.username,
        email: user.email,
        password: hashedPassword,
        role: user.role || 'user',
        isActive: true,
        domain: user.domain || null,
        isDefaultDomain: user.isDefaultDomain || false,
      });
    }

    // Create all users
    const createdUsers = await User.bulkCreate(usersToCreate);

    // Return user data without passwords
    const userData = createdUsers.map(user => ({
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      domain: user.domain,
      isDefaultDomain: user.isDefaultDomain,
    }));

    return res.status(201).json({
      message: `${createdUsers.length} users created successfully`,
      users: userData,
    });
  } catch (error) {
    console.error('Bulk create users error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// Get all domains
export const getDomains = async (req: Request, res: Response): Promise<Response> => {
  try {
    // Get all unique domains
    const domains = await User.findAll({
      attributes: [
        [sequelize.fn('DISTINCT', sequelize.col('domain')), 'domain'],
        'isDefaultDomain'
      ],
      where: {
        domain: {
          [Op.not]: null
        }
      } as any
    });

    return res.status(200).json({
      domains: domains.map(d => ({
        domain: d.getDataValue('domain'),
        isDefault: d.getDataValue('isDefaultDomain')
      }))
    });
  } catch (error) {
    console.error('Get domains error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// Set default domain
export const setDefaultDomain = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { domain } = req.body;

    // Validate input
    if (!domain) {
      return res.status(400).json({ message: 'Domain is required' });
    }

    // First unset any existing default domain
    await User.update(
      { isDefaultDomain: false },
      { where: { isDefaultDomain: true } }
    );

    // Set the new default domain
    await User.update(
      { isDefaultDomain: true },
      { where: { domain: domain } }
    );

    return res.status(200).json({
      message: `Default domain set to ${domain}`
    });
  } catch (error) {
    console.error('Set default domain error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};