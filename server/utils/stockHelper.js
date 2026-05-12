const Product = require('../models/Product');
const Notification = require('../models/Notification');
const User = require('../models/User');

const updateStockAfterOrder = async (productId, quantity) => {
  const product = await Product.findById(productId);
  if (!product) return;

  const prevStock = product.stock;
  product.stock = Math.max(0, product.stock - quantity);
  await product.save();

  const newStock = product.stock;

  // Notify all sellers about stock change
  const sellers = await User.find({ role: 'seller' });
  let sellerMsg = null;

  if (newStock === 0) {
    sellerMsg = `🚨 OUT OF STOCK! "${product.name}" is now out of stock. Please restock immediately.`;
  } else if (newStock < 2) {
    sellerMsg = `⚠️ LOW STOCK ALERT! "${product.name}" has only ${newStock} unit(s) left!`;
  } else if (newStock >= 3 && newStock <= 7) {
    sellerMsg = `📉 "${product.name}" is selling fast! Only ${newStock} units remaining.`;
  }

  if (sellerMsg) {
    const sellerNotifs = sellers.map(s => ({
      user: s._id,
      message: sellerMsg,
      type: 'general'
    }));
    await Notification.insertMany(sellerNotifs);
  }

  // If restocked from 0 — notify buyers who set reminders
  // (This runs when seller manually updates stock via dashboard)

  return { prevStock, newStock, product };
};

const notifyRestockBuyers = async (productId) => {
  const product = await Product.findById(productId).populate('stockReminders');
  if (!product || product.stock === 0 || product.stockReminders.length === 0) return;

  const notifications = product.stockReminders.map(buyer => ({
    user: buyer._id,
    message: `🎉 Good news! "${product.name}" is back in stock! Grab it before it sells out.`,
    type: 'general'
  }));

  await Notification.insertMany(notifications);

  // Clear reminders after notifying
  product.stockReminders = [];
  await product.save();
};

module.exports = { updateStockAfterOrder, notifyRestockBuyers };
