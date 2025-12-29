const mongoose = require('mongoose');
const Category = require('../models/Category');
require('dotenv').config();

const defaultCategories = [
  { name: 'Technical Skills', description: 'Technical and programming courses' },
  { name: 'Soft Skills', description: 'Interpersonal and communication skills' },
  { name: 'Leadership', description: 'Leadership and management courses' },
  { name: 'Compliance', description: 'Compliance and regulatory training' },
];

const initCategories = async () => {
  try {
    // Connect to MongoDB
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }

    await mongoose.connect(uri);
    console.log('Connected to MongoDB');

    // Check and create categories
    for (const category of defaultCategories) {
      const existing = await Category.findOne({ name: category.name });
      if (!existing) {
        await Category.create(category);
        console.log(`Created category: ${category.name}`);
      } else {
        console.log(`Category already exists: ${category.name}`);
      }
    }

    console.log('Categories initialization completed');
    process.exit(0);
  } catch (error) {
    console.error('Error initializing categories:', error);
    process.exit(1);
  }
};

initCategories();

