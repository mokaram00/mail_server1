import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import authRoutes from './routes/authRoutes';
import adminRoutes from './routes/adminRoutes';
import adminAuthRoutes from './routes/adminAuthRoutes';
import realTimeEmailRoutes from './routes/realTimeEmailRoutes';
import magicLinkRoutes from './routes/magicLinkRoutes';
import userAuthRoutes from './routes/userAuthRoutes';
import productRoutes from './routes/productRoutes';
import productPublicRoutes from './routes/productPublicRoutes';
import couponRoutes from './routes/couponRoutes';
import orderRoutes from './routes/orderRoutes';
import checkoutRoutes from './routes/checkoutRoutes';
import webhookRoutes from './routes/webhookRoutes';
import userProductRoutes from './routes/userProductRoutes';

dotenv.config();

// Create Express app
const app = express();
const PORT = process.env.PORT;

// Rate limiting middleware
const generalRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // limit each IP to 20 requests per windowMs for authentication endpoints
  message: {
    error: 'Too many authentication attempts, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const apiRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // limit each IP to 200 requests per windowMs for API endpoints
  message: {
    error: 'Too many API requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// قائمة الدومينات المسموح بها
const allowedOrigins = [
  'https://admin.bltnm.store',
  'https://inbox.bltnm.store',
  'https://inbox.bltnm.store/inbox',
  'https://bltnm.store',
  'https://shop.bltnm.store'
];

// إعدادات CORS
app.use(cors({
  origin: function(origin, callback) {
    // السماح بالطلبات بدون origin (مثلاً Postman أو curl)
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = `The CORS policy for this site does not allow access from the specified Origin: ${origin}`;
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  methods: ['GET','POST','PUT','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
  credentials: true
}));

// Trust proxy (مهم مع Nginx)
app.set('trust proxy', 1);

// Rate limit (عام)
app.use(generalRateLimit);

// Security
app.use(helmet());
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from uploads directory with CORS headers
app.use('/uploads', cors({
  origin: function(origin, callback) {
    // السماح بالطلبات بدون origin (مثلاً Postman أو curl)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = `The CORS policy for this site does not allow access from the specified Origin: ${origin}`;
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  methods: ['GET','HEAD','OPTIONS'],
  credentials: true
}), express.static('uploads'));

// Apply stricter rate limiting to authentication routes
app.use('/api/auth', authRateLimit);
app.use('/api/admin/auth', authRateLimit);

// Apply API rate limiting to other routes
app.use('/api', apiRateLimit);

// Routes - ORDER MATTERS! Specific routes before general ones
app.use('/api/auth', authRoutes);
app.use('/api/user', userAuthRoutes);
app.use('/api/admin/auth', adminAuthRoutes);
// Move admin routes AFTER admin auth routes to prevent conflicts
app.use('/api/admin', adminRoutes);
app.use('/api/products', productRoutes);
app.use('/api/products-public', productPublicRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/checkout', checkoutRoutes);
app.use('/api/webhooks', webhookRoutes);
app.use('/api/emails', realTimeEmailRoutes);
app.use('/api/magic-link', magicLinkRoutes);
app.use('/api/user-products', userProductRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ message: 'Mail server is running' });
});

// 404 handler
app.use((req, res) => {
  console.log(`[${new Date().toISOString()}] 404 - Route not found: ${req.method} ${req.path}`);
  res.status(404).json({ message: 'Route not found' });
});

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(`[${new Date().toISOString()}] Unhandled error:`, err.stack);
  
  // Check if headers have already been sent
  if (res.headersSent) {
    return next(err);
  }
  
  // Log the error with context
  console.error(`[${new Date().toISOString()}] Error details:`, {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    params: req.params,
    query: req.query,
    body: req.body
  });
  
  // Send appropriate error response based on error type
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ message: 'Invalid JSON in request body' });
  }
  
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ message: 'Request payload too large' });
  }
  
  // Default error response
  res.status(500).json({ 
    message: process.env.NODE_ENV === 'production' 
      ? 'An unexpected error occurred' 
      : 'Internal server error' 
  });
});

// Add a final error handler for uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error(`[${new Date().toISOString()}] Uncaught Exception:`, err);
  // Don't exit the process, just log the error
  // In production, you might want to implement a graceful shutdown
});

// Add a handler for unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error(`[${new Date().toISOString()}] Unhandled Rejection at:`, promise, 'reason:', reason);
  // Don't exit the process, just log the error
});

export default app;