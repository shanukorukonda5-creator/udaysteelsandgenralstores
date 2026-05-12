const bcrypt = require('bcryptjs');
const User = require('../models/User');

const seedSeller = async () => {
  try {
    const existing = await User.findOne({ role: 'seller' });
    if (existing) return; // already exists

    const hashed = await bcrypt.hash('Uday@2024', 12);
    await User.create({
      name: 'Uday Steels',
      email: 'udaysteels@store.com',
      password: hashed,
      role: 'seller',
      isVerified: true
    });
    console.log('✅ Seller account created: udaysteels@store.com / Uday@2024');
  } catch (err) {
    console.error('Seller seed error:', err.message);
  }
};

module.exports = seedSeller;
