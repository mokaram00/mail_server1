'use strict';
import { sendEmail } from './mailer.js';
import MagicLink from '../models/MagicLink';
import crypto from 'crypto';

const MAIL_DOMAIN = process.env.MAIL_DOMAIN || 'bltnm.store';

/**
 * Send all purchase-related emails to a user
 * @param {Object} user - User object containing email and other details
 * @param {Object} order - Order object with purchase details
 * @param {Array} products - Array of purchased products
 */
export const sendPurchaseEmails = async (user, order, products) => {
  try {
    // Send thank you email
    await sendThankYouEmail(user, order);
    
    // Send transaction details email
    await sendTransactionEmail(user, order, products);
    
    // Generate and send magic link email
    await sendMagicLinkEmail(user);
    
    console.log(`All purchase emails sent successfully to ${user.email}`);
  } catch (error) {
    console.error('Error sending purchase emails:', error);
    throw error;
  }
};

/**
 * Send thank you email for the purchase
 */
const sendThankYouEmail = async (user, order) => {
  const subject = 'Thank You for Your Purchase!';
  
  const text = `
Dear ${user.fullName || user.email},

Thank you for your purchase! We're excited to have you as a customer.

Order Details:
- Order ID: ${order._id}
- Total Amount: $${order.totalAmount.toFixed(2)}
- Payment Method: ${order.paymentMethod}
- Payment Status: ${order.paymentStatus}

Your purchase helps us continue to provide excellent service. If you have any questions, feel free to contact our support team.

Best regards,
The Team
  `.trim();
  
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Thank You for Your Purchase</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <h2 style="color: #4CAF50;">Thank You for Your Purchase!</h2>
    
    <p>Dear ${user.fullName || user.email},</p>
    
    <p>Thank you for your purchase! We're excited to have you as a customer.</p>
    
    <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
      <h3>Order Details:</h3>
      <p><strong>Order ID:</strong> ${order._id}</p>
      <p><strong>Total Amount:</strong> $${order.totalAmount.toFixed(2)}</p>
      <p><strong>Payment Method:</strong> ${order.paymentMethod}</p>
      <p><strong>Payment Status:</strong> ${order.paymentStatus}</p>
    </div>
    
    <p>Your purchase helps us continue to provide excellent service. If you have any questions, feel free to contact our support team.</p>
    
    <p>Best regards,<br>
    The Team</p>
  </div>
</body>
</html>
  `.trim();
  
  return sendEmail({
    from: `noreply@${MAIL_DOMAIN}`,
    to: user.email,
    subject,
    text,
    html
  });
};

/**
 * Send transaction details email
 */
const sendTransactionEmail = async (user, order, products) => {
  const subject = `Transaction Details - Order #${order._id}`;
  
  // Create itemized list of products
  let itemsListText = '';
  let itemsListHtml = '<ul>';
  
  for (const item of order.items) {
    const product = products.find(p => p._id.toString() === item.product.toString());
    const productName = product ? product.name : 'Unknown Product';
    
    itemsListText += `- ${productName} (Quantity: ${item.quantity}) - $${(item.price * item.quantity).toFixed(2)}\n`;
    itemsListHtml += `<li>${productName} (Quantity: ${item.quantity}) - $${(item.price * item.quantity).toFixed(2)}</li>`;
  }
  
  itemsListHtml += '</ul>';
  
  const text = `
Transaction Details
===================

Hello ${user.fullName || user.email},

Here are the details of your recent transaction:

Order ID: ${order._id}
Date: ${new Date(order.createdAt).toLocaleDateString()}
Total Amount: $${order.totalAmount.toFixed(2)}

Items Purchased:
${itemsListText}

Payment Method: ${order.paymentMethod}
Payment Status: ${order.paymentStatus}

If you have any questions about this transaction, please contact our support team.

Thank you for choosing our service!

Best regards,
The Team
  `.trim();
  
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Transaction Details</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <h2 style="color: #2196F3;">Transaction Details</h2>
    
    <p>Hello ${user.fullName || user.email},</p>
    
    <p>Here are the details of your recent transaction:</p>
    
    <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
      <h3>Order Summary:</h3>
      <p><strong>Order ID:</strong> ${order._id}</p>
      <p><strong>Date:</strong> ${new Date(order.createdAt).toLocaleDateString()}</p>
      <p><strong>Total Amount:</strong> $${order.totalAmount.toFixed(2)}</p>
    </div>
    
    <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
      <h3>Items Purchased:</h3>
      ${itemsListHtml}
    </div>
    
    <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
      <h3>Payment Information:</h3>
      <p><strong>Payment Method:</strong> ${order.paymentMethod}</p>
      <p><strong>Payment Status:</strong> ${order.paymentStatus}</p>
    </div>
    
    <p>If you have any questions about this transaction, please contact our support team.</p>
    
    <p>Thank you for choosing our service!</p>
    
    <p>Best regards,<br>
    The Team</p>
  </div>
</body>
</html>
  `.trim();
  
  return sendEmail({
    from: `noreply@${MAIL_DOMAIN}`,
    to: user.email,
    subject,
    text,
    html
  });
};

/**
 * Generate and send magic link email
 */
const sendMagicLinkEmail = async (user) => {
  try {
    // Generate a unique token for the magic link
    const token = crypto.randomBytes(32).toString('hex');
    
    // Set expiration to 1 year from now
    const expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);
    
    // Create or update magic link
    const magicLink = new MagicLink({
      userId: user._id,
      token,
      expiresAt
    });
    
    await magicLink.save();
    
    // Generate the magic link URL
    const magicLinkUrl = `${process.env.MAIL_BOX}/magic-login?token=${token}`;
    
    const subject = 'Your Magic Login Link';
    
    const text = `
Magic Login Link
================

Hello ${user.fullName || user.email},

You have received this email because a magic login link was requested for your account.

Click the link below to log in to your account:
${magicLinkUrl}

This link will expire in 1 year. For security reasons, please do not share this link with anyone.

If you did not request this link, you can safely ignore this email.

Best regards,
The Team
  `.trim();
    
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Your Magic Login Link</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <h2 style="color: #FF9800;">Magic Login Link</h2>
    
    <p>Hello ${user.fullName || user.email},</p>
    
    <p>You have received this email because a magic login link was requested for your account.</p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${magicLinkUrl}" 
         style="background-color: #FF9800; color: white; padding: 12px 24px; 
                text-decoration: none; border-radius: 5px; display: inline-block;">
        Log In to Your Account
      </a>
    </div>
    
    <p>This link will expire in 1 year. For security reasons, please do not share this link with anyone.</p>
    
    <p>If you did not request this link, you can safely ignore this email.</p>
    
    <p>Best regards,<br>
    The Team</p>
  </div>
</body>
</html>
  `.trim();
    
    return sendEmail({
      from: `noreply@${MAIL_DOMAIN}`,
      to: user.email,
      subject,
      text,
      html
    });
  } catch (error) {
    console.error('Error generating or sending magic link:', error);
    throw error;
  }
};