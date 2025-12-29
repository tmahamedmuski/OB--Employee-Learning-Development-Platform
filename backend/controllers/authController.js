const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const PasswordResetToken = require('../models/PasswordResetToken');
const UserActivity = require('../models/UserActivity');
const generateToken = require('../utils/generateToken');
const sendEmail = require('../utils/sendEmail');

// Helper function to log activity
const logActivity = async (userId, action, details, metadata = {}) => {
  try {
    await UserActivity.create({
      user: userId,
      action,
      details,
      metadata,
    });
  } catch (error) {
    console.error('Failed to log activity:', error);
  }
};

const getOtpExpiryMinutes = () => {
  const minutes = Number(process.env.PASSWORD_RESET_EXP_MINUTES || 10);
  return Number.isNaN(minutes) ? 10 : minutes;
};

const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password) {
    res.status(400);
    throw new Error('Name, email and password are required');
  }

  const userExists = await User.findOne({ email });
  if (userExists) {
    res.status(400);
    throw new Error('User already exists');
  }

  const user = await User.create({ name, email, password, role });
  const token = generateToken(user._id, user.role);

  res.status(201).json({
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  });
});

const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });

  if (!user || !(await user.matchPassword(password))) {
    res.status(401);
    throw new Error('Invalid credentials');
  }

  const token = generateToken(user._id, user.role);

  // Log login activity
  await logActivity(
    user._id,
    'login',
    `User logged in`,
    {
      email: user.email,
      role: user.role,
      ipAddress: req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress,
    }
  );

  res.json({
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  });
});

const getProfile = asyncHandler(async (req, res) => {
  res.json({
    id: req.user._id,
    name: req.user.name,
    email: req.user.email,
    role: req.user.role,
    avatarUrl: req.user.avatarUrl,
  });
});

const updateProfile = asyncHandler(async (req, res) => {
  const { name, avatarUrl } = req.body;
  const user = await User.findById(req.user._id);

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  const oldName = user.name;
  if (name) user.name = name;
  if (avatarUrl !== undefined) user.avatarUrl = avatarUrl;

  await user.save();

  // Log profile update activity
  if (name && name !== oldName) {
    await logActivity(
      user._id,
      'profile_updated',
      `Profile updated: name changed`,
      { oldName, newName: name }
    );
  }

  res.json({
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    avatarUrl: user.avatarUrl,
  });
});

const uploadAvatar = asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(400);
    throw new Error('No file uploaded');
  }

  const user = await User.findById(req.user._id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  // Delete old avatar if exists
  if (user.avatarUrl) {
    const oldPath = user.avatarUrl.replace(`${req.protocol}://${req.get('host')}/uploads/`, '');
    const fs = require('fs');
    const path = require('path');
    const oldFilePath = path.join(__dirname, '../uploads', oldPath);
    if (fs.existsSync(oldFilePath)) {
      fs.unlinkSync(oldFilePath);
    }
  }

  // Save new avatar URL
  const avatarUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
  user.avatarUrl = avatarUrl;
  await user.save();

  res.json({
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    avatarUrl: user.avatarUrl,
  });
});

const deleteAvatar = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  if (user.avatarUrl) {
    const fs = require('fs');
    const path = require('path');
    const oldPath = user.avatarUrl.replace(/^https?:\/\/[^/]+/, '');
    const oldFilePath = path.join(__dirname, '../uploads', path.basename(oldPath));
    if (fs.existsSync(oldFilePath)) {
      fs.unlinkSync(oldFilePath);
    }
  }

  user.avatarUrl = undefined;
  await user.save();

  res.json({
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    avatarUrl: user.avatarUrl,
  });
});

const requestPasswordReset = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    res.status(400);
    throw new Error('Email is required');
  }

  const normalizedEmail = email.toLowerCase();
  const user = await User.findOne({ email: normalizedEmail });

  if (!user) {
    // Avoid leaking which emails exist
    return res.json({ message: 'If that email exists, an OTP was sent' });
  }

  await PasswordResetToken.deleteMany({ user: user._id });

  const otp = generateOtp();
  const expiresAt = new Date(Date.now() + getOtpExpiryMinutes() * 60 * 1000);
  // 👇 Add this line to log OTP in console
  console.log("Generated OTP for", normalizedEmail, ":", otp);


  await PasswordResetToken.create({
    user: user._id,
    email: normalizedEmail,
    otp,
    expiresAt,
  });

  const appName = process.env.APP_NAME || 'MindMeld';

  await sendEmail({
    to: normalizedEmail,
    subject: `${appName} password reset code`,
    html: `
      <p>Hello ${user.name || ''},</p>
      <p>Use the one-time code below to reset your password. It expires in ${getOtpExpiryMinutes()} minutes.</p>
      <h2 style="letter-spacing: 4px;">${otp}</h2>
      <p>If you didn’t request this, you can ignore this email.</p>
    `,
  });

  res.json({ message: 'OTP sent' });
});

const verifyOtp = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    res.status(400);
    throw new Error('Email and OTP are required');
  }

  const normalizedEmail = email.toLowerCase();
  const user = await User.findOne({ email: normalizedEmail });

  if (!user) {
    res.status(400);
    throw new Error('Invalid OTP or email');
  }

  const tokenDoc = await PasswordResetToken.findOne({
    user: user._id,
    otp,
  });

  if (!tokenDoc || tokenDoc.expiresAt < new Date()) {
    res.status(400);
    throw new Error('OTP has expired or is invalid');
  }

  res.json({ message: 'OTP verified successfully', verified: true });
});

const resetPasswordWithOtp = asyncHandler(async (req, res) => {
  const { email, otp, password } = req.body;

  if (!email || !otp || !password) {
    res.status(400);
    throw new Error('Email, OTP, and new password are required');
    
  }

  const normalizedEmail = email.toLowerCase();
  const user = await User.findOne({ email: normalizedEmail });

  if (!user) {
    res.status(400);
    throw new Error('Invalid OTP or email');
  }

  const tokenDoc = await PasswordResetToken.findOne({
    user: user._id,
    otp,
  });

  if (!tokenDoc || tokenDoc.expiresAt < new Date()) {
    res.status(400);
    throw new Error('OTP has expired or is invalid');
  }

  user.password = password;
  await user.save();

  await PasswordResetToken.deleteMany({ user: user._id });

  // Log password change activity
  await logActivity(
    user._id,
    'password_changed',
    `Password changed via OTP`,
    {}
  );

  res.json({ message: 'Password updated successfully' });
});

module.exports = {
  registerUser,
  loginUser,
  getProfile,
  updateProfile,
  uploadAvatar,
  deleteAvatar,
  requestPasswordReset,
  verifyOtp,
  resetPasswordWithOtp,
};
