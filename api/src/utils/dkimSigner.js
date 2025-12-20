'use strict';
import fs from 'fs';
import crypto from 'crypto';

const MAIL_DOMAIN = process.env.MAIL_DOMAIN || 'bltnm.store';
const DKIM_SELECTOR = 'mail'; // اسم الـ selector في DNS

// Load DKIM private key
const PRIVATE_KEY_PATH = '/etc/dkim/mail.private';
if (!fs.existsSync(PRIVATE_KEY_PATH)) {
  throw new Error('DKIM private key not found at ' + PRIVATE_KEY_PATH);
}
const PRIVATE_KEY = fs.readFileSync(PRIVATE_KEY_PATH, 'utf8');

/**
 * Generate DKIM signature header for email
 */
export const signEmailWithDKIM = (headers, body) => {
  const headersToSign = ['from', 'to', 'subject', 'date'];

  // canonicalization: relaxed
  const canonicalizedHeaders = headersToSign
    .filter(h => headers[h])
    .map(h => `${h.toLowerCase()}:${headers[h].replace(/\s+/g, ' ').trim()}`)
    .join('\r\n');

  const canonicalizedBody = body.replace(/\r\n/g, '\n')
                              .replace(/\n/g, '\r\n')
                              .replace(/(\r\n)*$/, '\r\n');

  const bh = crypto.createHash('sha256').update(canonicalizedBody).digest('base64');

  const sign = crypto.createSign('RSA-SHA256');
  sign.update(canonicalizedHeaders + '\r\n\r\n');
  const signature = sign.sign(PRIVATE_KEY, 'base64');

  const dkimHeader = [
    `v=1`,
    `a=rsa-sha256`,
    `c=relaxed/relaxed`,
    `d=${MAIL_DOMAIN}`,
    `s=${DKIM_SELECTOR}`,
    `bh=${bh}`,
    `h=${headersToSign.join(':')}`,
    `b=${signature}`
  ].join('; ');

  return dkimHeader;
};
