'use strict';
import { sendPurchaseEmails } from './purchaseEmails.js';
import { User } from '../models/User.js';

/**
 * Test function to verify purchase emails functionality
 */
export const testPurchaseEmails = async () => {
  try {
    // Create a mock user
    const user = {
      email: 'test@example.com',
      fullName: 'Test User'
    };
    
    // Create a mock order
    const order = {
      _id: 'ORDER123456',
      totalAmount: 99.99,
      paymentMethod: 'Credit Card',
      paymentStatus: 'paid',
      createdAt: new Date(),
      items: [
        {
          product: {
            name: 'Premium Email Package'
          },
          quantity: 2,
          price: 49.99
        }
      ]
    };
    
    // Create mock products
    const products = [
      {
        _id: 'PRODUCT123',
        name: 'Premium Email Package'
      }
    ];
    
    // Send purchase emails
    await sendPurchaseEmails(user, order, products);
    
    console.log('Test purchase emails sent successfully!');
  } catch (error) {
    console.error('Error testing purchase emails:', error);
  }
};

// Run test if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testPurchaseEmails();
}