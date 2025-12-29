const express = require('express');
const {
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem,
  clearCart,
} = require('../controllers/cartController');
const { auth } = require('../middleware/auth');

const router = express.Router();

router.use(auth);

router.route('/').get(getCart).post(addToCart).delete(clearCart);
router.route('/item').put(updateCartItem);
router.route('/item/:productId').delete(removeCartItem);

module.exports = router;
