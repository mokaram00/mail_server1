import { useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';

const useWebSocket = (userId: string | null) => {
  const [socket, setSocket] = useState<any>(null);
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<any>(null);

  useEffect(() => {
    console.log('WebSocket hook called with userId:', userId);
    
    // Clear any existing timeout
    if ((window as any).wsInitTimer) {
      clearTimeout((window as any).wsInitTimer);
      delete (window as any).wsInitTimer;
    }
    
    if (!userId) {
      console.log('No userId provided, skipping WebSocket connection');
      // Set up a delayed check in case userId becomes available later
      (window as any).wsInitTimer = setTimeout(() => {
        // Re-run the effect if userId is now available
        if (userId) {
          // Force re-render by updating a dummy state or similar mechanism
          // For now, we'll just log that we're still waiting
          console.log('Still waiting for userId to become available');
        }
      }, 3000);
      
      return;
    }

    // Small delay to ensure everything is ready
    (window as any).wsInitTimer = setTimeout(() => {
      console.log('Creating WebSocket connection for userId:', userId);
      
      // Connect to WebSocket server
      const newSocket = io(process.env.NEXT_PUBLIC_API_URL || '', {
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        transports: ['websocket', 'polling'],
        timeout: 10000, // 10 second timeout
      });
      
      socketRef.current = newSocket;
      setSocket(newSocket);
      
      console.log('WebSocket instance created', { url: process.env.NEXT_PUBLIC_API_URL });

      // Handle connection
      newSocket.on('connect', () => {
        console.log('Connected to WebSocket server', { socketId: newSocket.id });
        setConnected(true);
        
        // Register user with the server
        newSocket.emit('register', userId);
        console.log('User registered with server', { userId });
      });

      // Handle disconnection
      newSocket.on('disconnect', (reason) => {
        console.log('Disconnected from WebSocket server:', reason);
        setConnected(false);
        
        // Attempt to reconnect manually if needed
        if (reason === 'io server disconnect') {
          // Server actively disconnected, reconnect manually
          console.log('Attempting manual reconnection...');
          newSocket.connect();
        }
      });
      
      // Handle connection errors
      newSocket.on('connect_error', (error) => {
        console.error('WebSocket connection error:', error);
        console.log('Connection error details:', {
          message: error.message,
          stack: error.stack
        });
        setConnected(false);
      });
      
      // Handle reconnection attempts
      newSocket.on('reconnect_attempt', (attempt) => {
        console.log('Reconnection attempt:', attempt);
      });
      
      // Handle successful reconnection
      newSocket.on('reconnect', (attempt) => {
        console.log('Reconnected successfully:', attempt);
        setConnected(true);
      });
      
      // Handle reconnection errors
      newSocket.on('reconnect_error', (error) => {
        console.error('Reconnection error:', error);
      });
      
      // Handle connection timeout
      newSocket.on('connect_timeout', (timeout) => {
        console.error('WebSocket connection timeout:', timeout);
      });

      // Clean up on unmount
      return () => {
        console.log('Cleaning up WebSocket connection for userId:', userId);
        newSocket.close();
      };
    }, 100); // Small delay to ensure userId is properly set

    // Clean up timeout on unmount
    return () => {
      console.log('Cleaning up WebSocket hook timeout');
      if ((window as any).wsInitTimer) {
        clearTimeout((window as any).wsInitTimer);
        delete (window as any).wsInitTimer;
      }
    };
  }, [userId]);

  return { socket, connected };
};

export default useWebSocket;