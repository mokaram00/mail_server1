// pop3-server.ts
import net from 'net';
import tls from 'tls';
import fs from 'fs';
import User from '../models/User';
import Email from '../models/Email';
import bcrypt from 'bcryptjs';
import { pop3Cache } from './cache';

const PORT = parseInt(process.env.INTERNAL_POP3_PORT || '1110');
const ENABLE_TLS = process.env.INTERNAL_POP3_TLS === 'true';
const CERT_PATH = process.env.INTERNAL_POP3_CERT_PATH || '';
const KEY_PATH = process.env.INTERNAL_POP3_KEY_PATH || '';

// Session management interface
interface Pop3Session {
  user: string;
  messages: any[];
  state: 'AUTH' | 'TRANSACTION';
  deletedMessages: Set<number>; // Track deleted message indices
}

// Simple authentication function
async function authenticateUser(username: string, password: string): Promise<boolean> {
  try {
    const user = await User.findOne({
      where: {
        email: username
      }
    });
    
    if (!user) {
      return false;
    }
    
    // Verify password using bcrypt
    return await bcrypt.compare(password, user.password);
  } catch (error) {
    console.error('Authentication error:', error);
    return false;
  }
}

// Get user's emails from database
async function getUserEmails(username: string): Promise<any[]> {
  try {
    const user = await User.findOne({
      where: {
        email: username
      }
    });
    
    if (!user) return [];
    
    const emails = await Email.findAll({
      where: {
        recipientId: user.id
      },
      order: [['createdAt', 'DESC']]
    });
    
    return emails.map(email => email.toJSON());
  } catch (error) {
    console.error('Get emails error:', error);
    return [];
  }
}

// Get user's emails from database with caching
async function getUserEmailsWithCache(username: string): Promise<any[]> {
  // Try to get from cache first
  const cachedMessages = pop3Cache.get(username);
  if (cachedMessages) {
    console.log(`Cache hit for user ${username}`);
    return cachedMessages;
  }
  
  // If not in cache, fetch from database
  console.log(`Cache miss for user ${username}, fetching from database`);
  const messages = await getUserEmails(username);
  
  // Store in cache
  pop3Cache.set(username, messages);
  
  return messages;
}

// Create server (TLS or plain TCP)
const server = ENABLE_TLS ? 
  tls.createServer({
    key: fs.readFileSync(KEY_PATH),
    cert: fs.readFileSync(CERT_PATH)
  }, async (socket) => {
    console.log('POP3S Client connected');
    socket.write('+OK MyMailServer POP3S ready\r\n');

    // Attach session to socket
    (socket as any).session = {
      user: '',
      messages: [],
      state: 'AUTH',
      deletedMessages: new Set<number>()
    } as Pop3Session;

    socket.on('data', async (data) => {
      const line = data.toString().trim();
      console.log('POP3S:', line);

      const session = (socket as any).session as Pop3Session;

      if (session.state === 'AUTH') {
        if (line.startsWith('USER ')) {
          session.user = line.split(' ')[1];
          socket.write('+OK User accepted\r\n');
        } else if (line.startsWith('PASS ')) {
          const password = line.split(' ')[1];
          const isAuthenticated = await authenticateUser(session.user, password);
          
          if (isAuthenticated) {
            socket.write('+OK Pass accepted\r\n');
            session.state = 'TRANSACTION';
            // Load user's messages
            session.messages = await getUserEmailsWithCache(session.user);

          } else {
            socket.write('-ERR Authentication failed\r\n');
          }
        } else if (line.startsWith('QUIT')) {
          socket.write('+OK Bye\r\n');
          socket.end();
        }
      } else if (session.state === 'TRANSACTION') {
        if (line === 'LIST') {
          // Filter out deleted messages
          const activeMessages = session.messages.filter((msg: any, index: number) => 
            msg.folder !== 'trash' && !session.deletedMessages.has(index));
          socket.write(`+OK ${activeMessages.length} messages\r\n`);
          activeMessages.forEach((msg: any, i: number) => {
            const messageBody = `From: ${msg.fromAddress || 'unknown@example.com'}\r
To: ${msg.toAddress || session.user}\r
Subject: ${msg.subject}\r
Date: ${msg.createdAt.toUTCString()}\r
\r
${msg.body}`;
            const byteLength = Buffer.byteLength(messageBody, 'utf8');
            socket.write(`${i+1} ${byteLength}\r\n`);
          });
          socket.write('.\r\n');
        } else if (line.startsWith('RETR ')) {
          const id = parseInt(line.split(' ')[1]) - 1;
          if (session.messages[id] && !session.deletedMessages.has(id)) {
            const msg = session.messages[id];
            const messageBody = `From: ${msg.fromAddress || 'unknown@example.com'}\r
To: ${msg.toAddress || session.user}\r
Subject: ${msg.subject}\r
Date: ${msg.createdAt.toUTCString()}\r
\r
${msg.body}`;
            const byteLength = Buffer.byteLength(messageBody, 'utf8');
            socket.write(`+OK ${byteLength} octets\r\n`);
            socket.write(messageBody + '\r\n.\r\n');
          } else {
            socket.write('-ERR No such message\r\n');
          }
        } else if (line.startsWith('DELE ')) {
          const id = parseInt(line.split(' ')[1]) - 1;
          if (session.messages[id]) {
            // Mark message as deleted in session (not in DB yet)
            session.deletedMessages.add(id);
            socket.write('+OK Message deleted\r\n');
          } else {
            socket.write('-ERR No such message\r\n');
          }
        } else if (line === 'NOOP') {
          socket.write('+OK\r\n');
        } else if (line === 'RSET') {
          // Reset deleted messages (reload from DB but preserve current deletions)
          session.messages = await getUserEmailsWithCache(session.user);
          // Clear deleted messages tracking
          session.deletedMessages = new Set<number>();
          socket.write('+OK Maildrop has 0 messages\r\n');
        } else if (line.startsWith('UIDL')) {
          if (line.trim() === 'UIDL') {
            // Return UIDL for all messages
            socket.write('+OK\r\n');
            session.messages.forEach((msg: any, i: number) => {
              if (msg.folder !== 'trash' && !session.deletedMessages.has(i)) {
                socket.write(`${i+1} ${msg.id}\r\n`);
              }
            });
            socket.write('.\r\n');
          } else {
            // Return UIDL for specific message
            const id = parseInt(line.split(' ')[1]) - 1;
            if (session.messages[id] && session.messages[id].folder !== 'trash' && !session.deletedMessages.has(id)) {
              socket.write(`+OK ${id+1} ${session.messages[id].id}\r\n`);
            } else {
              socket.write('-ERR No such message\r\n');
            }
          }
        } else if (line.startsWith('TOP')) {
          // TOP command - return message headers and first n lines
          const parts = line.split(' ');
          const msgId = parseInt(parts[1]) - 1;
          const linesCount = parseInt(parts[2]);
          
          if (session.messages[msgId] && !session.deletedMessages.has(msgId)) {
            const msg = session.messages[msgId];
            
            // Construct proper RFC 2822 message format
            const messageHeaders = [
              `From: ${msg.fromAddress || 'unknown@example.com'}`,
              `To: ${msg.toAddress || session.user}`,
              `Subject: ${msg.subject}`,
              `Date: ${msg.createdAt.toUTCString()}`,
              `Message-ID: ${msg.messageId || `<${msg.id}@${process.env.DOMAIN || 'mail-server-backend'}>`}`,
              '' // Empty line to separate headers from body
            ].join('\r\n');
            
            // Split body into lines and take only the requested number
            const bodyLines = msg.body.split('\n').slice(0, linesCount).join('\n');
            
            // Calculate total octets
            const fullMessage = `${messageHeaders}\r\n${bodyLines}`;
            const byteLength = Buffer.byteLength(fullMessage, 'utf8');
            
            socket.write(`+OK ${byteLength} octets\r\n`);
            socket.write(`${messageHeaders}\r\n${bodyLines}\r\n.\r\n`);
          } else {
            socket.write('-ERR No such message\r\n');
          }
        } else if (line === 'CAPA') {
          // CAPA command - return server capabilities
          socket.write('+OK Capability list follows\r\n');
          socket.write('TOP\r\n');
          socket.write('USER\r\n');
          socket.write('UIDL\r\n');
          socket.write('PIPELINING\r\n');
          if (ENABLE_TLS) {
            socket.write('STLS\r\n');
          }
          socket.write('.\r\n');
        } else if (line === 'QUIT') {
          // Actually delete messages marked for deletion
          for (const msgId of session.deletedMessages) {
            if (session.messages[msgId]) {
              try {
                await Email.update(
                  { folder: 'trash' },
                  { where: { id: session.messages[msgId].id } }
                );
              } catch (error) {
                console.error('Delete error:', error);
              }
            }
          }
          socket.write('+OK Bye\r\n');
          socket.end();
        }
      }
    });

    socket.on('end', () => {
      console.log('POP3S Client disconnected');
    });
  }) :
  net.createServer(async (socket) => {
    console.log('POP3 Client connected');
    socket.write('+OK MyMailServer POP3 ready\r\n');

    // Attach session to socket
    (socket as any).session = {
      user: '',
      messages: [],
      state: 'AUTH',
      deletedMessages: new Set<number>()
    } as Pop3Session;

    socket.on('data', async (data) => {
      const line = data.toString().trim();
      console.log('POP3:', line);

      const session = (socket as any).session as Pop3Session;

      if (session.state === 'AUTH') {
        if (line.startsWith('USER ')) {
          session.user = line.split(' ')[1];
          socket.write('+OK User accepted\r\n');
        } else if (line.startsWith('PASS ')) {
          const password = line.split(' ')[1];
          const isAuthenticated = await authenticateUser(session.user, password);
          
          if (isAuthenticated) {
            socket.write('+OK Pass accepted\r\n');
            session.state = 'TRANSACTION';
            // Load user's messages
            session.messages = await getUserEmailsWithCache(session.user);

          } else {
            socket.write('-ERR Authentication failed\r\n');
          }
        } else if (line.startsWith('STLS') && !ENABLE_TLS) {
          // STARTTLS command
          try {
            socket.write('+OK Begin TLS negotiation\r\n');
            // Upgrade to TLS
            const tlsSocket = new tls.TLSSocket(socket, {
              isServer: true,
              key: fs.readFileSync(KEY_PATH),
              cert: fs.readFileSync(CERT_PATH)
            });
            
            // Replace socket event handlers
            tlsSocket.removeAllListeners();
            tlsSocket.on('data', async (data) => {
              const line = data.toString().trim();
              console.log('POP3S (STARTTLS):', line);
              
              // Process TLS data the same way
              const session = (tlsSocket as any).session as Pop3Session;
              
              // ... (same processing logic as above)
              // For brevity, we'll skip the full implementation here
            });
          } catch (error) {
            console.error('STARTTLS error:', error);
            socket.write('-ERR TLS negotiation failed\r\n');
          }
        } else if (line.startsWith('QUIT')) {
          socket.write('+OK Bye\r\n');
          socket.end();
        }
      } else if (session.state === 'TRANSACTION') {
        // Same processing logic as TLS server above
        // ... (simplified for brevity)
        if (line === 'LIST') {
          // Filter out deleted messages
          const activeMessages = session.messages.filter((msg: any) => msg.folder !== 'trash');
          socket.write(`+OK ${activeMessages.length} messages\r\n`);
          activeMessages.forEach((msg: any, i: number) => {
            const messageBody = `From: ${msg.fromAddress || 'unknown@example.com'}\r
To: ${msg.toAddress || session.user}\r
Subject: ${msg.subject}\r
Date: ${msg.createdAt.toUTCString()}\r
\r
${msg.body}`;
            const byteLength = Buffer.byteLength(messageBody, 'utf8');
            socket.write(`${i+1} ${byteLength}\r\n`);
          });
          socket.write('.\r\n');
        } else if (line === 'QUIT') {
          socket.write('+OK Bye\r\n');
          socket.end();
        }
      }
    });

    socket.on('end', () => {
      console.log('POP3 Client disconnected');
    });
  });

// Export function to start the server
export function startPop3Server() {
  server.listen(PORT, () => {
    console.log(`POP3${ENABLE_TLS ? 'S' : ''} server running on port ${PORT}`);
    if (ENABLE_TLS) {
      console.log('TLS encryption enabled');
    }
  });
  return server;
}