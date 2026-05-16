const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');

const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_TIME = 15 * 60 * 1000;

// ─── REGISTER ────────────────────────────────────────────────────────────────
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role, address, sellerKey } = req.body;

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return res.status(400).json({ message: 'Invalid email format' });

    // Password strength check
    if (password.length < 8) return res.status(400).json({ message: 'Password must be at least 8 characters' });
    if (!/(?=.*[A-Z])/.test(password)) return res.status(400).json({ message: 'Password must contain at least one uppercase letter' });
    if (!/(?=.*[0-9])/.test(password)) return res.status(400).json({ message: 'Password must contain at least one number' });

    // Seller secret key verification
    if (role === 'seller') {
      const validKey = process.env.SELLER_SECRET_KEY || 'UDAY@STEELS#2024';
      if (!sellerKey || sellerKey !== validKey) {
        return res.status(403).json({ message: 'Invalid seller secret key. Contact the store admin.' });
      }
    }

    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: 'Email already registered' });

    const hashed = await bcrypt.hash(password, 12);
    const user = await User.create({
      name, email, password: hashed, role, address,
      isVerified: true // auto-verified, no OTP needed
    });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'secret123', { expiresIn: '7d' });
    res.json({
      token,
      user: { _id: user._id, name: user.name, email: user.email, role: user.role, address: user.address }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── LOGIN ────────────────────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    // Check if blocked
    if (user.isBlocked) {
      return res.status(403).json({ message: 'Your account has been blocked. Please contact the store.' });
    }

    // Check account lock
    if (user.lockUntil && user.lockUntil > Date.now()) {
      const mins = Math.ceil((user.lockUntil - Date.now()) / 60000);
      return res.status(423).json({ message: `Account locked. Try again in ${mins} minute(s).` });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      user.loginAttempts = (user.loginAttempts || 0) + 1;
      if (user.loginAttempts >= MAX_LOGIN_ATTEMPTS) {
        user.lockUntil = new Date(Date.now() + LOCK_TIME);
        user.loginAttempts = 0;
        await user.save();
        return res.status(423).json({ message: 'Too many failed attempts. Account locked for 15 minutes.' });
      }
      await user.save();
      const remaining = MAX_LOGIN_ATTEMPTS - user.loginAttempts;
      return res.status(400).json({ message: `Invalid credentials. ${remaining} attempt(s) remaining.` });
    }

    // Reset login attempts on success
    user.loginAttempts = 0;
    user.lockUntil = undefined;
    await user.save();

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'secret123', { expiresIn: '7d' });
    res.json({ token, user: { _id: user._id, name: user.name, email: user.email, role: user.role, address: user.address } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── PROFILE UPDATE ───────────────────────────────────────────────────────────
router.put('/profile', auth, async (req, res) => {
  try {
    const updated = await User.findByIdAndUpdate(
      req.user._id,
      { address: req.body.address, name: req.body.name },
      { new: true }
    ).select('-password');
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/me', auth, async (req, res) => {
  res.json(req.user);
});

// ─── SELLER: BLOCK / UNBLOCK BUYER ───────────────────────────────────────────
router.put('/block/:userId', auth, async (req, res) => {
  try {
    if (req.user.role !== 'seller') return res.status(403).json({ message: 'Sellers only' });
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.isBlocked = true;
    await user.save();
    res.json({ message: `${user.name} has been blocked` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/unblock/:userId', auth, async (req, res) => {
  try {
    if (req.user.role !== 'seller') return res.status(403).json({ message: 'Sellers only' });
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.isBlocked = false;
    await user.save();
    res.json({ message: `${user.name} has been unblocked` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── SELLER: GET ALL BUYERS ───────────────────────────────────────────────────
router.get('/buyers', auth, async (req, res) => {
  try {
    if (req.user.role !== 'seller') return res.status(403).json({ message: 'Sellers only' });
    const buyers = await User.find({ role: 'buyer' }).select('-password');
    res.json(buyers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
