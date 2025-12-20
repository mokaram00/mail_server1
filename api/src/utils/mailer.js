'use strict';
import nodemailer from 'nodemailer';
import { signEmailWithDKIM } from './dkimSigner.js';
import fs from 'fs';

const MAIL_DOMAIN = process.env.MAIL_DOMAIN || 'bltnm.store';

// TLS certificates (اختياري إذا بدك SMTPS)
const CERT_PATH = '/etc/letsencrypt/live/mail.bltnm.store/fullchain.pem';
const KEY_PATH = '/etc/letsencrypt/live/mail.bltnm.store/privkey.pem';

let tlsOptions = {};
if (fs.existsSync(CERT_PATH) && fs.existsSync(KEY_PATH)) {
  tlsOptions = {
    key: fs.readFileSync(KEY_PATH),
    cert: fs.readFileSync(CERT_PATH)
  };
}

// Create transporter
export const transporter = nodemailer.createTransport({
  host: 'mail.bltnm.store',    // SMTP server
  port: 465,                   // SMTPS
  secure: true,                // SSL
  tls: { ...tlsOptions, rejectUnauthorized: false }, 
  auth: {
    user: `noreply@${MAIL_DOMAIN}`, // SMTP user
    pass: process.env.SMTP_PASSWORD  // لازم تحطي كلمة سر
  }
});

/**
 * Send email
 */
export const sendEmail = async ({ from, to, subject, text, html }) => {
  const headers = {
    from,
    to,
    subject,
    date: new Date().toUTCString()
  };

  // Generate DKIM signature
  const dkimHeader = signEmailWithDKIM(headers, html || text || '');
  const mailOptions = {
    from,
    to,
    subject,
    text,
    html,
    headers: {
      'DKIM-Signature': dkimHeader
    }
  };

  const info = await transporter.sendMail(mailOptions);
  console.log('Email sent:', info.messageId);
  return info;
};

// Test function
export const testMailer = async () => {
  return sendEmail({
    from: `noreply@${MAIL_DOMAIN}`,
    to: `test@${MAIL_DOMAIN}`,
    subject: 'Test DKIM Email',
    text: 'This is a test email with DKIM signature'
  });
};
