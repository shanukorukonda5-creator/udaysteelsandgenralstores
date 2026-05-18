// Email service — logs only (no external dependency)
const sendOTPEmail = async (toEmail, otp, name) => {
  console.log(`📧 OTP for ${toEmail}: ${otp}`);
};

const sendOrderEmailToSeller = async (sellerEmail, { order, product, buyer, paymentMethod, paymentId }) => {
  console.log(`📧 Order notification for seller ${sellerEmail}: Order #${order._id.toString().slice(-8).toUpperCase()} - ${product.name} by ${buyer.name}`);
};

module.exports = { sendOTPEmail, sendOrderEmailToSeller };
