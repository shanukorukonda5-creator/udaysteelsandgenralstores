const router = require('express').Router();
const crypto = require('crypto');
const Order = require('../models/Order');
const Product = require('../models/Product');
const Notification = require('../models/Notification');
const User = require('../models/User');
const auth = require('../middleware/auth');
const { sendOrderEmailToSeller } = require('../utils/emailService');
const { updateStockAfterOrder } = require('../utils/stockHelper');

// ─── PLACE ORDER ─────────────────────────────────────────────────────────────
router.post('/', auth, async (req, res) => {
  try {
    const { productId, quantity = 1, paymentMethod = 'cod' } = req.body;
    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    const buyer = await User.findById(req.user._id);
    if (!buyer.address?.street) {
      return res.status(400).json({ message: 'Please update your delivery address in Profile first' });
    }

    const totalPrice = product.price * quantity;

    const order = await Order.create({
      buyer: req.user._id,
      seller: product.seller,
      product: productId,
      quantity,
      totalPrice,
      paymentMethod,
      paymentStatus: paymentMethod === 'cod' ? 'pending' : 'pending',
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
      message: `📦 New Order! "${product.name}" x${quantity} | ₹${totalPrice} | Payment: ${paymentMethod.toUpperCase()} | Buyer: ${buyer.name} (${buyer.email}) | Phone: ${buyer.address?.phone} | Address: ${buyer.address?.street}, ${buyer.address?.city}, ${buyer.address?.state} - ${buyer.address?.pincode}`,
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
          await sendOrderEmailToSeller(seller.email, { order, product, buyer, paymentMethod, paymentId: null });
        }
      }
    } catch (emailErr) {
      console.error('Order email failed:', emailErr.message);
    }

    // If PhonePe, return payment initiation data
    if (paymentMethod === 'phonepe') {
      const paymentData = initiatePhonePePayment(order._id.toString(), totalPrice, buyer);
      return res.json({ order, paymentData, requiresPayment: true });
    }

    res.json({ order, requiresPayment: false });  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── PHONEPE PAYMENT INITIATION (Simulated) ──────────────────────────────────
function initiatePhonePePayment(orderId, amount, buyer) {
  // In production, integrate with actual PhonePe API
  // This simulates the payment flow for demo purposes
  const merchantId = process.env.PHONEPE_MERCHANT_ID || 'UDAYSTEELS';
  const transactionId = `TXN_${orderId}_${Date.now()}`;

  return {
    merchantId,
    transactionId,
    amount: amount * 100, // PhonePe uses paise
    redirectUrl: `http://localhost:5000/api/orders/payment-callback/${orderId}`,
    // In production: use actual PhonePe SDK/API
    simulatedUpiId: 'udaysteels@ybl',
    qrData: `upi://pay?pa=udaysteels@ybl&pn=UdaySteels&am=${amount}&tn=Order${orderId}&tr=${transactionId}`,
    note: 'Demo mode: Payment simulated. In production, integrate PhonePe SDK.'
  };
}

// ─── PAYMENT CALLBACK ─────────────────────────────────────────────────────────
router.post('/payment-callback/:orderId', async (req, res) => {
  try {
    const { status, transactionId } = req.body;
    const order = await Order.findById(req.params.orderId);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    order.paymentStatus = status === 'SUCCESS' ? 'paid' : 'failed';
    order.paymentTransactionId = transactionId;
    if (status === 'SUCCESS') order.status = 'confirmed';
    await order.save();

    res.json({ message: 'Payment updated', order });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── SIMULATE PHONEPE SUCCESS (for demo) ─────────────────────────────────────
router.put('/payment-success/:orderId', auth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (order.buyer.toString() !== req.user._id.toString()) return res.status(403).json({ message: 'Unauthorized' });

    order.paymentStatus = 'paid';
    order.paymentTransactionId = `DEMO_TXN_${Date.now()}`;
    order.status = 'confirmed';
    await order.save();

    res.json({ order });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── BUYER ORDERS ─────────────────────────────────────────────────────────────
router.get('/mine', auth, async (req, res) => {
  try {
    const orders = await Order.find({ buyer: req.user._id }).populate('product').populate('seller', 'name email');
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Seller: get ALL orders (shared across all sellers)
router.get('/seller', auth, async (req, res) => {
  try {
    const orders = await Order.find({}).populate('product').populate('buyer', 'name email');
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── UPDATE STATUS ────────────────────────────────────────────────────────────
router.put('/:id/status', auth, async (req, res) => {
  try {
    const order = await Order.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── CANCEL ORDER ─────────────────────────────────────────────────────────────
router.put('/:id/cancel', auth, async (req, res) => {
  try {
    if (req.user.role !== 'seller') return res.status(403).json({ message: 'Sellers only' });
    const order = await Order.findById(req.params.id).populate('product');
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (order.status === 'delivered') return res.status(400).json({ message: 'Cannot cancel a delivered order' });

    // Restore stock
    if (order.product?._id) {
      await Product.findByIdAndUpdate(order.product._id, { $inc: { stock: order.quantity } });
    }

    order.status = 'cancelled';
    await order.save();

    // Notify buyer
    await Notification.create({
      user: order.buyer,
      message: `❌ Your order for "${order.product?.name}" has been cancelled by the seller. Reason: ${req.body.reason || 'No reason provided'}.`,
      type: 'order'
    });

    res.json({ message: 'Order cancelled', order });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
