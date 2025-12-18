import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import MagicLink from '../models/MagicLink';
import crypto from 'crypto';

// Generate a magic link for a user
export const generateMagicLink = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { email } = req.body;

    // Validate input
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    // Find user by email
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(400).json({ message: 'Account is deactivated' });
    }

    // Generate a unique token
    const token = crypto.randomBytes(32).toString('hex');
    
    // Set expiration to 1 year from now
    const expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);

    // Create or update magic link
    const magicLink = new MagicLink({
      userId: user._id,
      token,
      expiresAt
    });
    
    await magicLink.save();

    // Generate the magic link URL
    const magicLinkUrl = `${process.env.FRONTEND_URL}/magic-login?token=${token}`;

    // In a real application, you would send this link via email
    // For now, we'll just return it in the response
    return res.status(200).json({
      message: 'Magic link generated successfully',
      magicLink: magicLinkUrl,
      token, // For testing purposes only
      expiresAt
    });
  } catch (error) {
    console.error('Generate magic link error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// Verify a magic link and log in the user
export const verifyMagicLink = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { token } = req.body;

    // Validate input
    if (!token) {
      return res.status(400).json({ message: 'Token is required' });
    }

    // Find magic link by token
    const magicLink = await MagicLink.findOne({ token });
    
    if (!magicLink) {
      return res.status(404).json({ message: 'Invalid or expired magic link' });
    }

    // Check if the link has been used
    if (magicLink.used) {
      return res.status(400).json({ message: 'This magic link has already been used' });
    }

    // Check if the link has expired
    if (magicLink.expiresAt < new Date()) {
      return res.status(400).json({ message: 'This magic link has expired' });
    }

    // Find user by userId
    const user = await User.findById(magicLink.userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(400).json({ message: 'Account is deactivated' });
    }

    // Mark the magic link as used
    magicLink.used = true;
    await magicLink.save();

    // Generate JWT token
    const jwtToken = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'fallback_secret_key',
      { expiresIn: '24h' }
    );

    // Set token in cookie
    res.cookie('token', jwtToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      sameSite: 'strict'
    });

    return res.status(200).json({
      message: 'Login successful',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        isActive: user.isActive,
        domain: user.domain,
        accountClassification: user.accountClassification,
      },
      token: jwtToken
    });
  } catch (error) {
    console.error('Verify magic link error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};