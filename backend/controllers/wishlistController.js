const asyncHandler = require('express-async-handler');
const Wishlist = require('../models/Wishlist');

const getWishlist = asyncHandler(async (req, res) => {
  const wishlist = await Wishlist.findOne({ user: req.user._id }).populate('products');
  res.json(wishlist || { user: req.user._id, products: [] });
});

const addToWishlist = asyncHandler(async (req, res) => {
  const { productId } = req.body;

  if (!productId) {
    res.status(400);
    throw new Error('productId is required');
  }

  const wishlist = await Wishlist.findOneAndUpdate(
    { user: req.user._id },
    { $addToSet: { products: productId } },
    { upsert: true, new: true }
  ).populate('products');

  res.status(201).json(wishlist);
});

const removeFromWishlist = asyncHandler(async (req, res) => {
  const { productId } = req.params;

  const wishlist = await Wishlist.findOneAndUpdate(
    { user: req.user._id },
    { $pull: { products: productId } },
    { new: true }
  ).populate('products');

  res.json(wishlist || { user: req.user._id, products: [] });
});

module.exports = { getWishlist, addToWishlist, removeFromWishlist };
