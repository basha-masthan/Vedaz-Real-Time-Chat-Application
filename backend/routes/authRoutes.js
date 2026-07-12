const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.post('/login', authController.login);
router.get('/users', authController.getUsers);
router.get('/users/:id', authController.getUserById);

module.exports = router;
