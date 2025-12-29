const express = require('express');
const {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} = require('../controllers/categoryController');
const { auth, adminOnly } = require('../middleware/auth');

const router = express.Router();

router.route('/').get(getCategories).post(auth, adminOnly, createCategory);
router
  .route('/:id')
  .put(auth, adminOnly, updateCategory)
  .delete(auth, adminOnly, deleteCategory);

module.exports = router;
