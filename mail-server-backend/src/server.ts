import app from './app';
import { connectDB } from './config/mongoDb';

const PORT = process.env.PORT || 3001;

// Connect to MongoDB and start server
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Mail server is running on port ${PORT}`);
    
    // Start POP3 server
    import('./pop3-server')
      .then((module) => {
        module.startPop3Server();
        console.log('POP3 server started');
      })
      .catch((error) => {
        console.error('Failed to start POP3 server:', error);
      });
      
    // Start SMTP server
    import('./smtp-server')
      .then(() => {
        console.log('SMTP server started');
      })
      .catch((error) => {
        console.error('Failed to start SMTP server:', error);
      });
  });
}).catch((error) => {
  console.error('Failed to connect to MongoDB:', error);
  process.exit(1);
});

// Export the app for testing purposes
export default app;