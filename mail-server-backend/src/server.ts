import app from './app';
import { connectDB } from './config/mongoDb';
import http from 'http';
// Import socket.io with proper typing
import { Server } from 'socket.io';

const PORT = process.env.PORT || 3001;

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO with proper typing
const io: Server = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split(',') : [],
    credentials: true
  }
});

// Store connected clients
const connectedClients = new Map<string, string>(); // socketId -> userId

// Handle WebSocket connections
io.on('connection', (socket: any) => {
  console.log(`User connected: ${socket.id}`);
  
  // Register user
  socket.on('register', (userId: string) => {
    connectedClients.set(socket.id, userId);
    console.log(`User ${userId} registered with socket ${socket.id}`);
  });
  
  // Handle disconnections
  socket.on('disconnect', () => {
    connectedClients.delete(socket.id);
    console.log(`User disconnected: ${socket.id}`);
  });
});

// Function to notify clients of new emails
export const notifyNewEmail = (userId: string, email: any) => {
  // Find all sockets for this user
  connectedClients.forEach((connectedUserId, socketId) => {
    if (connectedUserId === userId) {
      const socket = io.sockets.sockets.get(socketId);
      if (socket) {
        socket.emit('newEmail', email);
      }
    }
  });
};

// Connect to MongoDB and start server
connectDB().then(() => {
  server.listen(PORT, () => {
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