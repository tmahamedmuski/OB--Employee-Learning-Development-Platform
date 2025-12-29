const asyncHandler = require('express-async-handler');
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Enrollment = require('../models/Enrollment');
const UserActivity = require('../models/UserActivity');

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

const createOrder = asyncHandler(async (req, res) => {
  const { items, shippingAddress } = req.body;

  if (!items?.length) {
    res.status(400);
    throw new Error('Order items are required');
  }

  const totalPrice = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const order = await Order.create({
    user: req.user._id,
    items,
    shippingAddress,
    totalPrice,
  });

  // Create enrollments for each course in the order
  const Product = require('../models/Product');
  for (const item of items) {
    const productId = item.product || item.productId || item._id;
    if (productId) {
      // Check if product exists and is a course
      const product = await Product.findById(productId);
      if (product) {
        // Check if already enrolled
        const existingEnrollment = await Enrollment.findOne({
          user: req.user._id,
          product: productId,
        });

        if (!existingEnrollment) {
          // Create enrollment
          const enrollment = await Enrollment.create({
            user: req.user._id,
            product: productId,
          });

          // Log enrollment activity
          await logActivity(
            req.user._id,
            'course_enrolled',
            `Enrolled in course: ${product.name} (via order)`,
            {
              orderId: order._id.toString(),
              productId: productId.toString(),
              productName: product.name,
            }
          );
        }
      }
    }
  }

  // Clear cart after order
  await Cart.findOneAndUpdate({ user: req.user._id }, { $set: { items: [] } });

  res.status(201).json(order);
});

const getMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ user: req.user._id }).sort('-createdAt');
  res.json(orders);
});

const getAllOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find().populate('user', 'name email').sort('-createdAt');
  res.json(orders);
});

const updateOrderStatus = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  order.status = req.body.status || order.status;
  await order.save();

  res.json(order);
});

module.exports = { createOrder, getMyOrders, getAllOrders, updateOrderStatus };
