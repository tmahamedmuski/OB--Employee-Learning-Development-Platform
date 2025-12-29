const express = require('express');
const {
  createOrder,
  getMyOrders,
  getAllOrders,
  updateOrderStatus,
} = require('../controllers/orderController');
const { auth, adminOnly } = require('../middleware/auth');

const router = express.Router();

router.use(auth);

router.route('/').post(createOrder).get(getMyOrders);
router.route('/admin').get(adminOnly, getAllOrders);
router.route('/:id/status').patch(adminOnly, updateOrderStatus);

module.exports = router;
