const asyncHandler = require('express-async-handler');
const Category = require('../models/Category');

const getCategories = asyncHandler(async (req, res) => {
  const categories = await Category.find();
  
  // If no categories exist, initialize default ones
  if (categories.length === 0) {
    const defaultCategories = [
      { name: 'Technical Skills', description: 'Technical and programming courses' },
      { name: 'Soft Skills', description: 'Interpersonal and communication skills' },
      { name: 'Leadership', description: 'Leadership and management courses' },
      { name: 'Compliance', description: 'Compliance and regulatory training' },
    ];
    
    await Category.insertMany(defaultCategories);
    const updatedCategories = await Category.find();
    return res.json(updatedCategories);
  }
  
  res.json(categories);
});

const createCategory = asyncHandler(async (req, res) => {
  const category = await Category.create(req.body);
  res.status(201).json(category);
});

const updateCategory = asyncHandler(async (req, res) => {
  const category = await Category.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!category) {
    res.status(404);
    throw new Error('Category not found');
  }

  res.json(category);
});

const deleteCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);

  if (!category) {
    res.status(404);
    throw new Error('Category not found');
  }

  await Category.findByIdAndDelete(req.params.id);
  res.json({ message: 'Category deleted' });
});

module.exports = {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
};
