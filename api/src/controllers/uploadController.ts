import { Request, Response } from 'express';
import path from 'path';

// Upload images
export const uploadImages = async (req: Request, res: Response): Promise<Response> => {
  try {
    console.log('Upload images request received with body:', req.body);
    console.log('Upload images request received with files:', req.files);
    
    // Check if user is admin
    const admin = (req as any).admin;
    if (!admin || admin.role !== 'superadmin') {
      return res.status(403).json({ message: 'Access denied. Superadmin rights required.' });
    }

    // Check if files were uploaded
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      return res.status(400).json({ message: 'No files were uploaded' });
    }

    // Get product ID from request body
    const productId = req.body.productId;
    console.log('Product ID from request body:', productId);

    // Generate URLs for the uploaded files
    const fileUrls: string[] = files.map((file: Express.Multer.File) => {
      // If product ID is provided, the file is in a subdirectory
      if (productId) {
        return `/uploads/${productId}/${file.filename}`;
      } else {
        return `/uploads/${file.filename}`;
      }
    });

    console.log('Generated file URLs:', fileUrls);
    
    return res.status(200).json({
      message: 'Files uploaded successfully',
      files: fileUrls
    });
  } catch (error) {
    console.error('Upload error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};