import { Request, Response } from 'express';
import Product from '../models/Product';
import { Types } from 'mongoose';

// Get all products (public)
export const getProducts = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { page = '1', limit = '12', productType, search } = req.query;
    
    const pageNumber = parseInt(page as string);
    const limitNumber = parseInt(limit as string);
    const skip = (pageNumber - 1) * limitNumber;
    
    // Build filter object
    const filter: any = {};
    
    // Add filter for available products only
    filter.stock = { $gt: 0 };
    
    if (productType && productType !== 'all') {
      filter.productType = productType;
    }
    
    if (search) {
      filter.$text = { $search: search as string };
    }
    
    // Get products with pagination
    const products = await Product.find(filter)
      .sort({ featured: -1, createdAt: -1 })
      .skip(skip)
      .limit(limitNumber);
      
    // Remove selectedEmails fields from each product
    const productsWithoutSensitiveData = products.map(product => {
      const productObj = product.toObject();
      delete productObj.selectedEmails;
      return productObj;
    });
    
    // Get total count for pagination
    const total = await Product.countDocuments(filter);
    
    return res.status(200).json({
      products: productsWithoutSensitiveData,
      pagination: {
        currentPage: pageNumber,
        totalPages: Math.ceil(total / limitNumber),
        totalProducts: total,
        hasNext: pageNumber < Math.ceil(total / limitNumber),
        hasPrev: pageNumber > 1,
      }
    });
  } catch (error) {
    console.error('Get products error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// Get product by ID (public)
export const getProductById = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { id } = req.params;
    
    // Validate ObjectId
    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid product ID' });
    }
    
    const product = await Product.findById(id);
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    // Only return products with stock
    if (product.stock <= 0) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    // Remove selectedEmails fields from the product before sending response
    const productObj = product.toObject();
    delete productObj.selectedEmails;
    
    return res.status(200).json(productObj);
  } catch (error) {
    console.error('Get product by ID error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// Get product by name
export const getProductByName = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { name } = req.params;
    
    // Convert URL-encoded name back to original format
    const productName = decodeURIComponent(name).replace(/-/g, ' ');
    
    const product = await Product.findOne({
      name: { $regex: new RegExp(`^${productName}$`, 'i') }
    });
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    // Only return products with stock
    if (product.stock <= 0) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    return res.status(200).json(product);
  } catch (error) {
    console.error('Get product by name error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};