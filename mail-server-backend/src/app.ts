import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes';
import emailRoutes from './routes/emailRoutes';
import emailReceiveRoutes from './routes/emailReceiveRoutes';
import adminRoutes from './routes/adminRoutes';
import sequelize from './config/db';
import { QueryTypes } from 'sequelize';

// Load environment variables
dotenv.config();

// Create Express app
const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet()); // Security headers
app.use(cors()); // Enable CORS
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/emails', emailRoutes);
app.use('/api/email-receive', emailReceiveRoutes);
app.use('/api/admin', adminRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ message: 'Mail server is running' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Internal server error' });
});

// Sync database and start server
const startServer = async () => {
  try {
    // Test database connection
    await sequelize.authenticate();
    console.log('Database connection established successfully.');

    // Sync models with improved error handling
    try {
      await sequelize.sync({ alter: true });
      console.log('Database synced successfully.');
    } catch (syncError: any) {
      console.error('Database sync error:', syncError.message);
      
      // Handle SQLite backup table issues
      if (syncError.name === 'SequelizeDatabaseError' && syncError.parent?.code === 'SQLITE_ERROR') {
        console.log('Attempting to resolve SQLite backup table issue...');
        
        try {
          // Check if users_backup table exists
          const tables: any[] = await sequelize.query(
            "SELECT name FROM sqlite_master WHERE type='table' AND name='users_backup';",
            { type: QueryTypes.SELECT }
          );
          
          if (tables.length > 0) {
            console.log('Dropping users_backup table to resolve schema mismatch...');
            await sequelize.query('DROP TABLE IF EXISTS users_backup;');
            console.log('users_backup table dropped successfully.');
            
            // Try syncing again
            await sequelize.sync({ alter: true });
            console.log('Database synced successfully after dropping backup table.');
          } else {
            // Try a different approach
            console.log('Attempting to recreate tables...');
            await sequelize.sync({ force: true });
            console.log('Database recreated successfully.');
          }
        } catch (cleanupError) {
          console.error('Failed to clean up backup table:', cleanupError);
          
          // Final fallback: force sync (WARNING: This will drop data!)
          // Only use this in development environments
          if (process.env.NODE_ENV !== 'production') {
            console.log('Attempting force sync (will drop data!)...');
            await sequelize.sync({ force: true });
            console.log('Database force synced successfully.');
          } else {
            throw new Error('Unable to sync database in production environment');
          }
        }
      } else if (syncError.name === 'SequelizeUniqueConstraintError') {
        console.log('Attempting to resolve unique constraint issue...');
        
        // Try syncing without altering existing tables
        try {
          await sequelize.sync();
          console.log('Database synced successfully with default sync.');
        } catch (fallbackError) {
          console.error('Fallback sync also failed:', fallbackError);
          
          // As a last resort, force sync (WARNING: This will drop data!)
          // Only use this in development environments
          if (process.env.NODE_ENV !== 'production') {
            console.log('Attempting force sync (will drop data!)...');
            await sequelize.sync({ force: true });
            console.log('Database force synced successfully.');
          } else {
            throw new Error('Unable to sync database in production environment');
          }
        }
      } else {
        throw syncError;
      }
    }

    // Start Express server
    app.listen(PORT, () => {
      console.log(`Mail server is running on port ${PORT}`);
    });

    // Start POP3 server
    try {
      const { startPop3Server } = await import('./pop3-server');
      startPop3Server();
      console.log('POP3 server started');
    } catch (error) {
      console.error('Failed to start POP3 server:', error);
    }
  } catch (error) {
    console.error('Unable to start server:', error);
  }
};

startServer();

export default app;