import dotenv from 'dotenv';

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