const Mailgun = require('mailgun.js');
const formData = require('form-data');

const getClient = () => {
  const mailgun = new Mailgun(formData);
  return mailgun.client({
    username: 'api',
    key: process.env.MAILGUN_API_KEY
  });
};

const FROM_EMAIL = `Uday Steels & General Stores <mailgun@${process.env.MAILGUN_DOMAIN}>`;

const sendOTPEmail = async (toEmail, otp, name) => {
  const client = getClient();
  const result = await client.messages.create(process.env.MAILGUN_DOMAIN, {
    from: FROM_EMAIL,
    to: [toEmail],
    subject: '🔐 Your OTP for Uday Steels & General Stores',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; background: #0a0a0f; border-radius: 20px; overflow: hidden; border: 1px solid rgba(124,58,237,0.3);">
        <div style="background: linear-gradient(135deg, #7c3aed, #ec4899, #f97316); padding: 30px; text-align: center;">
          <div style="font-size: 3rem;">🏪</div>
          <h1 style="color: white; margin: 10px 0 4px; font-size: 1.4rem; font-weight: 800;">Uday Steels & General Stores</h1>
          <p style="color: rgba(255,255,255,0.8); margin: 0; font-size: 0.85rem;">Email Verification</p>
        </div>
        <div style="padding: 30px; background: #16162a;">
          <p style="color: #94a3b8; font-size: 0.95rem; margin-bottom: 20px;">
            Hi <strong style="color: #f1f5f9;">${name}</strong>, here is your OTP to verify your account:
          </p>
          <div style="background: #0a0a0f; border: 2px solid rgba(124,58,237,0.4); border-radius: 16px; padding: 24px; text-align: center; margin: 20px 0;">
            <p style="color: #64748b; font-size: 0.8rem; margin: 0 0 10px; text-transform: uppercase; letter-spacing: 2px;">Your OTP Code</p>
            <div style="font-size: 2.8rem; font-weight: 900; letter-spacing: 12px; color: #a855f7;">${otp}</div>
            <p style="color: #64748b; font-size: 0.78rem; margin: 12px 0 0;">Valid for <strong style="color: #f59e0b;">10 minutes</strong></p>
          </div>
          <p style="color: #fca5a5; font-size: 0.8rem; margin: 0;">⚠️ Never share this OTP with anyone.</p>
        </div>
        <div style="background: #111118; padding: 16px; text-align: center;">
          <p style="color: #334155; font-size: 0.75rem; margin: 0;">© 2024 Uday Steels & General Stores. All rights reserved.</p>
        </div>
      </div>
    `
  });
  console.log('✅ Mailgun OTP sent:', result.id);
};

const sendOrderEmailToSeller = async (sellerEmail, { order, product, buyer, paymentMethod, paymentId }) => {
  const client = getClient();
  const formatINR = (price) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(price);

  const paymentBadge = paymentMethod === 'cod'
    ? `<span style="background:#f59e0b;color:white;padding:4px 12px;border-radius:20px;font-size:0.8rem;font-weight:700;">💵 Cash on Delivery</span>`
    : `<span style="background:#10b981;color:white;padding:4px 12px;border-radius:20px;font-size:0.8rem;font-weight:700;">✅ Paid Online</span>`;

  const result = await client.messages.create(process.env.MAILGUN_DOMAIN, {
    from: FROM_EMAIL,
    to: [sellerEmail],
    subject: `🛒 New Order Received — ${product.name}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0a0a0f; border-radius: 20px; overflow: hidden; border: 1px solid rgba(124,58,237,0.3);">
        <div style="background: linear-gradient(135deg, #7c3aed, #ec4899, #f97316); padding: 28px; text-align: center;">
          <h1 style="color: white; margin: 8px 0 4px; font-size: 1.3rem; font-weight: 800;">🏪 New Order Received!</h1>
        </div>
        <div style="background: #16162a; padding: 20px 28px;">
          <p style="color:#94a3b8;">Order: <strong style="color:#a855f7;">#${order._id.toString().slice(-8).toUpperCase()}</strong></p>
          <p style="color:#94a3b8;">${new Date(order.createdAt).toLocaleString('en-IN')}</p>
          ${paymentBadge}
          ${paymentId ? `<p style="color:#64748b;font-size:0.78rem;margin-top:8px;">Payment ID: ${paymentId}</p>` : ''}
          <hr style="border-color:rgba(255,255,255,0.07);margin:16px 0;">
          <p style="color:#f1f5f9;"><strong>Product:</strong> ${product.name}</p>
          <p style="color:#f1f5f9;"><strong>Qty:</strong> ${order.quantity} | <strong>Total:</strong> ${formatINR(order.totalPrice)}</p>
          <hr style="border-color:rgba(255,255,255,0.07);margin:16px 0;">
          <p style="color:#f1f5f9;"><strong>Buyer:</strong> ${buyer.name}</p>
          <p style="color:#94a3b8;">${buyer.email} | ${buyer.address?.phone || 'N/A'}</p>
          <p style="color:#94a3b8;">${buyer.address?.street || ''}, ${buyer.address?.city || ''}, ${buyer.address?.state || ''} - ${buyer.address?.pincode || 'N/A'}</p>
        </div>
        <div style="background:#0a0a0f;padding:16px;text-align:center;">
          <p style="color:#334155;font-size:0.75rem;margin:0;">© 2024 Uday Steels & General Stores</p>
        </div>
      </div>
    `
  });
  console.log('✅ Mailgun order email sent:', result.id);
};

module.exports = { sendOTPEmail, sendOrderEmailToSeller };
