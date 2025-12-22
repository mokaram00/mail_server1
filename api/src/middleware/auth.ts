import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import Emails from '../models/Emails';
import Admin from '../models/Admin';
import { User } from '../models/User'; // Import User model

// Extend the Request type to include user and admin properties
interface AuthRequest extends Request {
  user?: {
    id: string;
  };
  admin?: {
    id: string;
    role: string;
  };
}

const auth = (requiredType: 'admin' | 'inbox' | 'user') => {
  return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tokens = {
        admin: req.cookies.admin_token,
        inbox: req.cookies.inbox_token,
        user: req.cookies.user_token,
      };

      const token = tokens[requiredType];

      if (!token) {
        res.status(401).json({ message: 'No token found for ' + requiredType });
        return;
      }

      // Log for debugging
      console.log(`Verifying ${requiredType} token:`, token);
      
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_key') as any;
      
      // Log decoded token for debugging
      console.log('Decoded token:', decoded);

      switch (requiredType) {
        case 'admin': {
          const admin = await Admin.findById(decoded.adminId).select('-password');
          if (!admin) {
            res.status(401).json({ message: 'Invalid admin token' });
            return;
          }
          req.admin = { id: admin._id.toString(), role: admin.role };
          req.user = undefined;
          break;
        }
        case 'user': {
          // Use User model instead of Emails model for user authentication
          const user = await User.findById(decoded.userId).select('-password');
          if (!user) {
            res.status(401).json({ message: 'Invalid user token' });
            return;
          }
          req.user = { id: user._id.toString() };
          req.admin = undefined;
          break;
        }
        case 'inbox': {
          const inbox = await Emails.findById(decoded.userId).select('-password');
          if (!inbox) {
            res.status(401).json({ message: 'Invalid inbox token' });
            return;
          }
          req.user = { id: inbox._id.toString() };
          req.admin = undefined;
          break;
        }
      }

      next();
    } catch (error) {
      console.error('Auth error:', error);
      res.status(401).json({ message: 'Token is not valid' });
    }
  };
};

export default auth;