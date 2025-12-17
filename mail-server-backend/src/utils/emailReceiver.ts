import Pop3Client from 'pop3';
import { simpleParser } from 'mailparser';
import Email from '../models/Email';
import User from '../models/User';
import dotenv from 'dotenv';

dotenv.config();

interface EmailConfig {
  user: string;
  password: string;
  host: string;
  port: number;
  tls: boolean;
  tlsOptions?: {
    rejectUnauthorized: boolean;
  };
}

class EmailReceiver {
  private config: EmailConfig;
  private pop3: any;

  constructor(config: EmailConfig) {
    this.config = config;
  }

  async connect(): Promise<void> {
    try {
      this.pop3 = new Pop3Client({
        hostname: this.config.host,
        port: this.config.port,
        tls: this.config.tls,
        ...(this.config.tlsOptions && { tlsOptions: this.config.tlsOptions })
      });
      
      await this.pop3.login(this.config.user, this.config.password);
      console.log('POP3 connection established');
    } catch (error) {
      console.error('POP3 connection error:', error);
      throw error;
    }
  }

  disconnect(): void {
    if (this.pop3) {
      this.pop3.quit();
    }
  }

  async fetchUnreadEmails(userId: number): Promise<any[]> {
    try {
      const emails: any[] = [];
      
      // Get list of messages
      const list = await this.pop3.list();
      
      // Process each message
      for (const item of list) {
        try {
          // Retrieve message content
          const message = await this.pop3.retrieve(item.number);
          
          // Parse the email
          const parsed = await simpleParser(message);
          
          emails.push({
            userId,
            messageId: parsed.messageId || '',
            from: parsed.from?.text || '',
            subject: parsed.subject || '(No Subject)',
            body: parsed.text || parsed.html || '',
            date: parsed.date || new Date(),
          });
          
          // Mark message for deletion (POP3 behavior)
          await this.pop3.delete(item.number);
        } catch (parseErr) {
          console.error('Error parsing email:', parseErr);
        }
      }
      
      console.log('Done fetching all messages!');
      return emails;
    } catch (error) {
      console.error('Fetch error:', error);
      throw error;
    }
  }

  async saveEmailsToDatabase(emails: any[]): Promise<void> {
    for (const emailData of emails) {
      try {
        // Check if email already exists
        const existingEmail = await Email.findOne({
          where: {
            subject: emailData.subject,
            body: emailData.body.substring(0, 100) // Compare first 100 chars
          }
        });

        if (!existingEmail) {
          // Create new email record
          await Email.create({
            senderId: emailData.userId, // For received emails, we'll use the user as sender for now
            recipientId: emailData.userId,
            subject: emailData.subject,
            body: emailData.body,
            isRead: false,
            isStarred: false,
            folder: 'inbox',
            messageId: emailData.messageId,
            fromAddress: emailData.from,
            // toAddress is not available in POP3
            receivedAt: emailData.date
          });
          console.log(`Saved email: ${emailData.subject}`);
        }
      } catch (error) {
        console.error('Error saving email to database:', error);
      }
    }
  }
}

export default EmailReceiver;