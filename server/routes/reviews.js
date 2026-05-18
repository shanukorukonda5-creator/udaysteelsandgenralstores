const router = require('express').Router();
const Review = require('../models/Review');
const Product = require('../models/Product');
const auth = require('../middleware/auth');
const { uploadReview } = require('../utils/cloudinary');

router.get('/:productId', async (req, res) => {
  try {
    const reviews = await Review.find({ product: req.params.productId }).sort({ createdAt: -1 });
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/:productId', auth, uploadReview.array('images', 3), async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const existing = await Review.findOne({ product: req.params.productId, user: req.user._id });
    if (existing) return res.status(400).json({ message: 'You already reviewed this product' });

    const images = req.files ? req.files.map(f => f.path) : [];

    const review = await Review.create({
      product: req.params.productId,
      user: req.user._id,
      userName: req.user.name,
      rating, comment, images
    });

    const reviews = await Review.find({ product: req.params.productId });
    const avg = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
    await Product.findByIdAndUpdate(req.params.productId, { ratings: avg, numReviews: reviews.length });

    res.json(review);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
