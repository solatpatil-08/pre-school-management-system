const express = require('express');
const router = express.Router();
const {
  register,
  login,
  getMe,
  updateProfile,
  changePassword,
} = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const {
  registerValidator,
  loginValidator,
  updateProfileValidator,
  changePasswordValidator,
} = require('../validators/authValidator');

// Public routes
router.post('/register', registerValidator, register);
router.post('/login', loginValidator, login);

// Protected routes
router.use(authenticate);
router.get('/me', getMe);
router.put('/profile', updateProfileValidator, updateProfile);
router.put('/change-password', changePasswordValidator, changePassword);

module.exports = router;
