const router = require('express').Router();
const Razorpay = require('razorpay');
const crypto = require('crypto');
const auth = require('../middleware/auth');
const Order = require('../models/Order');
const Notification = require('../models/Notification');
const User = require('../models/User');
const Product = require('../models/Product');
const { sendOrderEmailToSeller } = require('../utils/emailService');
const { updateStockAfterOrder } = require('../utils/stockHelper');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

// Create Razorpay order
router.post('/create-order', auth, async (req, res) => {
  try {
    const { amount, productId, quantity = 1 } = req.body;

    const options = {
      amount: amount * 100, // paise
      currency: 'INR',
      receipt: `receipt_${Date.now()}`,
      notes: { productId, quantity, userId: req.user._id.toString() }
    };

    const order = await razorpay.orders.create(options);
    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Verify payment and place order
router.post('/verify', auth, async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      productId,
      quantity = 1
    } = req.body;

    // Verify signature
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ message: 'Payment verification failed' });
    }

    // Place the order
    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    const buyer = await User.findById(req.user._id);

    const order = await Order.create({
      buyer: req.user._id,
      seller: product.seller,
      product: productId,
      quantity,
      totalPrice: product.price * quantity,
      paymentMethod: 'razorpay',
      paymentStatus: 'paid',
      paymentTransactionId: razorpay_payment_id,
      buyerDetails: {
        name: buyer.name,
        email: buyer.email,
        phone: buyer.address?.phone || '',
        address: buyer.address || {}
      }
    });

    // Notify seller
    await Notification.create({
      user: product.seller,
      message: `💳 New Paid Order! "${product.name}" x${quantity} | ₹${product.price * quantity} | Payment ID: ${razorpay_payment_id} | Buyer: ${buyer.name} (${buyer.email}) | Phone: ${buyer.address?.phone} | Address: ${buyer.address?.street}, ${buyer.address?.city}, ${buyer.address?.state} - ${buyer.address?.pincode}`,
      type: 'order'
    });

    // Remove from cart
    buyer.cart = buyer.cart.filter(c => c.product.toString() !== productId);
    await buyer.save();

    // Update stock
    await updateStockAfterOrder(productId, quantity);

    // Send email only to verified sellers (real email addresses)
    try {
      const validEmailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
      const sellers = await User.find({ role: 'seller', isVerified: true });
      for (const seller of sellers) {
        if (seller.email && validEmailRegex.test(seller.email) && !seller.email.includes('test') && seller.email !== 's@gmail.com') {
          await sendOrderEmailToSeller(seller.email, {
            order, product, buyer,
            paymentMethod: 'razorpay',
            paymentId: razorpay_payment_id
          });
        }
      }
    } catch (emailErr) {
      console.error('Order email failed:', emailErr.message);
    }

    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
