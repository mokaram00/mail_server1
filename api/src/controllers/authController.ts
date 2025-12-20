import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Emails from '../models/Emails';

// Extend the Request type to include user property
interface AuthRequest extends Request {
  user?: {
    id: string;
    role: string;
  };
}

export const login = async (req: Request, res: Response, next: NextFunction): Promise<Response> => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Find user by email
    const user = await Emails.findOne({
      email: email,
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(400).json({ message: 'Account is deactivated' });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'fallback_secret_key',
      { expiresIn: '24h' }
    );

    // Set inbox token in cookie with proper domain
    res.cookie('inbox_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      sameSite: 'none',
    });

    // Return user data without password
    const userData = {
      id: user._id,
      username: user.username,
      email: user.email,
    };

    // Removed setCORSHeaders call as it's now handled by the global CORS middleware

    return res.status(200).json({
      message: 'Login successful',
      user: userData,
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const getProfile = async (req: AuthRequest, res: Response, next: NextFunction): Promise<Response> => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const user = await Emails.findById(req.user.id).select('-password'); // Exclude password from response

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Removed setCORSHeaders call as it's now handled by the global CORS middleware

    return res.status(200).json({
      user,
    });
  } catch (error) {
    console.error('Get profile error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const logout = async (req: Request, res: Response, next: NextFunction): Promise<Response> => {
  try {
    // Clear the inbox token cookie
    res.clearCookie('inbox_token', {
      domain: 'inbox.bltnm.store'
    });
    
    // Removed setCORSHeaders call as it's now handled by the global CORS middleware
    
    return res.status(200).json({
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Logout error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};