const express = require('express');
const {
  sendMessage,
  getReceivedMessages,
  getSentMessages,
  getMessage,
  markAsRead,
  deleteMessage,
  getMessageableUsers,
} = require('../controllers/messageController');
const { auth } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(auth);

router.get('/users', getMessageableUsers);
router.post('/', sendMessage);
router.get('/received', getReceivedMessages);
router.get('/sent', getSentMessages);
router.get('/:id', getMessage);
router.put('/:id/read', markAsRead);
router.delete('/:id', deleteMessage);

module.exports = router;

