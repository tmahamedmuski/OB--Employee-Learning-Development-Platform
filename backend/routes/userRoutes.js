const express = require('express');
const {
  getUsers,
  getUserById,
  updateUser,
  updateUserRole,
  deleteUser,
} = require('../controllers/userController');
const { auth, adminOnly, managerOrAdmin } = require('../middleware/auth');

const router = express.Router();

// Managers and admins can view users
router.get('/', auth, managerOrAdmin, getUsers);
router.get('/:id', auth, managerOrAdmin, getUserById);

// Only admins can create, update, and delete users
router.put('/:id', auth, adminOnly, updateUser);
router.delete('/:id', auth, adminOnly, deleteUser);

module.exports = router;
