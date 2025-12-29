const asyncHandler = require('express-async-handler');
const Product = require('../models/Product');
const Enrollment = require('../models/Enrollment');

const getProducts = asyncHandler(async (req, res) => {
  const { category, featured, includeEnrollments } = req.query;

  const filter = {};
  if (category) filter.category = category;
  if (featured) filter.isFeatured = featured === 'true';

  const products = await Product.find(filter).populate('category');
  
  // If includeEnrollments is true, add enrollment count to each product
  if (includeEnrollments === 'true') {
    const productsWithEnrollments = await Promise.all(
      products.map(async (product) => {
        const enrollmentCount = await Enrollment.countDocuments({ product: product._id });
        return {
          ...product.toObject(),
          enrollmentCount,
        };
      })
    );
    return res.json(productsWithEnrollments);
  }

  res.json(products);
});

const getProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id).populate('category');

  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  res.json(product);
});

const createProduct = asyncHandler(async (req, res) => {
  // Generate slug if not provided
  if (!req.body.slug && req.body.name) {
    const generateSlug = (name) => {
      return name
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
    };
    
    let baseSlug = generateSlug(req.body.name);
    let slug = baseSlug;
    let counter = 1;
    
    // Ensure slug is unique
    while (await Product.findOne({ slug })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }
    
    req.body.slug = slug;
  }
  
  const product = await Product.create(req.body);
  res.status(201).json(product);
});

const updateProduct = asyncHandler(async (req, res) => {
  // If name is being updated and slug is not provided, regenerate slug
  if (req.body.name && !req.body.slug) {
    const generateSlug = (name) => {
      return name
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
    };
    
    let baseSlug = generateSlug(req.body.name);
    let slug = baseSlug;
    let counter = 1;
    
    // Ensure slug is unique (excluding current product)
    while (await Product.findOne({ slug, _id: { $ne: req.params.id } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }
    
    req.body.slug = slug;
  }
  
  const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  res.json(product);
});

const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  // Delete all enrollments for this product
  await Enrollment.deleteMany({ product: product._id });
  
  // Delete the product
  await Product.findByIdAndDelete(req.params.id);
  res.json({ message: 'Product deleted' });
});

module.exports = {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
};
