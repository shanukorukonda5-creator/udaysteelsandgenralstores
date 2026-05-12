const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['buyer', 'seller'], default: 'buyer' },
  isVerified: { type: Boolean, default: false },
  otp: { type: String },
  otpExpiry: { type: Date },
  loginAttempts: { type: Number, default: 0 },
  lockUntil: { type: Date },
  isBlocked: { type: Boolean, default: false },
  address: {
    street: String,
    city: String,
    state: String,
    pincode: String,
    phone: String
  },
  cart: [{ product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' }, quantity: { type: Number, default: 1 } }]
}, { timestamps: true });

// Account lock check
userSchema.virtual('isLocked').get(function () {
  return this.lockUntil && this.lockUntil > Date.now();
});

module.exports = mongoose.model('User', userSchema);
