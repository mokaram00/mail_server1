'use strict';

const { SMTPServer } = require('smtp-server');
const { simpleParser } = require('mailparser');
const User = require('./models/User').default;  // Access the default export
const Email = require('./models/Email').default;  // Access the default export

const MAIL_DOMAIN = process.env.MAIL_DOMAIN || 'example.com';

const server = new SMTPServer({
  secure: false, // STARTTLS لاحقاً
  disabledCommands: ['AUTH'],

  onMailFrom(address, session, cb) {
    cb(); // نقبل أي مرسل
  },

  onRcptTo(address, session, cb) {
    const email = address.address.toLowerCase();
    const domain = email.split('@')[1];

    if (domain !== MAIL_DOMAIN) {
      return cb(new Error('Relay denied'));
    }

    User.findOne({ email })
      .then(user => {
        if (!user) {
          return cb(new Error('Unknown recipient'));
        }

        if (!session.recipients) session.recipients = [];
        session.recipients.push(user);
        cb();
      })
      .catch(() => cb(new Error('DB error')));
  },

  onData(stream, session, cb) {
    simpleParser(stream)
      .then(async parsed => {
        const from = parsed.from?.text || '';
        const subject = parsed.subject || '(No subject)';
        const body = parsed.text || parsed.html || '';

        // Try to find the sender user in the database
        let senderUser = null;
        const senderEmail = parsed.from?.value?.[0]?.address;
        if (senderEmail) {
          try {
            senderUser = await User.findOne({ email: senderEmail });
          } catch (err) {
            console.error('Error finding sender user:', err);
          }
        }

        for (const user of session.recipients || []) {
          // Add logging for incoming messages
          console.log(`New mail for ${user.email} from ${from} with subject: ${subject}`);
          
          try {
            // Create email object with all required fields
            const emailData = {
              recipientId: user._id,
              subject: subject,
              body: body,
              isRead: false,
              folder: 'inbox',
              fromAddress: from,
              toAddress: user.email,
              receivedAt: new Date(),
              messageId: parsed.messageId
            };

            // Add senderId if sender user exists, otherwise use recipientId as fallback
            if (senderUser) {
              emailData.senderId = senderUser._id;
            } else {
              // Use recipientId as senderId as fallback to satisfy the required field
              emailData.senderId = user._id;
            }

            await Email.create(emailData);
            console.log(`Email saved to database for ${user.email}`);
          } catch (err) {
            console.error(`Failed to save email for ${user.email}:`, err);
          }
        }

        cb();
      })
      .catch(err => {
        console.error('Error parsing email:', err);
        cb(err);
      });
  }
});

server.listen(25, '0.0.0.0', () => {
  console.log('SMTP server listening on port 25');
});