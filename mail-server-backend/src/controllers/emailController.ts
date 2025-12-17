import { Request, Response } from 'express';
import { Op } from 'sequelize';
import Email from '../models/Email';
import User from '../models/User';

export const sendEmail = async (req: Request, res: Response): Promise<Response> => {
  try {
    return res.status(403).json({ 
      message: 'Sending emails is disabled on this server. This server only receives emails.',
      error: 'SENDING_DISABLED'
    });
  } catch (error) {
    console.error('Send email error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const getEmails = async (req: Request, res: Response): Promise<Response> => {
  try {
    const userId = req.user.id;
    const folder = req.query.folder as string || 'inbox';

    // Validate folder parameter
    const validFolders = ['inbox', 'sent', 'drafts', 'trash'];
    if (!validFolders.includes(folder)) {
      return res.status(400).json({ message: 'Invalid folder parameter' });
    }

    // Get emails based on folder and user
    const emails = await Email.findAll({
      where: {
        [folder === 'sent' ? 'senderId' : 'recipientId']: userId,
        folder: folder,
      },
      include: [
        {
          model: User,
          as: 'sender',
          attributes: ['id', 'username', 'email'],
        },
        {
          model: User,
          as: 'recipient',
          attributes: ['id', 'username', 'email'],
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    return res.status(200).json({
      emails,
    });
  } catch (error) {
    console.error('Get emails error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const getEmailById = async (req: Request, res: Response): Promise<Response> => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    // Find email by ID and ensure user has access
    const email = await Email.findOne({
      where: {
        id,
        [Op.or]: [{ senderId: userId }, { recipientId: userId }],
      },
      include: [
        {
          model: User,
          as: 'sender',
          attributes: ['id', 'username', 'email'],
        },
        {
          model: User,
          as: 'recipient',
          attributes: ['id', 'username', 'email'],
        },
      ],
    });

    if (!email) {
      return res.status(404).json({ message: 'Email not found' });
    }

    // Mark as read if recipient is viewing
    if (email.recipientId === userId && !email.isRead) {
      await email.update({ isRead: true });
    }

    return res.status(200).json({
      email,
    });
  } catch (error) {
    console.error('Get email by ID error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateEmail = async (req: Request, res: Response): Promise<Response> => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { isStarred, folder } = req.body;

    // Find email by ID and ensure user has access
    const email = await Email.findOne({
      where: {
        id,
        [Op.or]: [{ senderId: userId }, { recipientId: userId }],
      },
    });

    if (!email) {
      return res.status(404).json({ message: 'Email not found' });
    }

    // Update email
    const updates: any = {};
    if (isStarred !== undefined) updates.isStarred = isStarred;
    if (folder) {
      // Validate folder parameter
      const validFolders = ['inbox', 'sent', 'drafts', 'trash'];
      if (!validFolders.includes(folder)) {
        return res.status(400).json({ message: 'Invalid folder parameter' });
      }
      updates.folder = folder;
    }

    await email.update(updates);

    return res.status(200).json({
      message: 'Email updated successfully',
      email,
    });
  } catch (error) {
    console.error('Update email error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};