import { Request, Response } from 'express';
import Mailbox from '../models/Mailbox';
import Emails from '../models/Emails';
import { notifyNewEmail } from '../server';

// Extend the Request type to include user property
interface AuthRequest extends Request {
  user?: {
    id: string;
  };
}

/**
 * Get all emails for the authenticated user in real-time
 */
export const getUserEmails = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Get emails for the authenticated user
    const emails = await Mailbox.find({ 
      recipientId: req.user.id 
    }).sort({ createdAt: -1 });

    return res.status(200).json({
      emails,
    });
  } catch (error) {
    console.error('Get emails error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Get a specific email by ID for the authenticated user
 */
export const getUserEmailById = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { id } = req.params;
    
    // Find email that belongs to the user
    const email = await Mailbox.findOne({
      _id: id,
      recipientId: req.user.id
    }).populate('senderId', 'username email');

    if (!email) {
      return res.status(404).json({ message: 'Email not found' });
    }

    // Mark as read when opened
    if (!email.isRead) {
      await Mailbox.findByIdAndUpdate(id, { isRead: true });
    }

    return res.status(200).json({
      email,
    });
  } catch (error) {
    console.error('Get email by ID error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Simulate real-time email checking (for demonstration purposes)
 * In a real implementation, this would be triggered by actual email arrival
 */
export const checkNewEmails = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // In a real implementation, this would check for new emails from an external source
    // For now, we'll just return the current emails
    const emails = await Mailbox.find({ 
      recipientId: req.user.id 
    }).sort({ createdAt: -1 });

    return res.status(200).json({
      emails,
      checkedAt: new Date()
    });
  } catch (error) {
    console.error('Check emails error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
