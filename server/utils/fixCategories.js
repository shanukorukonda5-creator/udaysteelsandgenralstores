require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../models/Product');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/ecommerce';

mongoose.connect(MONGO_URI).then(async () => {
  console.log('Connected...');

  // Fix mixer grinder products — update by name keywords
  const mixerResult = await Product.updateMany(
    { name: { $regex: 'mixer|grinder', $options: 'i' }, category: 'Electronics' },
    { $set: { category: 'Mixer Grinders' } }
  );
  console.log(`✅ Fixed ${mixerResult.modifiedCount} Mixer Grinder products`);

  // Fix rice cooker products
  const riceResult = await Product.updateMany(
    { name: { $regex: 'rice cooker|rice|cooker', $options: 'i' }, category: 'Electronics' },
    { $set: { category: 'Rice Cookers' } }
  );
  console.log(`✅ Fixed ${riceResult.modifiedCount} Rice Cooker products`);

  // Show all products and their categories
  const all = await Product.find({}, 'name category');
  console.log('\nAll products:');
  all.forEach(p => console.log(`  - ${p.name} → ${p.category}`));

  mongoose.disconnect();
  console.log('\nDone!');
}).catch(err => console.error(err));
