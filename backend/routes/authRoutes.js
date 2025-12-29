const express = require('express');
const {
  registerUser,
  loginUser,
  getProfile,
  requestPasswordReset,
  verifyOtp,
  resetPasswordWithOtp,
  updateProfile,
  uploadAvatar,
  deleteAvatar,
} = require('../controllers/authController');
const { auth } = require('../middleware/auth');
const upload = require('../utils/upload');

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/password/forgot', requestPasswordReset);
router.post('/password/verify-otp', verifyOtp);
router.post('/password/reset', resetPasswordWithOtp);
router.get('/me', auth, getProfile);
router.put('/profile', auth, updateProfile);
router.post('/upload-avatar', auth, upload.single('avatar'), uploadAvatar);
router.delete('/upload-avatar', auth, deleteAvatar);

module.exports = router;
