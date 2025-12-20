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
    origin: process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split(',') : ["http://localhost:3000", "http://localhost:3002", "http://157.173.127.51:3002"],
    credentials: true,
    methods: ["GET", "POST"]
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
  
  // Handle errors
  socket.on('error', (error: any) => {
    console.error(`WebSocket error for socket ${socket.id}:`, error);
  });
});

// Function to notify clients of new emails
export const notifyNewEmail = (userId: string, email: any) => {
  try {
    console.log(`Notifying user ${userId} of new email:`, email.subject);
    
    // Find all sockets for this user
    connectedClients.forEach((connectedUserId, socketId) => {
      if (connectedUserId === userId) {
        const socket = io.sockets.sockets.get(socketId);
        if (socket) {
          socket.emit('newEmail', email);
          console.log(`Sent newEmail notification to socket ${socketId} for user ${userId}`);
        }
      }
    });
  } catch (error) {
    console.error(`Error notifying user ${userId} of new email:`, error);
  }
};

// Add error handling for the HTTP server
server.on('error', (error: any) => {
  console.error(`Server error: ${error.message}`);
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Please use a different port.`);
  }
});

// Connect to MongoDB and start server
connectDB().then(() => {
  server.listen(PORT, () => {
    console.log(`Mail server is running on port ${PORT}`);
  
    // Start SMTP server
    import('./utils/smtp-server')
      .then(() => {
        console.log('SMTP server started');
      })
      .catch((error) => {
        console.error('Failed to start SMTP server:', error);
        // Don't exit the process, just log the error
      });
  });
}).catch((error) => {
  console.error('Failed to connect to MongoDB:', error);
  // Don't exit the process, just log the error
});

// Export the app for testing purposes
export default app;

// Export io for use in other modules
export { io };