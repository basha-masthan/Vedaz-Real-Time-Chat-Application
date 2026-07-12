const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');

router.post('/', messageController.sendMessage);
router.get('/room/:room', messageController.getMessagesByRoom);
router.put('/read/:room', messageController.markAsRead);

module.exports = router;
