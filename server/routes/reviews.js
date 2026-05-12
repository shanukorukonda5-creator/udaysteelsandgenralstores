const router = require('express').Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Review = require('../models/Review');
const Product = require('../models/Product');
const auth = require('../middleware/auth');

const uploadDir = path.join(__dirname, '../uploads/reviews');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, `review_${Date.now()}_${file.originalname.replace(/\s+/g, '_')}`)
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

router.get('/:productId', async (req, res) => {
  try {
    const reviews = await Review.find({ product: req.params.productId }).sort({ createdAt: -1 });
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/:productId', auth, upload.array('images', 3), async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const existing = await Review.findOne({ product: req.params.productId, user: req.user._id });
    if (existing) return res.status(400).json({ message: 'You already reviewed this product' });

    const images = req.files ? req.files.map(f => `/uploads/reviews/${f.filename}`) : [];

    const review = await Review.create({
      product: req.params.productId,
      user: req.user._id,
      userName: req.user.name,
      rating,
      comment,
      images
    });

    // Update product rating
    const reviews = await Review.find({ product: req.params.productId });
    const avg = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
    await Product.findByIdAndUpdate(req.params.productId, { ratings: avg, numReviews: reviews.length });

    res.json(review);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
