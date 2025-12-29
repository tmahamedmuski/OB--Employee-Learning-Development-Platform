const asyncHandler = require('express-async-handler');
const Cart = require('../models/Cart');

const getCart = asyncHandler(async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id }).populate('items.product');
  res.json(cart || { user: req.user._id, items: [] });
});

const addToCart = asyncHandler(async (req, res) => {
  const { productId, quantity = 1 } = req.body;

  if (!productId) {
    res.status(400);
    throw new Error('productId is required');
  }

  let cart = await Cart.findOne({ user: req.user._id });

  if (!cart) {
    cart = await Cart.create({
      user: req.user._id,
      items: [{ product: productId, quantity }],
    });
  } else {
    const existingItem = cart.items.find(
      (item) => String(item.product) === String(productId)
    );

    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      cart.items.push({ product: productId, quantity });
    }

    await cart.save();
  }

  await cart.populate('items.product');
  res.status(201).json(cart);
});

const updateCartItem = asyncHandler(async (req, res) => {
  const { productId, quantity } = req.body;

  if (!productId || quantity == null) {
    res.status(400);
    throw new Error('productId and quantity are required');
  }

  const cart = await Cart.findOne({ user: req.user._id });

  if (!cart) {
    res.status(404);
    throw new Error('Cart not found');
  }

  const item = cart.items.find((i) => String(i.product) === String(productId));

  if (!item) {
    res.status(404);
    throw new Error('Cart item not found');
  }

  if (quantity <= 0) {
    cart.items = cart.items.filter((i) => String(i.product) !== String(productId));
  } else {
    item.quantity = quantity;
  }

  await cart.save();
  await cart.populate('items.product');

  res.json(cart);
});

const removeCartItem = asyncHandler(async (req, res) => {
  const { productId } = req.params;

  const cart = await Cart.findOne({ user: req.user._id });

  if (!cart) {
    return res.json({ user: req.user._id, items: [] });
  }

  cart.items = cart.items.filter((item) => String(item.product) !== String(productId));
  await cart.save();
  await cart.populate('items.product');

  res.json(cart);
});

const clearCart = asyncHandler(async (req, res) => {
  const cart = await Cart.findOneAndUpdate(
    { user: req.user._id },
    { $set: { items: [] } },
    { upsert: true, new: true }
  );

  res.json(cart);
});

module.exports = { getCart, addToCart, updateCartItem, removeCartItem, clearCart };
