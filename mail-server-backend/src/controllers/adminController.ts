import { Request, Response } from 'express';
import { Op } from 'sequelize';
import User from '../models/User';
import Email from '../models/Email';

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