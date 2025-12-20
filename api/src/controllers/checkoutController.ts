import { Request, Response } from 'express';
import Order from '../models/Order';
import Product from '../models/Product';
import { User } from '../models/User';
import { sendPurchaseEmails } from '../utils/purchaseEmails.js';
import { IProduct } from '../models/Product';

// Extend the Request type to include user property
interface AuthRequest extends Request {
  user?: {
    id: string;
  };
}

// Create checkout
export const createCheckout = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const { items, paymentMethod } = req.body;

    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'No items in cart' });
    }

    // Calculate total amount
    let totalAmount = 0;
    const orderItems = [];
    
    // Fetch product details and calculate total
    const productIds = items.map((item: any) => item.productId);
    const products: IProduct[] = await Product.find({ '_id': { $in: productIds } });
    
    for (const item of items) {
      const product = products.find(p => p._id.toString() === item.productId);
      if (!product) {
        return res.status(400).json({ message: `Product with ID ${item.productId} not found` });
      }
      
      const itemTotal = product.price * item.quantity;
      totalAmount += itemTotal;
      
      orderItems.push({
        product: product._id,
        quantity: item.quantity,
        price: product.price
      });
    }

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
    } catch (emailError) {
      console.error('Failed to send purchase emails:', emailError);
      // Don't fail the checkout if emails fail to send
    }
    
    return res.status(200).json({ 
      message: 'Checkout completed successfully',
      orderId: order._id
    });
  } catch (error) {
    console.error('Create checkout error:', error);
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
  } catch (error) {
    console.error('Get checkout error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};