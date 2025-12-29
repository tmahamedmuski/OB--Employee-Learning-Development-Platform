const express = require('express');
const {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
} = require('../controllers/productController');
const { auth, adminOnly } = require('../middleware/auth');

const router = express.Router();

router.route('/').get(getProducts).post(auth, adminOnly, createProduct);
router
  .route('/:id')
  .get(getProduct)
  .put(auth, adminOnly, updateProduct)
  .delete(auth, adminOnly, deleteProduct);

module.exports = router;
