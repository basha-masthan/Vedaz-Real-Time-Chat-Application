const dataService = require('../services/dataService');

// Map to track active socket connections to user IDs in memory
const activeSockets = new Map();

const initializeSocket = (io) => {
  io.on('connection', (socket) => {
    console.log(`⚡ New client connected: ${socket.id}`);

    // Event: User joins/logs in via socket
    socket.on('user:join', async (userData) => {
      try {
        const { userId, username } = userData;
        if (!userId) return;

        console.log(`👤 User joined socket: ${username} (${userId}) on socket ${socket.id}`);
        activeSockets.set(socket.id, userId);

        // Update online status in database / memory
        await dataService.updateUserOnlineStatus(userId, true, socket.id);

        // Join default rooms
        socket.join('general');
        socket.join('tech');
        socket.join('random');
        socket.join(userId); // Personal room for direct messages and notifications

        // Broadcast to all clients that this user is now online
        io.emit('user:status', { userId, isOnline: true, lastSeen: new Date() });

        // Also send updated users list to the joining socket immediately
        const users = await dataService.getAllUsers();
        socket.emit('users:list', users);
      } catch (err) {
        console.error('❌ Error handling user:join socket event:', err.message);
      }
    });

    // Event: Send new real-time message
    socket.on('message:send', async (data, callback) => {
      try {
        const { senderId, senderName, senderAvatar, receiverId, room, content } = data;
        if (!room || !content) {
          if (typeof callback === 'function') callback({ success: false, error: 'Room and content required.' });
          return;
        }

        const messagePayload = {
          senderId,
          senderName,
          senderAvatar: senderAvatar || '',
          receiverId: receiverId || room,
          room,
          content,
          status: 'sent'
        };

        // Check if recipient is in activeSockets (for direct messaging / rooms)
        let isRecipientActive = false;
        if (room !== 'general' && room !== 'tech' && room !== 'random') {
          // Check if any active socket corresponds to receiverId
          for (let [sId, uId] of activeSockets.entries()) {
            if (uId === receiverId || room.includes(uId)) {
              isRecipientActive = true;
              break;
            }
          }
        } else {
          isRecipientActive = true; // Room broadcast
        }

        if (isRecipientActive) {
          messagePayload.status = 'delivered';
        }

        const savedMessage = await dataService.createMessage(messagePayload);

        // Broadcast to everyone in the target room
        io.to(room).emit('message:receive', savedMessage);

        // If it's a DM between two users and room wasn't pre-joined by recipient, also emit to receiver's personal room
        if (receiverId && receiverId !== room && receiverId !== 'general' && receiverId !== 'tech' && receiverId !== 'random') {
          io.to(receiverId).emit('message:receive', savedMessage);
        }

        if (typeof callback === 'function') {
          callback({ success: true, message: savedMessage });
        }
      } catch (err) {
        console.error('❌ Error handling message:send socket event:', err.message);
        if (typeof callback === 'function') {
          callback({ success: false, error: err.message });
        }
      }
    });

    // Event: User is typing
    socket.on('typing:start', (data) => {
      const { room, senderId, senderName } = data;
      if (room) {
        socket.to(room).emit('typing:start', { room, senderId, senderName });
      }
    });

    // Event: User stopped typing
    socket.on('typing:stop', (data) => {
      const { room, senderId } = data;
      if (room) {
        socket.to(room).emit('typing:stop', { room, senderId });
      }
    });

    // Event: Message read receipt update
    socket.on('message:read', async (data) => {
      try {
        const { room, readByUserId } = data;
        if (!room) return;

        await dataService.markMessagesAsRead(room, readByUserId);

        io.to(room).emit('message:status_updated', {
          room,
          status: 'read',
          readBy: readByUserId
        });
      } catch (err) {
        console.error('❌ Error handling message:read socket event:', err.message);
      }
    });

    // Event: Client requests latest users list
    socket.on('users:get', async () => {
      try {
        const users = await dataService.getAllUsers();
        socket.emit('users:list', users);
      } catch (err) {
        console.error('❌ Error fetching users list via socket:', err.message);
      }
    });

    // Event: Disconnection
    socket.on('disconnect', async () => {
      console.log(`🔴 Client disconnected: ${socket.id}`);
      const userId = activeSockets.get(socket.id);
      if (userId) {
        activeSockets.delete(socket.id);
      }

      const updatedUser = await dataService.setUserStatusBySocketId(socket.id, false);
      const targetUserId = userId || (updatedUser ? updatedUser._id : null);

      if (targetUserId) {
        io.emit('user:status', {
          userId: targetUserId,
          isOnline: false,
          lastSeen: new Date()
        });
      }
    });
  });
};

module.exports = { initializeSocket };
