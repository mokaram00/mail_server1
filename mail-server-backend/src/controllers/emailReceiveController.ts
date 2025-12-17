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

    // Get POP3 configuration from user settings or environment variables
    const pop3Config = {
      user: user.getDataValue('pop3User') || process.env.POP3_USER || user.email,
      password: user.getDataValue('pop3Password') || process.env.POP3_PASSWORD || '',
      host: user.getDataValue('pop3Host') || process.env.POP3_HOST || 'pop.gmail.com',
      port: user.getDataValue('pop3Port') || parseInt(process.env.POP3_PORT || '995'),
      tls: (user.getDataValue('pop3TLS') !== undefined ? user.getDataValue('pop3TLS') : process.env.POP3_TLS !== 'false') as boolean,
      tlsOptions: {
        rejectUnauthorized: process.env.POP3_REJECT_UNAUTHORIZED !== 'false'
      }
    };

    // Create email receiver instance
    const emailReceiver = new EmailReceiver(pop3Config);

    try {
      // Connect to POP3 server
      await emailReceiver.connect();
      
      // Fetch unread emails
      const emails = await emailReceiver.fetchUnreadEmails(userId);
      
      // Save emails to database
      await emailReceiver.saveEmailsToDatabase(emails);
      
      // Disconnect from POP3 server
      emailReceiver.disconnect();
      
      return res.status(200).json({
        message: `Successfully fetched and saved ${emails.length} emails`,
        emailsReceived: emails.length
      });
    } catch (pop3Error) {
      console.error('POP3 error:', pop3Error);
      emailReceiver.disconnect();
      return res.status(500).json({ 
        message: 'Failed to connect to email server',
        error: pop3Error instanceof Error ? pop3Error.message : 'Unknown error'
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
    const { pop3Host, pop3Port, pop3User, pop3Password, pop3TLS } = req.body;
    
    // Validate input
    if (!pop3Host || !pop3Port || !pop3User || !pop3Password) {
      return res.status(400).json({ message: 'All POP3 configuration fields are required' });
    }
    
    // Update user with email configuration
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    await user.update({
      pop3Host,
      pop3Port,
      pop3User,
      pop3Password,
      pop3TLS
    });
    
    return res.status(200).json({
      message: 'Email account configuration saved successfully'
    });
  } catch (error) {
    console.error('Configure email error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};