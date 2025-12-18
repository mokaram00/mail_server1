'use strict';

const { SMTPServer } = require('smtp-server');
const { simpleParser } = require('mailparser');
const User = require('./models/User');
const Email = require('./models/Email');

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

        for (const user of session.recipients || []) {
          // Add logging for incoming messages
          console.log(`New mail for ${user.email} from ${from} with subject: ${subject}`);
          
          await Email.create({
            recipientId: user._id,
            fromAddress: from,
            toAddress: user.email,
            subject,
            body,
            isRead: false,
            receivedAt: new Date(),
            messageId: parsed.messageId
          });
        }

        cb();
      })
      .catch(err => cb(err));
  }
});

server.listen(25, '0.0.0.0', () => {
  console.log('SMTP server listening on port 25');
});