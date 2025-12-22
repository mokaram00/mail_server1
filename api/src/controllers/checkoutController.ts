import { Request, Response } from 'express';
import Order, { IOrderItem } from '../models/Order';
import Product from '../models/Product';
import { User } from '../models/User';
import { sendPurchaseEmails } from '../utils/purchaseEmails.js';
import { IProduct } from '../models/Product';
import fetch from 'node-fetch';

// Extend the Request type to include user property and body
interface AuthRequest extends Request {
  user?: {
    id: string;
  };
  body: {
    items: any[];
    paymentMethod: string;
    email?: string;
    ip?: string;
    countryCode?: string;
  };
}

// Create checkout
export const createCheckout = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const { items, paymentMethod, email, ip, countryCode } = req.body;

    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'No items in cart' });
    }

    // Validate items format
    for (const item of items) {
      if (!item.productId || typeof item.quantity !== 'number' || item.quantity <= 0) {
        return res.status(400).json({ message: 'Invalid item format in cart' });
      }
    }

    // Calculate total amount and validate products
    let totalAmount = 0;
    const orderItems = [];
    
    // Fetch product details and calculate total
    const productIds = items.map((item: any) => item.productId);
    const products: IProduct[] = await Product.find({ '_id': { $in: productIds } });
    
    // Store product prices for verification later
    const productPrices: Record<string, number> = {};
    
    for (const item of items) {
      const product = products.find(p => (p as any)._id.toString() === item.productId);
      if (!product) {
        return res.status(400).json({ message: `Product with ID ${item.productId} not found` });
      }
      
      // Store product price for verification
      productPrices[item.productId] = product.price;
      
      // Note: We don't check stock here anymore, will be checked after payment confirmation
      const itemTotal = product.price * item.quantity;
      totalAmount += itemTotal;
      
      orderItems.push({
        product: (product as any)._id,
        quantity: item.quantity,
        price: product.price
      });
    }

    // If payment method is SellAuth, create checkout session with SellAuth API
    if (paymentMethod === 'sellauth') {
      try {
        const sellAuthResponse = await fetch(`https://api.sellauth.com/v1/shops/${process.env.SELLAUTH_SHOP_ID}/checkout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.SELLAUTH_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            cart: items.map((item: any) => ({
              product_id: item.productId,
              quantity: item.quantity,
            })),
            ip: ip || req.ip || '127.0.0.1',
            country_code: countryCode || 'US',
            email: email || (await User.findById(req.user.id))?.email,
            payment_gateways: {
              STRIPE: true,
              PAYPAL: true,
            }
          }),
        });

        const sellAuthData = await sellAuthResponse.json();

        if (!sellAuthResponse.ok) {
          return res.status(sellAuthResponse.status).json({
            message: 'Failed to create checkout session with SellAuth',
            error: sellAuthData
          });
        }

        // Create order with pending status and store SellAuth invoice ID
        const order = new Order({
          user: req.user.id,
          items: orderItems,
          totalAmount,
          paymentMethod,
          paymentStatus: 'pending', // Payment is pending until confirmed by webhook
          status: 'pending',
          sellAuthInvoiceId: sellAuthData.invoice_id,
          sellAuthCheckoutUrl: sellAuthData.url
        });
        
        await order.save();

        // Return the checkout URL to redirect the user
        return res.status(200).json({
          message: 'Checkout session created successfully',
          checkoutUrl: sellAuthData.url,
          invoiceId: sellAuthData.invoice_id
        });
      } catch (sellAuthError: any) {
        console.error('SellAuth checkout error:', sellAuthError);
        return res.status(500).json({ 
          message: 'Failed to create checkout session with SellAuth',
          error: sellAuthError.message || 'Unknown error'
        });
      }
    } else {
      // For other payment methods, use the existing logic
      // Create order
      const order = new Order({
        user: req.user.id,
        items: orderItems,
        totalAmount,
        paymentMethod,
        paymentStatus: 'paid', // Assuming payment is successful
        status: 'processing'
      });
      
      await order.save();
      
      // Populate order with product details
      await order.populate('items.product');
      
      // Get user details
      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Send purchase emails
      try {
        await sendPurchaseEmails(user, order, products);
      } catch (emailError: any) {
        console.error('Failed to send purchase emails:', emailError);
        // Don't fail the checkout if emails fail to send
      }
      
      return res.status(200).json({ 
        message: 'Checkout completed successfully',
        orderId: (order as any)._id
      });
    }
  } catch (error: any) {
    console.error('Create checkout error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// Webhook endpoint for SellAuth notifications
export const sellAuthWebhook = async (req: Request, res: Response): Promise<Response> => {
  try {
    // Verify webhook signature if needed (you might want to add this for security)
    // const signature = req.headers['x-sellauth-signature'];
    // if (!verifyWebhookSignature(req.body, signature)) {
    //   return res.status(401).json({ message: 'Invalid webhook signature' });
    // }

    const { invoice_id, status, total_amount, items } = req.body;

    // Find order by SellAuth invoice ID
    const order = await Order.findOne({ sellAuthInvoiceId: invoice_id });
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found for this invoice' });
    }

    // Verify the total amount matches
    if (Math.abs(total_amount - order.totalAmount) > 0.01) { // Allow small floating point differences
      console.warn(`Amount mismatch for order ${order._id}: expected ${order.totalAmount}, got ${total_amount}`);
      // You might want to flag this order for manual review instead of rejecting it outright
    }

    // Verify individual items and quantities
    if (items && Array.isArray(items)) {
      // Create a map of order items for easier lookup
      const orderItemMap = new Map();
      for (const item of order.items) {
        orderItemMap.set((item.product as any).toString(), item);
      }
      
      // Verify each item in the webhook
      for (const item of items) {
        const orderItem = orderItemMap.get(item.product_id);
        if (!orderItem) {
          console.warn(`Item ${item.product_id} not found in order ${order._id}`);
          continue;
        }
        
        if (orderItem.quantity !== item.quantity) {
          console.warn(`Quantity mismatch for product ${item.product_id} in order ${order._id}: expected ${orderItem.quantity}, got ${item.quantity}`);
        }
        
        const expectedPrice = orderItem.price * orderItem.quantity;
        const actualPrice = item.price * item.quantity;
        if (Math.abs(expectedPrice - actualPrice) > 0.01) {
          console.warn(`Price mismatch for product ${item.product_id} in order ${order._id}: expected ${expectedPrice}, got ${actualPrice}`);
        }
      }
    }

    // Update order status based on SellAuth status
    if (status === 'paid') {
      order.paymentStatus = 'paid';
      order.status = 'processing';
      
      // Save the updated order
      await order.save();
      
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
      try {
        const user = await User.findById(order.user);
        if (user) {
          // Populate order with product details for email
          await order.populate('items.product');
          // Get products for email
          const products = await Product.find({ '_id': { $in: order.items.map((item: IOrderItem) => item.product) } });
          await sendPurchaseEmails(user, order, products);
        }
      } catch (emailError: any) {
        console.error('Failed to send purchase emails:', emailError);
        // Don't fail the webhook if emails fail to send
      }
      
      return res.status(200).json({ message: 'Order updated successfully' });
    } else if (status === 'failed') {
      order.paymentStatus = 'failed';
      order.status = 'cancelled';
      await order.save();
      
      return res.status(200).json({ message: 'Order marked as failed' });
    } else {
      // Handle other statuses if needed
      return res.status(200).json({ message: 'Webhook received, no action taken for this status' });
    }
  } catch (error: any) {
    console.error('SellAuth webhook error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// Get checkout details
export const getCheckout = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { session_id } = req.query;

    if (!session_id) {
      return res.status(400).json({ message: 'No session_id provided' });
    }

    // For now, we'll just return a mock response
    // In a real implementation, this would fetch checkout details from a payment provider
    return res.status(200).json({
      order: {
        _id: session_id,
        status: 'completed',
        paymentStatus: 'paid',
        paymentMethod: 'credit_card',
        totalAmount: 100.00,
        items: []
      }
    });
  } catch (error: any) {
    console.error('Get checkout error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};