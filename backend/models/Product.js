const mongoose = require('mongoose');

// Helper function to generate slug from name
const generateSlug = (name) => {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
};

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { 
      type: String, 
      unique: true,
      sparse: true, // Allow multiple null values
    },
    description: { type: String },
    price: { type: Number, required: true },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
    image: { type: String },
    stock: { type: Number, default: 0 },
    tags: [String],
    isFeatured: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Pre-save hook to auto-generate slug if not provided
productSchema.pre('save', async function (next) {
  if (!this.slug && this.name) {
    let baseSlug = generateSlug(this.name);
    let slug = baseSlug;
    let counter = 1;
    
    // Check if slug exists, if so append a number
    // Use this.constructor to avoid circular reference
    while (await this.constructor.findOne({ slug, _id: { $ne: this._id } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }
    
    this.slug = slug;
  }
  next();
});

module.exports = mongoose.model('Product', productSchema);
