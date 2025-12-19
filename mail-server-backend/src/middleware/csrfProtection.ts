import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

// Extend the Request type to include session properties
interface SessionRequest extends Request {
  session?: {
    csrfToken?: string;
  };
}

// Generate a random CSRF token
const generateCsrfToken = (): string => {
  return crypto.randomBytes(32).toString('hex');
};

// CSRF protection middleware
export const csrfProtection = (req: SessionRequest, res: Response, next: NextFunction): void => {
  // Skip CSRF validation for GET requests
  if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') {
    // Generate a new token for GET requests and attach it to the response locals
    if (!req.session) {
      req.session = {};
    }
    
    if (!req.session.csrfToken) {
      req.session.csrfToken = generateCsrfToken();
    }
    
    res.locals.csrfToken = req.session.csrfToken;
    return next();
  }
  
  // For state-changing requests (POST, PUT, DELETE, PATCH), validate the token
  const tokenFromHeader = req.headers['x-csrf-token'] as string;
  const tokenFromBody = req.body._csrf || req.body.csrf_token;
  const sessionToken = req.session?.csrfToken;
  
  // Check if token exists in either header or body
  const providedToken = tokenFromHeader || tokenFromBody;
  
  // Validate the token
  if (!providedToken) {
    res.status(403).json({ 
      message: 'CSRF token missing', 
      error: 'CSRF token is required for this request' 
    });
    return;
  }
  
  if (!sessionToken || providedToken !== sessionToken) {
    res.status(403).json({ 
      message: 'Invalid CSRF token', 
      error: 'The provided CSRF token is invalid or expired' 
    });
    return;
  }
  
  next();
};

// Middleware to generate CSRF token for new sessions
export const csrfTokenGenerator = (req: SessionRequest, res: Response, next: NextFunction): void => {
  if (!req.session) {
    req.session = {};
  }
  
  if (!req.session.csrfToken) {
    req.session.csrfToken = generateCsrfToken();
  }
  
  res.locals.csrfToken = req.session.csrfToken;
  next();
};