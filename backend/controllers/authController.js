const dataService = require('../services/dataService');

const authController = {
  // POST /api/auth/login (or dummy auth registration)
  async login(req, res, next) {
    try {
      const { username, avatar } = req.body;
      if (!username || typeof username !== 'string' || username.trim() === '') {
        return res.status(400).json({ success: false, message: 'Username is required.' });
      }

      const cleanUsername = username.trim();
      const user = await dataService.findOrCreateUser(cleanUsername, avatar);

      return res.status(200).json({
        success: true,
        message: 'Authentication successful',
        user
      });
    } catch (error) {
      next(error);
    }
  },

  // GET /api/auth/users
  async getUsers(req, res, next) {
    try {
      const users = await dataService.getAllUsers();
      return res.status(200).json({
        success: true,
        count: users.length,
        users
      });
    } catch (error) {
      next(error);
    }
  },

  // GET /api/auth/users/:id
  async getUserById(req, res, next) {
    try {
      const user = await dataService.getUserById(req.params.id);
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found.' });
      }
      return res.status(200).json({ success: true, user });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = authController;
