const router = require('express').Router();
const User = require('../models/User');
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('cart.product');
    res.json(user.cart);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/add', auth, async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;
    const user = await User.findById(req.user._id);
    const existing = user.cart.find(c => c.product.toString() === productId);
    if (existing) {
      existing.quantity += quantity;
    } else {
      user.cart.push({ product: productId, quantity });
    }
    await user.save();
    const updated = await User.findById(req.user._id).populate('cart.product');
    res.json(updated.cart);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete('/remove/:productId', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    user.cart = user.cart.filter(c => c.product.toString() !== req.params.productId);
    await user.save();
    res.json(user.cart);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/update/:productId', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const item = user.cart.find(c => c.product.toString() === req.params.productId);
    if (item) item.quantity = req.body.quantity;
    await user.save();
    const updated = await User.findById(req.user._id).populate('cart.product');
    res.json(updated.cart);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
