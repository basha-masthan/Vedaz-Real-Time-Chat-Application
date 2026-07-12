import { io } from 'socket.io-client';

// Note: For Android emulator use 'http://10.0.2.2:5000', for iOS simulator or local web use 'http://localhost:5000'
// Change to your PC's local IP (e.g. 'http://192.168.1.X:5000') when testing on real physical devices via Expo Go!
export const SOCKET_URL = 'http://localhost:5000';

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
