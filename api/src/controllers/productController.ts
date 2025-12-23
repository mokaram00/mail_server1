import { Request, Response } from 'express';
import Product from '../models/Product';
import { Types } from 'mongoose';
import Emails from '../models/Emails'; // Import Emails model

// Extend the Request type to include admin property
interface AdminAuthRequest extends Request {
  admin?: {
    id: string;
    role: string;
  };
}

// Create a new product
export const createProduct = async (req: AdminAuthRequest, res: Response): Promise<Response> => {
  try {
    // Check if user is admin
    if (!req.admin || req.admin.role !== 'superadmin') {
      return res.status(403).json({ message: 'Access denied. Admin rights required.' });
    }

    const { name, description, price, stock, featured, productType, selectedEmails, images } = req.body;

    // Validate required fields
    if (!name || !description || price === undefined || stock === undefined) {
      return res.status(400).json({ message: 'Name, description, price, and stock are required' });
    }

    // Validate product type
    if (productType && productType !== 'accounts' && productType !== 'other') {
      return res.status(400).json({ message: 'Invalid product type' });
    }

    // If product type is accounts, validate selected emails
    if (productType === 'accounts') {
      if (!selectedEmails || !Array.isArray(selectedEmails) || selectedEmails.length === 0) {
        return res.status(400).json({ message: 'Selected emails are required for accounts product type' });
      }

      // Validate that all selected emails exist
      const emailIds = selectedEmails.map((id: string) => new Types.ObjectId(id));
      const emails = await Emails.find({ _id: { $in: emailIds } });
      
      if (emails.length !== selectedEmails.length) {
        return res.status(400).json({ message: 'Some selected emails do not exist' });
      }
    }

    // Create new product
    const newProduct = new Product({
      name,
      description,
      price,
      stock: parseInt(stock),
      featured: featured === 'true' || featured === true,
      productType: productType || 'other',
      selectedEmails: productType === 'accounts' ? selectedEmails : undefined,
      images: Array.isArray(images) ? images : [],
    });

    await newProduct.save();

    return res.status(201).json({
      message: 'Product created successfully',
      product: newProduct
    });
  } catch (error) {
    console.error('Create product error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// Get all products
export const getAllProducts = async (req: AdminAuthRequest, res: Response): Promise<Response> => {
  try {
    // Check if user is admin and superadmin
    if (!req.admin || (req.admin.role !== 'superadmin' && req.admin.role !== 'admin')) {
      return res.status(403).json({ message: 'Access denied. Admin rights required.' });
    }

    const products = await Product.find().sort({ createdAt: -1 });

    return res.status(200).json({ products });
  } catch (error) {
    console.error('Get products error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// Get product by ID
export const getProductById = async (req: AdminAuthRequest, res: Response): Promise<Response> => {
  try {
    // Check if user is admin
    if (!req.admin || (req.admin.role !== 'superadmin' && req.admin.role !== 'admin')) {
      return res.status(403).json({ message: 'Access denied. Admin rights required.' });
    }

    const { id } = req.params;
    
    // Validate ObjectId
    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid product ID' });
    }
    
    const product = await Product.findById(id);
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    return res.status(200).json({ product });
  } catch (error) {
    console.error('Get product error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// Update product
export const updateProduct = async (req: AdminAuthRequest, res: Response): Promise<Response> => {
  try {
    // Check if user is admin
    if (!req.admin || req.admin.role !== 'superadmin') {
      return res.status(403).json({ message: 'Access denied. Admin rights required.' });
    }

    const { id } = req.params;
    const { name, description, price, stock, featured, productType, selectedEmails, images } = req.body;
    
    // Validate ObjectId
    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid product ID' });
    }
    
    // Find the product
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    // Update product fields
    product.name = name || product.name;
    product.description = description || product.description;
    product.price = price !== undefined ? price : product.price;
    product.stock = stock !== undefined ? parseInt(stock) : product.stock;
    product.featured = featured !== undefined ? (featured === 'true' || featured === true) : product.featured;
    product.productType = productType || product.productType;
    product.images = Array.isArray(images) ? images : product.images;
    
    // Handle selected emails for accounts product type
    if (productType === 'accounts') {
      if (selectedEmails && Array.isArray(selectedEmails)) {
        // Validate that all selected emails exist
        const emailIds = selectedEmails.map((emailId: string) => new Types.ObjectId(emailId));
        const emails = await Emails.find({ _id: { $in: emailIds } });
        
        if (emails.length !== selectedEmails.length) {
          return res.status(400).json({ message: 'Some selected emails do not exist' });
        }
        
        product.selectedEmails = selectedEmails;
      }
    } else {
      // Clear selected emails for non-accounts products
      product.selectedEmails = undefined;
    }

    await product.save();

    return res.status(200).json({
      message: 'Product updated successfully',
      product
    });
  } catch (error) {
    console.error('Update product error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// Delete product
export const deleteProduct = async (req: AdminAuthRequest, res: Response): Promise<Response> => {
  try {
    // Check if user is admin
    if (!req.admin || req.admin.role !== 'superadmin') {
      return res.status(403).json({ message: 'Access denied. Admin rights required.' });
    }

    const { id } = req.params;
    
    // Validate ObjectId
    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid product ID' });
    }
    
    const product = await Product.findByIdAndDelete(id);
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    return res.status(200).json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Delete product error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};