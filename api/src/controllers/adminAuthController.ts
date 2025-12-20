import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Admin from '../models/Admin';

// Extend the Request type to include admin property
interface AdminAuthRequest extends Request {
  admin?: {
    id: string;
    role: string;
  };
}

export const adminLogin = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Find admin by email
    const admin = await Admin.findOne({
      email: email,
    });

    if (!admin) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    // Check if admin is active
    if (!admin.isActive) {
      return res.status(400).json({ message: 'Account is deactivated' });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, admin.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { adminId: admin._id, role: admin.role },
      process.env.JWT_SECRET || 'fallback_secret_key',
      { expiresIn: '24h' }
    );

    // Set admin token in cookie with proper domain configuration
    res.cookie('admin_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      sameSite: 'none',
    });

    // Return admin data without password
    const adminData = {
      id: admin._id,
      username: admin.username,
      email: admin.email,
      role: admin.role,
    };

    return res.status(200).json({
      message: 'Admin login successful',
      admin: adminData,
    });
  } catch (error) {
    console.error('Admin login error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const getAdminProfile = async (req: AdminAuthRequest, res: Response): Promise<Response> => {
  try {
    if (!req.admin) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const admin = await Admin.findById(req.admin.id).select('-password'); // Exclude password from response

    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    // Check if admin is active
    if (!admin.isActive) {
      return res.status(403).json({ message: 'Admin account is deactivated' });
    }

    return res.status(200).json({
      admin,
    });
  } catch (error) {
    console.error('Get admin profile error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateAdminProfile = async (req: AdminAuthRequest, res: Response): Promise<Response> => {
  try {
    if (!req.admin) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { username, email } = req.body;

    // Validate input
    if (!username || !email) {
      return res.status(400).json({ message: 'Username and email are required' });
    }

    // Find admin by ID
    const admin = await Admin.findById(req.admin.id);

    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    // Check if email is already taken by another admin
    if (email !== admin.email) {
      const existingAdmin = await Admin.findOne({ email });
      if (existingAdmin && existingAdmin._id.toString() !== admin._id.toString()) {
        return res.status(400).json({ message: 'Email is already taken' });
      }
    }

    // Update admin
    admin.username = username;
    admin.email = email;
    await admin.save();

    // Return updated admin data without password
    const adminData = {
      id: admin._id,
      username: admin.username,
      email: admin.email,
      role: admin.role,
    };

    return res.status(200).json({
      message: 'Profile updated successfully',
      admin: adminData,
    });
  } catch (error) {
    console.error('Update admin profile error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const adminLogout = async (req: Request, res: Response): Promise<Response> => {
  try {
    // Clear the admin token cookie with proper domain
    res.clearCookie('admin_token', {
      domain: 'admin.bltnm.store'  // Changed from 'admin.bltnm.store' to '.bltnm.store'
    });
    
    return res.status(200).json({
      message: 'Admin logged out successfully'
    });
  } catch (error) {
    console.error('Admin logout error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateAdminPassword = async (req: AdminAuthRequest, res: Response): Promise<Response> => {
  try {
    if (!req.admin) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { currentPassword, newPassword } = req.body;

    // Validate input
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current password and new password are required' });
    }

    // Check password length
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    // Find admin by ID
    const admin = await Admin.findById(req.admin.id);

    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    // Check current password
    const isPasswordValid = await bcrypt.compare(currentPassword, admin.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    // Hash new password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    admin.password = hashedPassword;
    await admin.save();

    return res.status(200).json({
      message: 'Password updated successfully'
    });
  } catch (error) {
    console.error('Update admin password error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};