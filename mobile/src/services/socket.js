import { io } from 'socket.io-client';

export const SOCKET_URL = 'https://vedaz-real-time-chat-application.onrender.com';

let socket = null;

export const connectSocket = (userId, username) => {
  if (socket && socket.connected) {
    return socket;
  }

  socket = io(SOCKET_URL, {
    transports: ['websocket', 'polling'],
    reconnectionAttempts: 10,
    timeout: 10000,
  });

  socket.on('connect', () => {
    console.log('📱 Mobile Socket connected:', socket.id);
    if (userId && username) {
      socket.emit('user:join', { userId, username });
    }
  });

  socket.on('disconnect', () => {
    console.log('📱 Mobile Socket disconnected');
  });

  return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
