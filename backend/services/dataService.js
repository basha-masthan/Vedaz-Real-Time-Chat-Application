const User = require('../models/User');
const Message = require('../models/Message');
const { getIsConnected } = require('../config/db');

// In-Memory fallback store for high reliability if MongoDB/Atlas is unreachable
const memoryStore = {
  users: [
    {
      _id: 'user_dev_1',
      username: 'Alex_Rivera',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      isOnline: true,
      lastSeen: new Date(),
      socketId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      _id: 'user_dev_2',
      username: 'Sarah_Connor',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
      isOnline: false,
      lastSeen: new Date(Date.now() - 3600000),
      socketId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      _id: 'user_dev_3',
      username: 'Liam_Chen',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      isOnline: true,
      lastSeen: new Date(),
      socketId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      _id: 'user_dev_4',
      username: 'Elena_Rostova',
      avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
      isOnline: false,
      lastSeen: new Date(Date.now() - 7200000),
      socketId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
  ],
  messages: [
    {
      _id: 'msg_1',
      senderId: 'user_dev_1',
      senderName: 'Alex_Rivera',
      senderAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      receiverId: 'general',
      room: 'general',
      content: 'Welcome to Vedaz Real-Time Chat! 🚀 Built with React, Node, Express & Socket.io.',
      status: 'read',
      createdAt: new Date(Date.now() - 86400000),
      updatedAt: new Date(Date.now() - 86400000),
    },
    {
      _id: 'msg_2',
      senderId: 'user_dev_2',
      senderName: 'Sarah_Connor',
      senderAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
      receiverId: 'general',
      room: 'general',
      content: 'The dark glassmorphism UI looks amazing! Messages and typing status sync instantly without refreshing.',
      status: 'read',
      createdAt: new Date(Date.now() - 43200000),
      updatedAt: new Date(Date.now() - 43200000),
    },
    {
      _id: 'msg_3',
      senderId: 'user_dev_3',
      senderName: 'Liam_Chen',
      senderAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      receiverId: 'general',
      room: 'general',
      content: 'Check out the read receipts (✓✓ blue) and online indicators. Let me test sending a direct message.',
      status: 'read',
      createdAt: new Date(Date.now() - 1800000),
      updatedAt: new Date(Date.now() - 1800000),
    }
  ]
};

// Helper for generating unique IDs
const generateId = (prefix = 'id') => `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;

const dataService = {
  // === USER OPERATIONS ===
  async findOrCreateUser(username, avatar) {
    if (getIsConnected()) {
      try {
        let user = await User.findOne({ username });
        if (!user) {
          user = await User.create({ username, avatar, isOnline: true, lastSeen: new Date() });
        } else {
          user.isOnline = true;
          user.lastSeen = new Date();
          if (avatar) user.avatar = avatar;
          await user.save();
        }
        return user;
      } catch (err) {
        console.warn('⚠️ Mongoose findOrCreateUser error, using memory fallback:', err.message);
      }
    }

    // Memory store fallback
    let user = memoryStore.users.find(u => u.username.toLowerCase() === username.toLowerCase());
    if (!user) {
      user = {
        _id: generateId('user'),
        username,
        avatar: avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${username}`,
        isOnline: true,
        lastSeen: new Date(),
        socketId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      memoryStore.users.push(user);
    } else {
      user.isOnline = true;
      user.lastSeen = new Date();
      if (avatar) user.avatar = avatar;
    }
    return user;
  },

  async getAllUsers() {
    if (getIsConnected()) {
      try {
        return await User.find().sort({ isOnline: -1, username: 1 });
      } catch (err) {
        console.warn('⚠️ Mongoose getAllUsers error, using memory fallback:', err.message);
      }
    }
    return [...memoryStore.users].sort((a, b) => (b.isOnline - a.isOnline) || a.username.localeCompare(b.username));
  },

  async getUserById(userId) {
    if (getIsConnected()) {
      try {
        return await User.findById(userId);
      } catch (err) {
        console.warn('⚠️ Mongoose getUserById error, using memory fallback:', err.message);
      }
    }
    return memoryStore.users.find(u => u._id === userId || u._id.toString() === userId);
  },

  async updateUserOnlineStatus(userId, isOnline, socketId = null) {
    if (getIsConnected()) {
      try {
        await User.findByIdAndUpdate(userId, {
          isOnline,
          socketId: isOnline ? socketId : null,
          lastSeen: new Date()
        });
        return;
      } catch (err) {
        console.warn('⚠️ Mongoose updateUserOnlineStatus error, using memory fallback:', err.message);
      }
    }
    const user = memoryStore.users.find(u => u._id === userId || u._id.toString() === userId);
    if (user) {
      user.isOnline = isOnline;
      user.socketId = isOnline ? socketId : null;
      user.lastSeen = new Date();
    }
  },

  async setUserStatusBySocketId(socketId, isOnline) {
    if (getIsConnected()) {
      try {
        const user = await User.findOne({ socketId });
        if (user) {
          user.isOnline = isOnline;
          user.lastSeen = new Date();
          if (!isOnline) user.socketId = null;
          await user.save();
          return user;
        }
      } catch (err) {
        console.warn('⚠️ Mongoose setUserStatusBySocketId error, using memory fallback:', err.message);
      }
    }
    const user = memoryStore.users.find(u => u.socketId === socketId);
    if (user) {
      user.isOnline = isOnline;
      user.lastSeen = new Date();
      if (!isOnline) user.socketId = null;
      return user;
    }
    return null;
  },

  // === MESSAGE OPERATIONS ===
  async createMessage(msgData) {
    if (getIsConnected()) {
      try {
        const newMsg = await Message.create(msgData);
        return newMsg;
      } catch (err) {
        console.warn('⚠️ Mongoose createMessage error, using memory fallback:', err.message);
      }
    }
    const newMsg = {
      _id: generateId('msg'),
      ...msgData,
      status: msgData.status || 'sent',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    memoryStore.messages.push(newMsg);
    return newMsg;
  },

  async getMessagesByRoom(room) {
    if (getIsConnected()) {
      try {
        return await Message.find({ room }).sort({ createdAt: 1 });
      } catch (err) {
        console.warn('⚠️ Mongoose getMessagesByRoom error, using memory fallback:', err.message);
      }
    }
    return memoryStore.messages.filter(m => m.room === room).sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  },

  async markMessagesAsRead(room, receiverId) {
    if (getIsConnected()) {
      try {
        await Message.updateMany(
          { room, status: { $ne: 'read' } },
          { $set: { status: 'read' } }
        );
        return;
      } catch (err) {
        console.warn('⚠️ Mongoose markMessagesAsRead error, using memory fallback:', err.message);
      }
    }
    memoryStore.messages.forEach(m => {
      if (m.room === room && m.status !== 'read') {
        m.status = 'read';
        m.updatedAt = new Date();
      }
    });
  },

  async markMessagesAsDelivered(userId) {
    if (getIsConnected()) {
      try {
        await Message.updateMany(
          { receiverId: userId, status: 'sent' },
          { $set: { status: 'delivered' } }
        );
        return;
      } catch (err) {
        console.warn('⚠️ Mongoose markMessagesAsDelivered error, using memory fallback:', err.message);
      }
    }
    memoryStore.messages.forEach(m => {
      if (m.receiverId === userId && m.status === 'sent') {
        m.status = 'delivered';
        m.updatedAt = new Date();
      }
    });
  }
};

module.exports = dataService;
