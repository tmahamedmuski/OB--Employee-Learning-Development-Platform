const express = require('express');
const {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
} = require('../controllers/wishlistController');
const { auth } = require('../middleware/auth');

const router = express.Router();

router.use(auth);

router.route('/').get(getWishlist).post(addToWishlist);
router.route('/:productId').delete(removeFromWishlist);

module.exports = router;
