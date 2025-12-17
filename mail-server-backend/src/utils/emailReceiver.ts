import Imap from 'imap';
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
  private imap: Imap;

  constructor(config: EmailConfig) {
    this.imap = new Imap({
      user: config.user,
      password: config.password,
      host: config.host,
      port: config.port,
      tls: config.tls,
      ...(config.tlsOptions && { tlsOptions: config.tlsOptions })
    });
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.imap.once('ready', () => {
        console.log('IMAP connection established');
        resolve();
      });

      this.imap.once('error', (err: Error) => {
        console.error('IMAP connection error:', err);
        reject(err);
      });

      this.imap.connect();
    });
  }

  disconnect(): void {
    if (this.imap && this.imap.state !== 'disconnected') {
      this.imap.end();
    }
  }

  async fetchUnreadEmails(userId: number): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const emails: any[] = [];

      this.imap.openBox('INBOX', false, (err: Error, box: any) => {
        if (err) {
          reject(err);
          return;
        }

        const fetch = this.imap.seq.fetch(`${box.messages.total}:*`, {
          bodies: '',
          struct: true
        });

        fetch.on('message', (msg: any, seqno: number) => {
          msg.on('body', (stream: any, info: any) => {
            let buffer = '';
            stream.on('data', (chunk: any) => {
              buffer += chunk.toString('utf8');
            });

            stream.once('end', async () => {
              try {
                const parsed = await simpleParser(buffer);
                emails.push({
                  userId,
                  messageId: parsed.messageId || '',
                  from: parsed.from?.text || '',
                  subject: parsed.subject || '(No Subject)',
                  body: parsed.text || parsed.html || '',
                  date: parsed.date || new Date(),
                });
              } catch (parseErr) {
                console.error('Error parsing email:', parseErr);
              }
            });
          });
        });

        fetch.once('error', (err: Error) => {
          console.error('Fetch error:', err);
          reject(err);
        });

        fetch.once('end', () => {
          console.log('Done fetching all messages!');
          resolve(emails);
        });
      });
    });
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
            toAddress: emailData.to,
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