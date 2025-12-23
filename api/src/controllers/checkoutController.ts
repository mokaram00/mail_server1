import { Request, Response } from 'express';
import Product, { IProduct } from '../models/Product';
import Order, { IOrderItem } from '../models/Order';
import { User } from '../models/User';
import { sendPurchaseEmails } from '../utils/purchaseEmails.js';
import fetch from 'node-fetch';

// Extend the AuthRequest interface to include typed body
interface AuthRequest extends Request {
  user?: {
    id: string;
  };
  admin?: {
    id: string;
    role: string;
  };
}

interface CheckoutRequestBody {
  items: any[];
  paymentMethod: string;
  email?: string;
  ip?: string;
  countryCode?: string;
  payCurrency?: string;
}

// Create checkout
export const createCheckout = async (req: AuthRequest & {body: CheckoutRequestBody}, res: Response): Promise<Response> => {
  try {
    console.log('Checkout request received:', req.body);
    const { items, paymentMethod, email, payCurrency } = req.body;
    
    // ... existing code for authentication and validation ...
    
    if (!req.user) {
      console.log('Unauthorized checkout attempt');
      return res.status(401).json({ message: 'Unauthorized' });
    }

    console.log('User ID:', req.user.id);
    console.log('Items:', items);
    console.log('Payment method:', paymentMethod);

    if (!items || items.length === 0) {
      console.log('No items in cart');
      return res.status(400).json({ message: 'No items in cart' });
    }

    // Validate items format
    for (const item of items) {
      // Handle both formats: {productId, quantity} and {_id, quantity}
      const productId = item.productId || item._id;
      if (!productId || typeof item.quantity !== 'number' || item.quantity <= 0) {
        console.warn(`[${new Date().toISOString()}] Invalid item format in cart for user ${req.user.id}`, item);
        return res.status(400).json({ message: 'Invalid item format in cart' });
      }
    }

    // Calculate total amount and validate products
    let totalAmount = 0;
    const orderItems = [];
    
    // Find products in database
    const productIds = items.map((item: any) => item.productId || item._id);
    const products: IProduct[] = await Product.find({ '_id': { $in: productIds } });
    
    console.log(`[${new Date().toISOString()}] Found ${products.length} products for checkout for user ${req.user.id}`);
    
    // Store product prices for verification later
    const productPrices: Record<string, number> = {};
    
    for (const item of items) {
      // Handle both formats: {productId, quantity} and {_id, quantity}
      const productId = item.productId || item._id;
      const product = products.find(p => (p as any)._id.toString() === productId);
      if (!product) {
        console.warn(`[${new Date().toISOString()}] Product with ID ${productId} not found for user ${req.user.id}`);
        return res.status(400).json({ message: `Product with ID ${productId} not found` });
      }
      
      // Store product price for verification
      productPrices[productId] = product.price;
      
      // Note: We don't check stock here anymore, will be checked after payment confirmation
      const itemTotal = product.price * item.quantity;
      totalAmount += itemTotal;
      
      orderItems.push({
        product: (product as any)._id,
        quantity: item.quantity,
        price: product.price
      });
    }

    console.log('Total amount calculated:', totalAmount);
    console.log('Order items:', orderItems);

    // If payment method is Polar, create checkout session with Polar API
    if (paymentMethod === 'polar') {
      try {
        console.log('Creating Polar checkout session');
        console.log('POLAR_API_KEY exists:', !!process.env.POLAR_API_KEY);
        
        // Get user email
        const user = await User.findById(req.user.id);
        if (!user) {
          return res.status(404).json({ message: 'User not found' });
        }

        // Create order first to get order ID
        const order = new Order({
          user: req.user.id,
          items: orderItems,
          totalAmount,
          paymentMethod,
          paymentStatus: 'pending', // Payment is pending until confirmed by webhook
          status: 'pending'
        });
        
        await order.save();
        console.log('Order created:', order._id);

        // Create payment with Polar
        const polarResponse = await fetch('https://api.polar.sh/v1/checkouts/', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.POLAR_API_KEY || ''}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            product_id: orderItems[0].product.toString(), // Using first product for checkout
            success_url: `${process.env.SHOP_URL}/shop/checkout/success?order_id=${order._id}`,
            customer_email: email || user.email,
            price_amount: Math.round(totalAmount * 100), // Convert to cents
            price_currency: 'usd',
          }),
        });

        console.log('Polar response status:', polarResponse.status);
        const polarData = await polarResponse.json();
        console.log('Polar response data:', polarData);

        if (!polarResponse.ok) {
          console.log('Polar API error:', polarData);
          // Delete the order since payment creation failed
          await Order.findByIdAndDelete(order._id);
          return res.status(polarResponse.status).json({
            message: 'Failed to create checkout session with Polar',
            error: polarData
          });
        }

        // Update order with Polar checkout ID and checkout URL
        order.polarCheckoutId = polarData.id;
        order.polarCheckoutUrl = polarData.url;
        await order.save();

        // Return the checkout URL to redirect the user
        return res.status(200).json({
          message: 'Checkout session created successfully',
          checkoutUrl: polarData.url,
          orderId: order._id
        });
      } catch (polarError: any) {
        console.error('Polar checkout error:', polarError);
        return res.status(500).json({ 
          message: 'Failed to create checkout session with Polar',
          error: polarError.message || 'Unknown error'
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



// Get available payment methods
export const getAvailableCurrencies = async (req: Request, res: Response): Promise<Response> => {
  try {
    // Return available payment methods for Polar
    const currencies = [
      { code: 'usd', name: 'US Dollar' },
      { code: 'eur', name: 'Euro' },
      { code: 'gbp', name: 'British Pound' },
      { code: 'btc', name: 'Bitcoin' },
      { code: 'eth', name: 'Ethereum' },
      { code: 'usdc', name: 'USD Coin' }
    ];

    return res.status(200).json({
      message: 'Available payment methods fetched successfully',
      currencies: currencies
    });
  } catch (error: any) {
    console.error('Error fetching payment methods:', error);
    return res.status(500).json({ 
      message: 'Internal server error',
      error: error.message 
    });
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