import dotenv from 'dotenv';
import User from './models/User';
import Email from './models/Email';
import bcrypt from 'bcryptjs';

// Load environment variables
dotenv.config();

// Import POP3Server using require since it's a JavaScript module
const POP3Server = require('./pop3/server');

// Function to start the POP3 server
export const startPop3Server = () => {
  try {
    // Configuration for the POP3 server
    const pop3Config = {
      host: process.env.INTERNAL_POP3_HOST || '0.0.0.0',
      port: parseInt(process.env.INTERNAL_POP3_PORT || '110'),
      secure: process.env.INTERNAL_POP3_TLS === 'true',
      cert: process.env.INTERNAL_POP3_CERT_PATH || undefined,
      key: process.env.INTERNAL_POP3_KEY_PATH || undefined
    };

    // Create and start the POP3 server
    const server = new POP3Server({
      secure: pop3Config.secure,
      sniOptions: {
        '*': {
          cert: pop3Config.cert,
          key: pop3Config.key
        }
      },
      // Authentication handler
      async onAuth(auth: any, session: any, callback: (err: Error | null, response?: any) => void) {
        try {
          // Find user by email
          const user = await User.findOne({ 
            email: auth.username 
          });

          if (!user) {
            return callback(new Error('Invalid username or password'));
          }

          // Check password using bcrypt
          const isPasswordValid = await bcrypt.compare(auth.password, user.pop3Password);
          if (!isPasswordValid) {
            return callback(new Error('Invalid username or password'));
          }

          // Authentication successful
          session.user = {
            id: user._id,
            username: user.email,
            email: user.email
          };

          return callback(null, {
            user: session.user
          });
        } catch (error) {
          console.error('Authentication error:', error);
          return callback(error as Error);
        }
      },

      // Message listing handler
      async onListMessages(session: any, callback: (err: Error | null, response?: any) => void) {
        try {
          if (!session.user) {
            return callback(new Error('Not authenticated'));
          }

          // Find emails for this user in inbox
          const emails = await Email.find({
            recipientId: session.user.id,
            folder: 'inbox'
          }).sort({ receivedAt: -1 });

          // Format messages for POP3
          const messages = emails.map((email: any, index: number) => {
            return {
              id: email._id.toString(),
              uid: email._id.toString(),
              size: email.body.length + (email.subject?.length || 0) + 100, // Approximate size
              seen: email.isRead || false
            };
          });

          const totalSize = messages.reduce((sum: number, msg: any) => sum + msg.size, 0);

          return callback(null, {
            messages: messages,
            count: messages.length,
            size: totalSize
          });
        } catch (error) {
          console.error('Error listing messages:', error);
          return callback(error as Error);
        }
      },

      // Fetch message handler
      async onFetchMessage(message: any, session: any, callback: (err: Error | null, response?: any) => void) {
        try {
          if (!session.user) {
            return callback(new Error('Not authenticated'));
          }

          // Find the email
          const email = await Email.findById(message.id);

          if (!email) {
            return callback(new Error('Message not found'));
          }

          // Check if user has access to this email
          if (email.recipientId.toString() !== session.user.id) {
            return callback(new Error('Access denied'));
          }

          // Create email content
          const emailContent = [
            `From: ${email.fromAddress || 'unknown@example.com'}`,
            `To: ${email.toAddress || session.user.email}`,
            `Subject: ${email.subject || '(no subject)'}`,
            `Date: ${email.receivedAt?.toUTCString() || new Date().toUTCString()}`,
            '',
            email.body || ''
          ].join('\r\n');

          // Convert to readable stream
          const { Readable } = require('stream');
          const stream = new Readable();
          stream.push(emailContent);
          stream.push(null); // End of stream

          return callback(null, stream);
        } catch (error) {
          console.error('Error fetching message:', error);
          return callback(error as Error);
        }
      }
    });

    // Listen on the configured port
    server.listen(pop3Config.port, pop3Config.host, () => {
      console.log(`POP3 server listening on ${pop3Config.host}:${pop3Config.port}`);
    });

    // Handle server events
    server.on('listening', () => {
      console.log('POP3 server is listening for connections');
    });

    server.on('close', () => {
      console.log('POP3 server closed');
    });

    server.on('error', (err: Error) => {
      console.error('POP3 server error:', err);
    });

    return server;
  } catch (error) {
    console.error('Failed to start POP3 server:', error);
    throw error;
  }
};

// Export default for compatibility
export default { startPop3Server };