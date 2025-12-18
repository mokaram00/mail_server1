import { useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';

const useWebSocket = (userId: string | null) => {
  const [socket, setSocket] = useState<any>(null);
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<any>(null);

  useEffect(() => {
    if (!userId) return;

    // Connect to WebSocket server
    const newSocket = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001');
    socketRef.current = newSocket;
    setSocket(newSocket);

    // Handle connection
    newSocket.on('connect', () => {
      console.log('Connected to WebSocket server');
      setConnected(true);
      
      // Register user with the server
      newSocket.emit('register', userId);
    });

    // Handle disconnection
    newSocket.on('disconnect', () => {
      console.log('Disconnected from WebSocket server');
      setConnected(false);
    });

    // Clean up on unmount
    return () => {
      newSocket.close();
    };
  }, [userId]);

  return { socket: socketRef.current, connected };
};

export default useWebSocket;