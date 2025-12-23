import { Request, Response } from 'express';
import crypto from 'crypto';
import Order, { IOrderItem } from '../models/Order';
import { User } from '../models/User';
import Product from '../models/Product';
import { sendPurchaseEmails } from '../utils/purchaseEmails.js';

export const polarWebhook = async (req: Request, res: Response): Promise<Response> => {
  try {
    const body = JSON.stringify(req.body);
    const signature = req.headers['polar-signature'] as string;

    if (!signature) {
      return res.status(400).json({ error: 'No signature' });
    }

    // Verify webhook signature
    const expectedSignature = crypto
      .createHmac('sha256', process.env.POLAR_WEBHOOK_SECRET || '')
      .update(body, 'utf8')
      .digest('hex');

    if (signature !== expectedSignature) {
      return res.status(400).json({ error: 'Invalid signature' });
    }

    const event = req.body;

    console.log('Polar webhook event:', event.type, event.data);

    // Handle different event types
    switch (event.type) {
      case 'checkout.completed':
        // Handle checkout completed - this should update the order status
        console.log('Checkout completed:', event.data.id);
        
        // Find order by checkout ID and update its status
        try {
          const order = await Order.findOne({ polarCheckoutId: event.data.id });
          if (order) {
            order.paymentStatus = 'paid';
            order.status = 'processing';
            await order.save();
            
            console.log(`Order ${order._id} updated to paid status`);
            
            // Now deduct stock from products
            for (const item of order.items) {
              const product = await Product.findById(item.product);
              if (product) {
                // Check if there's enough stock
                if (product.stock >= item.quantity) {
                  product.stock -= item.quantity;
                  await product.save();
                } else {
                  // Not enough stock - log this issue
                  console.error(`Not enough stock for product ${product._id} when fulfilling order ${order._id}`);
                  // You might want to notify admin or handle this case differently
                }
              }
            }
            
            // Send purchase emails
            const user = await User.findById(order.user);
            if (user) {
              await order.populate('items.product');
              const products = await Product.find({ '_id': { $in: order.items.map((item: IOrderItem) => item.product) } });
              await sendPurchaseEmails(user, order, products);
            }
          } else {
            console.log(`Order not found for checkout ID: ${event.data.id}`);
          }
        } catch (updateError) {
          console.error('Error updating order on checkout completion:', updateError);
        }
        break;
      case 'checkout.canceled':
        // Handle checkout canceled
        console.log('Checkout canceled:', event.data.id);
        
        // Find order by checkout ID and update its status
        try {
          const order = await Order.findOne({ polarCheckoutId: event.data.id });
          if (order) {
            order.paymentStatus = 'failed';
            order.status = 'cancelled';
            await order.save();
            
            console.log(`Order ${order._id} updated to cancelled status`);
          } else {
            console.log(`Order not found for checkout ID: ${event.data.id}`);
          }
        } catch (updateError) {
          console.error('Error updating order on checkout cancellation:', updateError);
        }
        break;
      default:
        console.log('Unhandled event type:', event.type);
    }

    return res.status(200).json({ received: true });
  } catch (error: any) {
    console.error('Webhook error:', error);
    return res.status(500).json({ error: 'Webhook error' });
  }
};