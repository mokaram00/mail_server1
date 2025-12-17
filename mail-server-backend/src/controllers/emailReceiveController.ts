import { Request, Response } from 'express';
import EmailReceiver from '../utils/emailReceiver';
import User from '../models/User';
import dotenv from 'dotenv';

dotenv.config();

export const receiveEmails = async (req: Request, res: Response): Promise<Response> => {
  try {
    const userId = req.user.id;
    
    // Get user details
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get IMAP configuration from user settings or environment variables
    const imapConfig = {
      user: user.getDataValue('imapUser') || process.env.IMAP_USER || user.email,
      password: user.getDataValue('imapPassword') || process.env.IMAP_PASSWORD || '',
      host: user.getDataValue('imapHost') || process.env.IMAP_HOST || 'imap.gmail.com',
      port: user.getDataValue('imapPort') || parseInt(process.env.IMAP_PORT || '993'),
      tls: (user.getDataValue('imapTLS') !== undefined ? user.getDataValue('imapTLS') : process.env.IMAP_TLS !== 'false') as boolean,
      tlsOptions: {
        rejectUnauthorized: process.env.IMAP_REJECT_UNAUTHORIZED !== 'false'
      }
    };

    // Create email receiver instance
    const emailReceiver = new EmailReceiver(imapConfig);

    try {
      // Connect to IMAP server
      await emailReceiver.connect();
      
      // Fetch unread emails
      const emails = await emailReceiver.fetchUnreadEmails(userId);
      
      // Save emails to database
      await emailReceiver.saveEmailsToDatabase(emails);
      
      // Disconnect from IMAP server
      emailReceiver.disconnect();
      
      return res.status(200).json({
        message: `Successfully fetched and saved ${emails.length} emails`,
        emailsReceived: emails.length
      });
    } catch (imapError) {
      console.error('IMAP error:', imapError);
      emailReceiver.disconnect();
      return res.status(500).json({ 
        message: 'Failed to connect to email server',
        error: imapError instanceof Error ? imapError.message : 'Unknown error'
      });
    }
  } catch (error) {
    console.error('Receive emails error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const configureEmailAccount = async (req: Request, res: Response): Promise<Response> => {
  try {
    const userId = req.user.id;
    const { imapHost, imapPort, imapUser, imapPassword, imapTLS } = req.body;
    
    // Validate input
    if (!imapHost || !imapPort || !imapUser || !imapPassword) {
      return res.status(400).json({ message: 'All IMAP configuration fields are required' });
    }
    
    // Update user with email configuration
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    await user.update({
      imapHost,
      imapPort,
      imapUser,
      imapPassword,
      imapTLS
    });
    
    return res.status(200).json({
      message: 'Email account configuration saved successfully'
    });
  } catch (error) {
    console.error('Configure email error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};