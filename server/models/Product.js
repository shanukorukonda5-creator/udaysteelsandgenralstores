const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  originalPrice: { type: Number },
  priceBeforeOffer: { type: Number }, // stores price before offer was applied
  images: [String],
  category: { type: String, default: 'General' },
  stock: { type: Number, default: 10 },
  offer: { type: String, default: '' },
  offerActive: { type: Boolean, default: false },
  ratings: { type: Number, default: 0 },
  numReviews: { type: Number, default: 0 },
  stockReminders: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }] // buyers who want restock notification
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);
