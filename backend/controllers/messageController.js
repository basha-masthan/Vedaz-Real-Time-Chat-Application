const dataService = require('../services/dataService');

const messageController = {
  // POST /api/messages -> Send message via REST
  async sendMessage(req, res, next) {
    try {
      const { senderId, senderName, senderAvatar, receiverId, room, content } = req.body;

      if (!senderId || !senderName || !room || !content) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields (senderId, senderName, room, content).'
        });
      }

      const messageData = {
        senderId,
        senderName,
        senderAvatar: senderAvatar || '',
        receiverId: receiverId || room,
        room,
        content,
        status: 'sent'
      };

      const newMessage = await dataService.createMessage(messageData);

      // If socket.io io instance is available on req, emit broadcast to the room and recipient
      if (req.io) {
        req.io.to(room).emit('message:receive', newMessage);
        req.io.emit('message:broadcast', newMessage);
      }

      return res.status(201).json({
        success: true,
        message: 'Message sent successfully.',
        data: newMessage
      });
    } catch (error) {
      next(error);
    }
  },

  // GET /api/messages/room/:room -> Fetch chat history by room
  async getMessagesByRoom(req, res, next) {
    try {
      const { room } = req.params;
      const messages = await dataService.getMessagesByRoom(room);

      return res.status(200).json({
        success: true,
        count: messages.length,
        messages
      });
    } catch (error) {
      next(error);
    }
  },

  // PUT /api/messages/read/:room -> Mark messages as read
  async markAsRead(req, res, next) {
    try {
      const { room } = req.params;
      const { userId } = req.body; // the user reading the messages

      await dataService.markMessagesAsRead(room, userId);

      if (req.io) {
        req.io.to(room).emit('message:status_updated', { room, status: 'read', readBy: userId });
      }

      return res.status(200).json({
        success: true,
        message: 'Messages marked as read.'
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = messageController;
