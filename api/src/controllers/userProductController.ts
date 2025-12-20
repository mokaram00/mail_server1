import { Request, Response } from 'express';
import Order, { IOrderItem } from '../models/Order';
import Product, { IProduct } from '../models/Product';
import MagicLink from '../models/MagicLink';
import Emails from '../models/Emails';
import crypto from 'crypto';

// Extend the Request type to include user property
interface AuthRequest extends Request {
  user?: {
    id: string;
  };
}

// Generate a magic link for a purchased account
export const generateAccountMagicLink = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { productId } = req.params;

    // Validate product ID
    if (!productId) {
      return res.status(400).json({ message: 'Product ID is required' });
    }

    // Check if user has purchased this product
    const order = await Order.findOne({
      user: req.user.id,
      'items.product': productId,
      status: 'delivered',
      paymentStatus: 'paid'
    });

    if (!order) {
      return res.status(403).json({ message: 'You have not purchased this product or the order is not completed' });
    }

    // Find the product
    const product = await Product.findById(productId);
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Check if product is of type 'accounts'
    if (product.productType !== 'accounts') {
      return res.status(400).json({ message: 'This product does not support magic link generation' });
    }

    // Check if product has selected emails
    if (!product.selectedEmails || product.selectedEmails.length === 0) {
      return res.status(400).json({ message: 'No email accounts associated with this product' });
    }

    // For simplicity, we'll use the first email account
    // In a real application, you might want to let the user choose which account
    const emailAccountId = product.selectedEmails[0];
    
    // Find the email account
    const emailAccount = await Emails.findById(emailAccountId);
    
    if (!emailAccount) {
      return res.status(404).json({ message: 'Email account not found' });
    }

    // Check if account is active
    if (!emailAccount.isActive) {
      return res.status(400).json({ message: 'Email account is not active' });
    }

    // Check if there's already an unused magic link for this user and email
    const existingMagicLink = await MagicLink.findOne({
      userId: emailAccountId,
      used: false,
      expiresAt: { $gt: new Date() }
    });

    if (existingMagicLink) {
      // Return the existing magic link
      const magicLinkUrl = `${process.env.MAIL_BOX}/magic-login?token=${existingMagicLink.token}`;
      
      return res.status(200).json({
        message: 'Magic link already exists',
        magicLink: magicLinkUrl,
        token: existingMagicLink.token,
        expiresAt: existingMagicLink.expiresAt
      });
    }

    // Generate a new magic link
    const token = crypto.randomBytes(32).toString('hex');
    
    // Set expiration to 1 year from now
    const expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);

    // Create magic link
    const magicLink = new MagicLink({
      userId: emailAccountId,
      token,
      expiresAt
    });
    
    await magicLink.save();

    // Generate the magic link URL
    const magicLinkUrl = `${process.env.MAIL_BOX}/magic-login?token=${token}`;

    return res.status(200).json({
      message: 'Magic link generated successfully',
      magicLink: magicLinkUrl,
      token,
      expiresAt
    });
  } catch (error) {
    console.error('Generate account magic link error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// Get purchased accounts for a user
export const getUserPurchasedAccounts = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Find all orders for this user with delivered status and paid payment
    const orders = await Order.find({
      user: req.user.id,
      status: 'delivered',
      paymentStatus: 'paid'
    }).populate({
      path: 'items.product',
      match: { productType: 'accounts' }
    });

    // Filter out orders that don't have account products
    const accountOrders = orders.filter(order => 
      order.items.some((item: IOrderItem) => {
        // When populated, item.product will be an IProduct object
        // When not populated, item.product will be an ObjectId
        const product = item.product as unknown as IProduct;
        return product && product.productType === 'accounts';
      })
    );

    // Extract purchased account products
    const purchasedAccounts = [];
    for (const order of accountOrders) {
      for (const item of order.items) {
        const product = item.product as unknown as IProduct;
        if (product && product.productType === 'accounts') {
          purchasedAccounts.push({
            orderId: order._id,
            orderDate: order.createdAt,
            product: product,
            quantity: item.quantity
          });
        }
      }
    }

    return res.status(200).json({ accounts: purchasedAccounts });
  } catch (error) {
    console.error('Get user purchased accounts error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};