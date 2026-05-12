const router = require('express').Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Product = require('../models/Product');
const Notification = require('../models/Notification');
const User = require('../models/User');
const auth = require('../middleware/auth');

const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname.replace(/\s+/g, '_'))
});
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files allowed'));
  }
});

const { notifyRestockBuyers } = require('../utils/stockHelper');

// Seller: get ALL products (shared across all sellers)
router.get('/seller/mine', auth, async (req, res) => {
  try {
    const products = await Product.find({});
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get all products
router.get('/', async (req, res) => {
  try {
    const { search, category } = req.query;
    let query = {};
    if (search) query.name = { $regex: search, $options: 'i' };
    if (category) query.category = { $regex: `^${category}$`, $options: 'i' };
    const products = await Product.find(query).populate('seller', 'name email');
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get single product
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate('seller', 'name email');
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Seller: add product
router.post('/', auth, upload.array('images', 5), async (req, res) => {
  try {
    if (req.user.role !== 'seller') return res.status(403).json({ message: 'Only sellers can add products' });
    const images = req.files ? req.files.map(f => `/uploads/${f.filename}`) : [];
    const product = await Product.create({ ...req.body, seller: req.user._id, images });
    res.json(product);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Seller: update product — any seller can edit any product
router.put('/:id', auth, upload.array('images', 5), async (req, res) => {
  try {
    if (req.user.role !== 'seller') return res.status(403).json({ message: 'Only sellers' });
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Not found' });
    const prevStock = product.stock;
    const newImages = req.files ? req.files.map(f => `/uploads/${f.filename}`) : [];
    const images = newImages.length > 0 ? newImages : product.images;
    const updated = await Product.findByIdAndUpdate(req.params.id, { ...req.body, images }, { new: true });
    // If stock was 0 and now restocked — notify waiting buyers
    if (prevStock === 0 && updated.stock > 0) {
      await notifyRestockBuyers(req.params.id);
    }
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Seller: delete product — any seller can delete any product
router.delete('/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'seller') return res.status(403).json({ message: 'Only sellers' });
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Not found' });
    await product.deleteOne();
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Buyer: register for stock reminder
router.post('/:id/remind', auth, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    if (!product.stockReminders.includes(req.user._id)) {
      product.stockReminders.push(req.user._id);
      await product.save();
    }
    res.json({ message: 'You will be notified when stock is restored!' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Seller: send offer notification to all buyers
router.post('/:id/offer', auth, async (req, res) => {
  try {
    if (req.user.role !== 'seller') return res.status(403).json({ message: 'Only sellers' });
    const product = await Product.findByIdAndUpdate(req.params.id, { offer: req.body.offer, offerActive: true }, { new: true });
    const buyers = await User.find({ role: 'buyer' });
    const notifications = buyers.map(b => ({
      user: b._id,
      message: `🎉 New Offer on "${product.name}": ${req.body.offer}`,
      type: 'offer'
    }));
    await Notification.insertMany(notifications);
    res.json({ message: 'Offer sent to all buyers', product });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Seller: remove offer
router.put('/:id/remove-offer', auth, async (req, res) => {
  try {
    if (req.user.role !== 'seller') return res.status(403).json({ message: 'Only sellers' });
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { offer: '', offerActive: false },
      { new: true }
    );
    res.json({ message: 'Offer removed', product });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
