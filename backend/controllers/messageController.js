const asyncHandler = require('express-async-handler');
const Message = require('../models/Message');
const User = require('../models/User');

// Send a message
const sendMessage = asyncHandler(async (req, res) => {
  const { to, subject, content } = req.body;
  const from = req.user._id;

  if (!to || !subject || !content) {
    res.status(400);
    throw new Error('To, subject, and content are required');
  }

  // Verify recipient exists
  const recipient = await User.findById(to);
  if (!recipient) {
    res.status(404);
    throw new Error('Recipient not found');
  }

  // Check permissions based on roles
  const senderRole = req.user.role;
  const recipientRole = recipient.role;

  // Users can only message admins
  if (senderRole === 'user' && recipientRole !== 'admin') {
    res.status(403);
    throw new Error('Users can only message admins');
  }

  // Managers can only message admins
  if (senderRole === 'manager' && recipientRole !== 'admin') {
    res.status(403);
    throw new Error('Managers can only message admins');
  }

  // Admins can message users and managers
  if (senderRole === 'admin' && recipientRole === 'admin') {
    res.status(403);
    throw new Error('Admins cannot message other admins');
  }

  const message = await Message.create({
    from,
    to,
    subject,
    content,
  });

  const populatedMessage = await Message.findById(message._id)
    .populate('from', 'name email role')
    .populate('to', 'name email role');

  res.status(201).json(populatedMessage);
});

// Get messages received by the current user
const getReceivedMessages = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { unreadOnly } = req.query;

  const filter = { to: userId };
  if (unreadOnly === 'true') {
    filter.read = false;
  }

  const messages = await Message.find(filter)
    .populate('from', 'name email role avatarUrl')
    .sort({ createdAt: -1 });

  res.json(messages);
});

// Get messages sent by the current user
const getSentMessages = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const messages = await Message.find({ from: userId })
    .populate('to', 'name email role avatarUrl')
    .sort({ createdAt: -1 });

  res.json(messages);
});

// Get a single message
const getMessage = asyncHandler(async (req, res) => {
  const message = await Message.findById(req.params.id)
    .populate('from', 'name email role avatarUrl')
    .populate('to', 'name email role avatarUrl');

  if (!message) {
    res.status(404);
    throw new Error('Message not found');
  }

  // Check if user has permission to view this message
  if (message.to._id.toString() !== req.user._id.toString() &&
      message.from._id.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized to view this message');
  }

  // Mark as read if the current user is the recipient
  if (message.to._id.toString() === req.user._id.toString() && !message.read) {
    message.read = true;
    message.readAt = new Date();
    await message.save();
  }

  res.json(message);
});

// Mark message as read
const markAsRead = asyncHandler(async (req, res) => {
  const message = await Message.findById(req.params.id);

  if (!message) {
    res.status(404);
    throw new Error('Message not found');
  }

  // Check if user is the recipient
  if (message.to.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized to mark this message as read');
  }

  message.read = true;
  message.readAt = new Date();
  await message.save();

  res.json(message);
});

// Delete a message
const deleteMessage = asyncHandler(async (req, res) => {
  const message = await Message.findById(req.params.id);

  if (!message) {
    res.status(404);
    throw new Error('Message not found');
  }

  // Check if user is the sender or recipient
  if (message.from.toString() !== req.user._id.toString() &&
      message.to.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized to delete this message');
  }

  await Message.findByIdAndDelete(req.params.id);

  res.json({ message: 'Message deleted' });
});

// Get users that the current user can message
const getMessageableUsers = asyncHandler(async (req, res) => {
  const currentUser = req.user;
  let filter = {};

  // Users can only see admins
  if (currentUser.role === 'user') {
    filter.role = 'admin';
  }
  // Managers can only see admins
  else if (currentUser.role === 'manager') {
    filter.role = 'admin';
  }
  // Admins can see users and managers
  else if (currentUser.role === 'admin') {
    filter.role = { $in: ['user', 'manager'] };
  }

  // Exclude current user
  filter._id = { $ne: currentUser._id };

  const users = await User.find(filter)
    .select('name email role avatarUrl')
    .sort({ name: 1 });

  res.json(users);
});

module.exports = {
  sendMessage,
  getReceivedMessages,
  getSentMessages,
  getMessage,
  markAsRead,
  deleteMessage,
  getMessageableUsers,
};

