import React, { createContext, useState, useEffect, useContext, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const { currentUser } = useAuth();
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [usersList, setUsersList] = useState([]);
  const [typingUsers, setTypingUsers] = useState({}); // { roomName: [username1, username2] }
  const socketRef = useRef(null);

  const getBackendUrl = () => {
    const envUrl = import.meta.env.VITE_BACKEND_URL;
    if (envUrl && !envUrl.includes('localhost')) return envUrl;
    if (typeof window !== 'undefined' && window.location && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
      return 'https://vedaz-real-time-chat-application.onrender.com';
    }
    return envUrl || 'http://localhost:5000';
  };
  const SOCKET_URL = getBackendUrl();

  useEffect(() => {
    if (!currentUser) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    // Initialize Socket connection
    const newSocket = io(SOCKET_URL, {
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      timeout: 10000,
      transports: ['websocket', 'polling'],
    });

    socketRef.current = newSocket;
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('⚡ Socket.io connected to server:', newSocket.id);
      setIsConnected(true);

      // Notify server user has joined
      newSocket.emit('user:join', {
        userId: currentUser._id,
        username: currentUser.username,
      });

      // Request initial users list
      newSocket.emit('users:get');
    });

    newSocket.on('disconnect', () => {
      console.log('🔴 Socket.io disconnected');
      setIsConnected(false);
    });

    // Receive updated users list
    newSocket.on('users:list', (list) => {
      setUsersList(list);
    });

    // Receive user presence status updates (online/offline)
    newSocket.on('user:status', ({ userId, isOnline, lastSeen }) => {
      setUsersList((prev) =>
        prev.map((u) => (u._id === userId ? { ...u, isOnline, lastSeen } : u))
      );
    });

    // Handle typing events
    newSocket.on('typing:start', ({ room, senderId, senderName }) => {
      if (senderId === currentUser._id) return;
      setTypingUsers((prev) => {
        const currentInRoom = prev[room] || [];
        if (!currentInRoom.includes(senderName)) {
          return { ...prev, [room]: [...currentInRoom, senderName] };
        }
        return prev;
      });
    });

    newSocket.on('typing:stop', ({ room, senderId }) => {
      if (senderId === currentUser._id) return;
      setTypingUsers((prev) => {
        const currentInRoom = prev[room] || [];
        return {
          ...prev,
          [room]: currentInRoom.filter((name) => name !== senderName && senderId !== senderId),
        };
      });
    });

    return () => {
      newSocket.disconnect();
    };
  }, [currentUser]);

  // Helper functions exposed via Context
  const sendMessageSocket = (payload, callback) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('message:send', payload, callback);
    } else {
      if (typeof callback === 'function') {
        callback({ success: false, error: 'Socket disconnected' });
      }
    }
  };

  const sendTypingStart = (room) => {
    if (socketRef.current && isConnected && currentUser) {
      socketRef.current.emit('typing:start', {
        room,
        senderId: currentUser._id,
        senderName: currentUser.username,
      });
    }
  };

  const sendTypingStop = (room) => {
    if (socketRef.current && isConnected && currentUser) {
      socketRef.current.emit('typing:stop', {
        room,
        senderId: currentUser._id,
      });
    }
  };

  const notifyMessageRead = (room) => {
    if (socketRef.current && isConnected && currentUser) {
      socketRef.current.emit('message:read', {
        room,
        readByUserId: currentUser._id,
      });
    }
  };

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        usersList,
        typingUsers,
        sendMessageSocket,
        sendTypingStart,
        sendTypingStop,
        notifyMessageRead,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
