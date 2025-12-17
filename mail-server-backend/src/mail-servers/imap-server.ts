// imap-server.ts
import net from 'net';
import tls from 'tls';
import fs from 'fs';
import User from '../models/User';
import Email from '../models/Email';
import bcrypt from 'bcryptjs';
import { imapCache } from './cache';

const PORT = parseInt(process.env.INTERNAL_IMAP_PORT || '1430');
const ENABLE_TLS = process.env.INTERNAL_IMAP_TLS === 'true';
const CERT_PATH = process.env.INTERNAL_IMAP_CERT_PATH || '';
const KEY_PATH = process.env.INTERNAL_IMAP_KEY_PATH || '';

// Session management interface
interface ImapSession {
  user: string;
  messages: any[];
  selectedFolder: string;
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
  const cachedMessages = imapCache.get(username);
  if (cachedMessages) {
    console.log(`Cache hit for user ${username}`);
    return cachedMessages;
  }
  
  // If not in cache, fetch from database
  console.log(`Cache miss for user ${username}, fetching from database`);
  const messages = await getUserEmails(username);
  
  // Store in cache
  imapCache.set(username, messages);
  
  return messages;
}

// Create server (TLS or plain TCP)
const server = ENABLE_TLS ? 
  tls.createServer({
    key: fs.readFileSync(KEY_PATH),
    cert: fs.readFileSync(CERT_PATH)
  }, async (socket) => {
    console.log('IMAPS Client connected');
    socket.write('* OK MyMailServer IMAPS ready\r\n');

    // Attach session to socket
    (socket as any).session = {
      user: '',
      messages: [],
      selectedFolder: ''
    } as ImapSession;

    socket.on('data', async (data) => {
      const line = data.toString().trim();
      console.log('IMAPS:', line);

      const session = (socket as any).session as ImapSession;
      const parts = line.split(' ');
      const tag = parts[0];
      const command = parts[1] ? parts[1].toUpperCase() : '';
      const args = parts.slice(2);

      switch(command) {
        case 'LOGIN':
          const username = args[0];
          const password = args[1];
          const isAuthenticated = await authenticateUser(username, password);
          
          if (isAuthenticated) {
            session.user = username;
            session.messages = await getUserEmailsWithCache(username);
            socket.write(`${tag} OK LOGIN completed\r\n`);
          } else {
            socket.write(`${tag} NO LOGIN failed\r\n`);
          }
          break;

        case 'LIST':
          // عرض المجلدات
          socket.write(`* LIST (\\HasNoChildren) "/" INBOX\r\n`);
          socket.write(`* LIST (\\HasNoChildren) "/" Sent\r\n`);
          socket.write(`* LIST (\\HasNoChildren) "/" Drafts\r\n`);
          socket.write(`* LIST (\\HasNoChildren) "/" Trash\r\n`);
          socket.write(`${tag} OK LIST completed\r\n`);
          break;

        case 'SELECT':
          session.selectedFolder = args[0];
          // Filter messages by folder
          const emailsInFolder = session.messages.filter((msg: any) => msg.folder === session.selectedFolder);
          // فتح مجلد
          socket.write(`* ${emailsInFolder.length} EXISTS\r\n`);
          socket.write(`* 0 RECENT\r\n`);
          socket.write(`* FLAGS (\\Answered \\Flagged \\Deleted \\Seen \\Draft)\r\n`);
          socket.write(`* OK [PERMANENTFLAGS (\\Answered \\Flagged \\Deleted \\Seen \\Draft \\$Important \\*)] Flags permitted\r\n`);
          socket.write(`${tag} OK [READ-WRITE] SELECT completed\r\n`);
          break;

        case 'EXAMINE':
          // Similar to SELECT but read-only
          session.selectedFolder = args[0];
          const readOnlyEmails = session.messages.filter((msg: any) => msg.folder === session.selectedFolder);
          socket.write(`* ${readOnlyEmails.length} EXISTS\r\n`);
          socket.write(`* 0 RECENT\r\n`);
          socket.write(`* FLAGS (\\Answered \\Flagged \\Deleted \\Seen \\Draft)\r\n`);
          socket.write(`* OK [READ-ONLY] EXAMINE completed\r\n`);
          socket.write(`${tag} OK [READ-ONLY] EXAMINE completed\r\n`);
          break;

        case 'FETCH':
          // إرسال محتوى الرسائل
          const msgNum = parseInt(args[0]);
          const fetchAttributes = args.slice(1); // What to fetch (BODY[], BODYSTRUCTURE, ENVELOPE, etc.)
          
          // Filter by selected folder
          const folderMessages = session.messages.filter((msg: any) => msg.folder === session.selectedFolder);
          const msg = folderMessages[msgNum - 1];
          
          if (msg) {
            // Parse fetch attributes
            const attributes = fetchAttributes.length > 0 ? 
              fetchAttributes.join(' ').replace(/[\(\)]/g, '').split(' ') : 
              ['BODY[TEXT]'];
            
            let responseParts: string[] = [];
            let flags = [];
            
            // Collect flags
            if (msg.isRead) flags.push('\\Seen');
            if (msg.isStarred) flags.push('\\Flagged');
            if (msg.folder === 'trash') flags.push('\\Deleted');
            
            // Process each requested attribute
            for (const attr of attributes) {
              switch (attr.toUpperCase()) {
                case 'FLAGS':
                  responseParts.push(`FLAGS (${flags.join(' ')})`);
                  break;
                  
                case 'BODY[]':
                case 'RFC822':
                  // Full message body
                  const fullMessage = `From: ${msg.fromAddress || 'unknown@example.com'}\r
To: ${msg.toAddress || session.user}\r
Subject: ${msg.subject}\r
Date: ${msg.createdAt.toUTCString()}\r
Message-ID: ${msg.messageId || `<${msg.id}@${process.env.DOMAIN || 'mail-server-backend'}>`}\r
\r
${msg.body}`;
                  const fullByteLength = Buffer.byteLength(fullMessage, 'utf8');
                  responseParts.push(`BODY[] {${fullByteLength}}\r\n${fullMessage}`);
                  break;
                  
                case 'BODY[TEXT]':
                  // Just the message body
                  const messageBody = `From: ${msg.fromAddress || 'unknown@example.com'}\r
To: ${msg.toAddress || session.user}\r
Subject: ${msg.subject}\r
Date: ${msg.createdAt.toUTCString()}\r
\r
${msg.body}`;
                  const byteLength = Buffer.byteLength(messageBody, 'utf8');
                  responseParts.push(`BODY[TEXT] {${byteLength}}\r\n${messageBody}`);
                  break;
                  
                case 'ENVELOPE':
                  // RFC 2822 envelope information
                  responseParts.push(`ENVELOPE ("${msg.createdAt.toUTCString()}" "${msg.subject}" (("${msg.fromAddress || 'unknown@example.com'}")) NIL NIL (("${msg.toAddress || session.user}")) NIL NIL "${msg.messageId || `<${msg.id}@${process.env.DOMAIN || 'mail-server-backend'}>`}")`);
                  break;
                  
                case 'BODYSTRUCTURE':
                  // Simplified body structure
                  responseParts.push(`BODYSTRUCTURE ("TEXT" "PLAIN" NIL NIL NIL "7BIT" ${Buffer.byteLength(msg.body, 'utf8')} 1 NIL NIL NIL NIL)`);
                  break;
                  
                case 'UID':
                  // Unique identifier
                  responseParts.push(`UID ${msg.id}`);
                  break;
              }
            }
            
            socket.write(`* ${msgNum} FETCH (${responseParts.join(' ')})\r\n`);
          }
          socket.write(`${tag} OK FETCH completed\r\n`);
          break;

        case 'SEARCH':
          // البحث في الرسائل within selected folder
          const searchTerm = args.join(' ').toUpperCase();
          const searchResults: number[] = [];
          const searchMessages = session.messages.filter((msg: any) => msg.folder === session.selectedFolder);
          
          searchMessages.forEach((msg: any, index: number) => {
            // البحث في الموضوع أو المحتوى
            if (msg.subject.toUpperCase().includes(searchTerm) || 
                msg.body.toUpperCase().includes(searchTerm)) {
              searchResults.push(index + 1);
            }
          });
          
          socket.write(`* SEARCH ${searchResults.join(' ')}\r\n`);
          socket.write(`${tag} OK SEARCH completed\r\n`);
          break;

        case 'STORE':
          // تحديث حالة الرسالة
          const storeMsgId = parseInt(args[0]);
          const action = args[1];
          const flag = args[2];
          
          // Filter by selected folder
          const storeMessages = session.messages.filter((msg: any) => msg.folder === session.selectedFolder);
          const storeMsg = storeMessages[storeMsgId - 1];
          
          if (action === '+FLAGS' && flag === '\\Seen') {
            // Mark message as read
            try {
              await Email.update(
                { isRead: true },
                { where: { id: storeMsg.id } }
              );
              socket.write(`${tag} OK STORE completed\r\n`);
            } catch (error) {
              console.error('Store error:', error);
              socket.write(`${tag} NO STORE failed\r\n`);
            }
          } else if (action === '+FLAGS' && flag === '\\Deleted') {
            // Mark message as deleted
            try {
              await Email.update(
                { folder: 'trash' },
                { where: { id: storeMsg.id } }
              );
              socket.write(`${tag} OK STORE completed\r\n`);
            } catch (error) {
              console.error('Store error:', error);
              socket.write(`${tag} NO STORE failed\r\n`);
            }
          } else if (action === '+FLAGS' && flag === '\\Flagged') {
            // Mark message as flagged
            try {
              await Email.update(
                { isStarred: true },
                { where: { id: storeMsg.id } }
              );
              socket.write(`${tag} OK STORE completed\r\n`);
            } catch (error) {
              console.error('Store error:', error);
              socket.write(`${tag} NO STORE failed\r\n`);
            }
          } else if (action === '-FLAGS' && flag === '\\Flagged') {
            // Remove flagged status
            try {
              await Email.update(
                { isStarred: false },
                { where: { id: storeMsg.id } }
              );
              socket.write(`${tag} OK STORE completed\r\n`);
            } catch (error) {
              console.error('Store error:', error);
              socket.write(`${tag} NO STORE failed\r\n`);
            }
          } else {
            socket.write(`${tag} OK STORE completed\r\n`);
          }
          break;

        case 'COPY':
          // Copy message to another folder
          socket.write(`${tag} OK COPY completed\r\n`);
          break;

        case 'EXPUNGE':
          // Permanently delete messages marked as deleted
          socket.write(`* 1 EXPUNGE\r\n`);
          socket.write(`${tag} OK EXPUNGE completed\r\n`);
          break;

        case 'CHECK':
          // Request a checkpoint of the mailbox
          socket.write(`${tag} OK CHECK completed\r\n`);
          break;

        case 'UID':
          // التعامل مع الأوامر ذات الـ UID
          const uidCommand = args[0] ? args[0].toUpperCase() : '';
          const uidArgs = args.slice(1);
          
          if (uidCommand === 'FETCH') {
            // UID FETCH
            const msgUid = parseInt(uidArgs[0]);
            const fetchAttributes = uidArgs.slice(1); // What to fetch
            
            // البحث عن الرسالة بالـ UID within selected folder
            const uidMessages = session.messages.filter((msg: any) => msg.folder === session.selectedFolder);
            const msgIndex = uidMessages.findIndex((msg: any) => msg.id === msgUid);
            
            if (msgIndex !== -1) {
              const msg = uidMessages[msgIndex];
              const msgSeqNum = msgIndex + 1; // Sequence number
              
              // Parse fetch attributes
              const attributes = fetchAttributes.length > 0 ? 
                fetchAttributes.join(' ').replace(/[\(\)]/g, '').split(' ') : 
                ['BODY[TEXT]'];
              
              let responseParts: string[] = [];
              let flags = [];
              
              // Collect flags
              if (msg.isRead) flags.push('\\Seen');
              if (msg.isStarred) flags.push('\\Flagged');
              if (msg.folder === 'trash') flags.push('\\Deleted');
              
              // Process each requested attribute
              for (const attr of attributes) {
                switch (attr.toUpperCase()) {
                  case 'FLAGS':
                    responseParts.push(`FLAGS (${flags.join(' ')})`);
                    break;
                    
                  case 'BODY[]':
                  case 'RFC822':
                    // Full message body
                    const fullMessage = `From: ${msg.fromAddress || 'unknown@example.com'}\r
To: ${msg.toAddress || session.user}\r
Subject: ${msg.subject}\r
Date: ${msg.createdAt.toUTCString()}\r
Message-ID: ${msg.messageId || `<${msg.id}@${process.env.DOMAIN || 'mail-server-backend'}>`}\r
\r
${msg.body}`;
                    const fullByteLength = Buffer.byteLength(fullMessage, 'utf8');
                    responseParts.push(`BODY[] {${fullByteLength}}\r\n${fullMessage}`);
                    break;
                    
                  case 'BODY[TEXT]':
                    // Just the message body
                    const messageBody = `From: ${msg.fromAddress || 'unknown@example.com'}\r
To: ${msg.toAddress || session.user}\r
Subject: ${msg.subject}\r
Date: ${msg.createdAt.toUTCString()}\r
\r
${msg.body}`;
                    const byteLength = Buffer.byteLength(messageBody, 'utf8');
                    responseParts.push(`BODY[TEXT] {${byteLength}}\r\n${messageBody}`);
                    break;
                    
                  case 'ENVELOPE':
                    // RFC 2822 envelope information
                    responseParts.push(`ENVELOPE ("${msg.createdAt.toUTCString()}" "${msg.subject}" (("${msg.fromAddress || 'unknown@example.com'}")) NIL NIL (("${msg.toAddress || session.user}")) NIL NIL "${msg.messageId || `<${msg.id}@${process.env.DOMAIN || 'mail-server-backend'}>`}")`);
                    break;
                    
                  case 'BODYSTRUCTURE':
                    // Simplified body structure
                    responseParts.push(`BODYSTRUCTURE ("TEXT" "PLAIN" NIL NIL NIL "7BIT" ${Buffer.byteLength(msg.body, 'utf8')} 1 NIL NIL NIL NIL)`);
                    break;
                    
                  case 'UID':
                    // Unique identifier
                    responseParts.push(`UID ${msg.id}`);
                    break;
                }
              }
              
              socket.write(`* ${msgSeqNum} FETCH (${responseParts.join(' ')})\r\n`);
            }
            socket.write(`${tag} OK UID FETCH completed\r\n`);
          } else {
            socket.write(`${tag} BAD Unknown UID command\r\n`);
          }
          break;

        case 'LOGOUT':
          socket.write('* BYE IMAP server logging out\r\n');
          socket.write(`${tag} OK LOGOUT completed\r\n`);
          socket.end();
          break;

        default:
          socket.write(`${tag} BAD Unknown command\r\n`);
          break;
      }
    });

    socket.on('end', () => {
      console.log('IMAPS Client disconnected');
    });
  }) :
  net.createServer(async (socket) => {
    console.log('IMAP Client connected');
    socket.write('* OK MyMailServer IMAP ready\r\n');

    // Attach session to socket
    (socket as any).session = {
      user: '',
      messages: [],
      selectedFolder: ''
    } as ImapSession;

    socket.on('data', async (data) => {
      const line = data.toString().trim();
      console.log('IMAP:', line);

      const session = (socket as any).session as ImapSession;
      const parts = line.split(' ');
      const tag = parts[0];
      const command = parts[1] ? parts[1].toUpperCase() : '';
      const args = parts.slice(2);

      switch(command) {
        case 'LOGIN':
          const username = args[0];
          const password = args[1];
          const isAuthenticated = await authenticateUser(username, password);
          
          if (isAuthenticated) {
            session.user = username;
            session.messages = await getUserEmailsWithCache(username);
            socket.write(`${tag} OK LOGIN completed\r\n`);
          } else {
            socket.write(`${tag} NO LOGIN failed\r\n`);
          }
          break;

        case 'LOGOUT':
          socket.write('* BYE IMAP server logging out\r\n');
          socket.write(`${tag} OK LOGOUT completed\r\n`);
          socket.end();
          break;

        default:
          socket.write(`${tag} BAD Unknown command\r\n`);
          break;
      }
    });

    socket.on('end', () => {
      console.log('IMAP Client disconnected');
    });
  });

// Export function to start the server
export function startImapServer() {
  server.listen(PORT, () => {
    console.log(`IMAP${ENABLE_TLS ? 'S' : ''} server running on port ${PORT}`);
    if (ENABLE_TLS) {
      console.log('TLS encryption enabled');
    }
  });
  return server;
}
