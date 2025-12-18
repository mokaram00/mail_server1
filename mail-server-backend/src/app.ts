import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/authRoutes';
import adminRoutes from './routes/adminRoutes';
import adminAuthRoutes from './routes/adminAuthRoutes';
import realTimeEmailRoutes from './routes/realTimeEmailRoutes';


dotenv.config();

// Create Express app
const app = express();
const PORT = process.env.PORT || 3001;

// CORS configuration to allow credentials
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true, // Allow cookies to be sent with requests
  optionsSuccessStatus: 200
};

// Middleware
app.use(helmet()); // Security headers
app.use(cors(corsOptions)); // Enable CORS with specific options
app.use(cookieParser()); // Parse cookies
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies


// Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/admin-auth', adminAuthRoutes);
app.use('/api/emails', realTimeEmailRoutes);

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
  console.error(`[${new Date().toISOString()}] Error:`, err.stack);
  res.status(500).json({ message: 'Internal server error' });
});

export default app;