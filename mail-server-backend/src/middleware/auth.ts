import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import Admin from '../models/Admin';

// Extend the Request type to include user and admin properties
interface AuthRequest extends Request {
  user?: {
    id: string;
    role: string;
  };
  admin?: {
    id: string;
    role: string;
  };
}

const auth = async (req: AuthRequest, res: Response, next: NextFunction): Promise<Response | void> => {
  try {
    // Check for token in cookies
    const token = req.cookies.token;
    
    if (!token) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_key') as { userId?: string, adminId?: string, role: string };
    
    // Check if it's a user token
    if (decoded.userId) {
      const user = await User.findById(decoded.userId).select('-password');
      if (!user) {
        return res.status(401).json({ message: 'Token is not valid' });
      }

      req.user = {
        id: user._id.toString(),
        role: user.role
      };
      req.admin = undefined; // Ensure admin is not set
    } 
    // Check if it's an admin token
    else if (decoded.adminId) {
      const admin = await Admin.findById(decoded.adminId).select('-password');
      if (!admin) {
        return res.status(401).json({ message: 'Token is not valid' });
      }

      req.admin = {
        id: admin._id.toString(),
        role: admin.role
      };
      req.user = undefined; // Ensure user is not set
    } 
    // Invalid token
    else {
      return res.status(401).json({ message: 'Token is not valid' });
    }
    
    next();
  } catch (error) {
    console.error('Auth error:', error);
    res.status(401).json({ message: 'Token is not valid' });
  }
};

export default auth;