import { Request, Response } from 'express';
import Coupon from '../models/Coupon';
import { Types } from 'mongoose';

// Extend the Request type to include admin property
interface AdminAuthRequest extends Request {
  admin?: {
    id: string;
    role: string;
  };
}

// Create a new coupon
export const createCoupon = async (req: AdminAuthRequest, res: Response): Promise<Response> => {
  try {
    // Check if user is admin
    if (!req.admin || req.admin.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin rights required.' });
    }

    const { 
      code, 
      discountType, 
      discountValue, 
      minimumOrderAmount, 
      maximumDiscountAmount, 
      startDate, 
      endDate, 
      usageLimit, 
      active,
      applicableProducts,
      applicableCategories
    } = req.body;

    // Validate required fields
    if (!code || !discountType || discountValue === undefined) {
      return res.status(400).json({ message: 'Code, discountType, and discountValue are required' });
    }

    // Check if coupon code already exists
    const existingCoupon = await Coupon.findOne({ code: code.toUpperCase() });
    if (existingCoupon) {
      return res.status(400).json({ message: 'Coupon code already exists' });
    }

    // Create new coupon
    const newCoupon = new Coupon({
      code: code.toUpperCase(),
      discountType,
      discountValue,
      minimumOrderAmount,
      maximumDiscountAmount,
      startDate,
      endDate,
      usageLimit,
      active: active !== undefined ? active : true,
      applicableProducts,
      applicableCategories
    });

    await newCoupon.save();

    return res.status(201).json({
      message: 'Coupon created successfully',
      coupon: newCoupon
    });
  } catch (error) {
    console.error('Create coupon error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// Get all coupons
export const getCoupons = async (req: AdminAuthRequest, res: Response): Promise<Response> => {
  try {
    // Check if user is admin
    if (!req.admin || req.admin.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin rights required.' });
    }
    const { page = '1', limit = '10', search = '', active } = req.query;
    
    const pageNumber = parseInt(page as string);
    const limitNumber = parseInt(limit as string);
    const skip = (pageNumber - 1) * limitNumber;
    
    // Build filter object
    const filter: any = {};
    
    // Search filter
    if (search) {
      filter.code = { $regex: search, $options: 'i' };
    }
    
    // Active filter
    if (active !== undefined) {
      filter.active = active === 'true';
    }
    
    // Get coupons with pagination
    const coupons = await Coupon.find(filter)
      .skip(skip)
      .limit(limitNumber)
      .sort({ createdAt: -1 });
      
    // Get total count for pagination
    const total = await Coupon.countDocuments(filter);
    
    return res.status(200).json({
      coupons,
      pagination: {
        currentPage: pageNumber,
        totalPages: Math.ceil(total / limitNumber),
        totalCoupons: total,
        hasNext: pageNumber < Math.ceil(total / limitNumber),
        hasPrev: pageNumber > 1,
      }
    });
  } catch (error) {
    console.error('Get coupons error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// Get coupon by ID
export const getCouponById = async (req: AdminAuthRequest, res: Response): Promise<Response> => {
  try {
    // Check if user is admin
    if (!req.admin || req.admin.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin rights required.' });
    }
    const { id } = req.params;
    
    // Validate ObjectId
    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid coupon ID' });
    }
    
    const coupon = await Coupon.findById(id);
    
    if (!coupon) {
      return res.status(404).json({ message: 'Coupon not found' });
    }
    
    return res.status(200).json({ coupon });
  } catch (error) {
    console.error('Get coupon error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// Update coupon
export const updateCoupon = async (req: AdminAuthRequest, res: Response): Promise<Response> => {
  try {
    // Check if user is admin
    if (!req.admin || req.admin.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin rights required.' });
    }
    
    const { id } = req.params;
    const { 
      code, 
      discountType, 
      discountValue, 
      minimumOrderAmount, 
      maximumDiscountAmount, 
      startDate, 
      endDate, 
      usageLimit, 
      active,
      applicableProducts,
      applicableCategories
    } = req.body;
    
    // Validate ObjectId
    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid coupon ID' });
    }
    
    // Check if coupon code already exists (if code is being changed)
    if (code) {
      const existingCoupon = await Coupon.findOne({ 
        code: code.toUpperCase(), 
        _id: { $ne: id } 
      });
      if (existingCoupon) {
        return res.status(400).json({ message: 'Coupon code already exists' });
      }
    }
    
    // Build update object
    const update: any = {};
    if (code) update.code = code.toUpperCase();
    if (discountType) update.discountType = discountType;
    if (discountValue !== undefined) update.discountValue = discountValue;
    if (minimumOrderAmount !== undefined) update.minimumOrderAmount = minimumOrderAmount;
    if (maximumDiscountAmount !== undefined) update.maximumDiscountAmount = maximumDiscountAmount;
    if (startDate) update.startDate = startDate;
    if (endDate) update.endDate = endDate;
    if (usageLimit !== undefined) update.usageLimit = usageLimit;
    if (active !== undefined) update.active = active;
    if (applicableProducts) update.applicableProducts = applicableProducts;
    if (applicableCategories) update.applicableCategories = applicableCategories;
    
    const coupon = await Coupon.findByIdAndUpdate(
      id,
      { $set: update },
      { new: true, runValidators: true }
    );
    
    if (!coupon) {
      return res.status(404).json({ message: 'Coupon not found' });
    }
    
    return res.status(200).json({
      message: 'Coupon updated successfully',
      coupon
    });
  } catch (error) {
    console.error('Update coupon error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// Delete coupon
export const deleteCoupon = async (req: AdminAuthRequest, res: Response): Promise<Response> => {
  try {
    // Check if user is admin
    if (!req.admin || req.admin.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin rights required.' });
    }
    
    const { id } = req.params;
    
    // Validate ObjectId
    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid coupon ID' });
    }
    
    const coupon = await Coupon.findByIdAndDelete(id);
    
    if (!coupon) {
      return res.status(404).json({ message: 'Coupon not found' });
    }
    
    return res.status(200).json({
      message: 'Coupon deleted successfully'
    });
  } catch (error) {
    console.error('Delete coupon error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};