require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../models/Product');

const generateSlug = (name) => {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

const fixProductSlugs = async () => {
  try {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }

    await mongoose.connect(uri);
    console.log('Connected to MongoDB');

    // Find all products without slugs
    const productsWithoutSlugs = await Product.find({ $or: [{ slug: null }, { slug: '' }] });
    console.log(`Found ${productsWithoutSlugs.length} products without slugs`);

    for (const product of productsWithoutSlugs) {
      let baseSlug = generateSlug(product.name);
      let slug = baseSlug;
      let counter = 1;

      // Ensure slug is unique
      while (await Product.findOne({ slug, _id: { $ne: product._id } })) {
        slug = `${baseSlug}-${counter}`;
        counter++;
      }

      product.slug = slug;
      await product.save();
      console.log(`Fixed slug for product: ${product.name} -> ${slug}`);
    }

    // Drop and recreate the slug index with sparse option
    try {
      await Product.collection.dropIndex('slug_1');
      console.log('Dropped existing slug index');
    } catch (error) {
      console.log('Index may not exist or already dropped');
    }

    // Create new sparse index
    await Product.collection.createIndex({ slug: 1 }, { unique: true, sparse: true });
    console.log('Created new sparse unique index on slug');

    console.log('Product slugs fixed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error fixing product slugs:', error);
    process.exit(1);
  }
};

fixProductSlugs();

