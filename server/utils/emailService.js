const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS
  }
});

const sendOTPEmail = async (toEmail, otp, name) => {
  const mailOptions = {
    from: `"Uday Steels & General Stores" <${process.env.GMAIL_USER}>`,
    to: toEmail,
    subject: '🔐 Your OTP for Uday Steels & General Stores',
    html: `
      <div style="font-family: 'Poppins', Arial, sans-serif; max-width: 500px; margin: 0 auto; background: #0a0a0f; border-radius: 20px; overflow: hidden; border: 1px solid rgba(124,58,237,0.3);">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #7c3aed, #ec4899, #f97316); padding: 30px; text-align: center;">
          <div style="font-size: 3rem;">🏪</div>
          <h1 style="color: white; margin: 10px 0 4px; font-size: 1.4rem; font-weight: 800;">Uday Steels & General Stores</h1>
          <p style="color: rgba(255,255,255,0.8); margin: 0; font-size: 0.85rem;">Email Verification</p>
        </div>

        <!-- Body -->
        <div style="padding: 30px; background: #16162a;">
          <p style="color: #94a3b8; font-size: 0.95rem; margin-bottom: 20px;">
            Hi <strong style="color: #f1f5f9;">${name}</strong>, here is your One-Time Password (OTP) to verify your account:
          </p>

          <!-- OTP Box -->
          <div style="background: #0a0a0f; border: 2px solid rgba(124,58,237,0.4); border-radius: 16px; padding: 24px; text-align: center; margin: 20px 0; box-shadow: 0 0 30px rgba(124,58,237,0.15);">
            <p style="color: #64748b; font-size: 0.8rem; margin: 0 0 10px; text-transform: uppercase; letter-spacing: 2px;">Your OTP Code</p>
            <div style="font-size: 2.8rem; font-weight: 900; letter-spacing: 12px; background: linear-gradient(135deg, #a855f7, #06b6d4); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">
              ${otp}
            </div>
            <p style="color: #64748b; font-size: 0.78rem; margin: 12px 0 0;">Valid for <strong style="color: #f59e0b;">10 minutes</strong></p>
          </div>

          <div style="background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.2); border-radius: 12px; padding: 14px; margin-top: 20px;">
            <p style="color: #fca5a5; font-size: 0.8rem; margin: 0;">
              ⚠️ <strong>Never share this OTP</strong> with anyone. Our team will never ask for your OTP.
            </p>
          </div>

          <p style="color: #475569; font-size: 0.78rem; margin-top: 24px; text-align: center;">
            If you didn't request this, please ignore this email.
          </p>
        </div>

        <!-- Footer -->
        <div style="background: #111118; padding: 16px; text-align: center; border-top: 1px solid rgba(255,255,255,0.05);">
          <p style="color: #334155; font-size: 0.75rem; margin: 0;">© 2024 Uday Steels & General Stores. All rights reserved.</p>
        </div>
      </div>
    `
  };

  await transporter.sendMail(mailOptions);
};

const sendOrderEmailToSeller = async (sellerEmail, { order, product, buyer, paymentMethod, paymentId }) => {
  const formatINR = (price) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(price);

  const paymentBadge = paymentMethod === 'cod'
    ? `<span style="background:#f59e0b;color:white;padding:4px 12px;border-radius:20px;font-size:0.8rem;font-weight:700;">💵 Cash on Delivery</span>`
    : `<span style="background:#10b981;color:white;padding:4px 12px;border-radius:20px;font-size:0.8rem;font-weight:700;">✅ Paid Online</span>`;

  const mailOptions = {
    from: `"Uday Steels & General Stores" <${process.env.GMAIL_USER}>`,
    to: sellerEmail,
    subject: `🛒 New Order Received — ${product.name}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0a0a0f; border-radius: 20px; overflow: hidden; border: 1px solid rgba(124,58,237,0.3);">

        <!-- Header -->
        <div style="background: linear-gradient(135deg, #7c3aed, #ec4899, #f97316); padding: 28px; text-align: center;">
          <div style="font-size: 2.5rem;">🏪</div>
          <h1 style="color: white; margin: 8px 0 4px; font-size: 1.3rem; font-weight: 800;">New Order Received!</h1>
          <p style="color: rgba(255,255,255,0.85); margin: 0; font-size: 0.85rem;">Uday Steels & General Stores</p>
        </div>

        <!-- Order ID -->
        <div style="background: #16162a; padding: 20px 28px 0;">
          <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
            <p style="color:#94a3b8; font-size:0.85rem; margin:0;">Order ID: <strong style="color:#a855f7;">#${order._id.toString().slice(-8).toUpperCase()}</strong></p>
            <p style="color:#94a3b8; font-size:0.85rem; margin:0;">${new Date(order.createdAt).toLocaleString('en-IN')}</p>
          </div>
          <div style="margin-top:10px;">${paymentBadge}</div>
          ${paymentId ? `<p style="color:#64748b; font-size:0.78rem; margin:8px 0 0;">Payment ID: ${paymentId}</p>` : ''}
        </div>

        <!-- Product Details -->
        <div style="background: #16162a; padding: 20px 28px;">
          <h2 style="color:#f1f5f9; font-size:1rem; margin:0 0 14px; border-bottom:1px solid rgba(255,255,255,0.07); padding-bottom:10px;">📦 Product Details</h2>
          <table style="width:100%; border-collapse:collapse;">
            <tr>
              <td style="color:#94a3b8; font-size:0.85rem; padding:6px 0;">Product</td>
              <td style="color:#f1f5f9; font-size:0.85rem; font-weight:700; text-align:right;">${product.name}</td>
            </tr>
            <tr>
              <td style="color:#94a3b8; font-size:0.85rem; padding:6px 0;">Category</td>
              <td style="color:#f1f5f9; font-size:0.85rem; text-align:right;">${product.category}</td>
            </tr>
            <tr>
              <td style="color:#94a3b8; font-size:0.85rem; padding:6px 0;">Quantity</td>
              <td style="color:#f1f5f9; font-size:0.85rem; text-align:right;">${order.quantity}</td>
            </tr>
            <tr>
              <td style="color:#94a3b8; font-size:0.85rem; padding:6px 0;">Unit Price</td>
              <td style="color:#f1f5f9; font-size:0.85rem; text-align:right;">${formatINR(product.price)}</td>
            </tr>
            <tr style="border-top:1px solid rgba(255,255,255,0.07);">
              <td style="color:#10b981; font-size:1rem; font-weight:800; padding:10px 0 0;">Total Amount</td>
              <td style="color:#10b981; font-size:1rem; font-weight:800; text-align:right; padding-top:10px;">${formatINR(order.totalPrice)}</td>
            </tr>
          </table>
        </div>

        <!-- Buyer Details -->
        <div style="background: #111118; padding: 20px 28px; border-top:1px solid rgba(255,255,255,0.05);">
          <h2 style="color:#f1f5f9; font-size:1rem; margin:0 0 14px;">👤 Buyer Details</h2>
          <table style="width:100%; border-collapse:collapse;">
            <tr>
              <td style="color:#94a3b8; font-size:0.85rem; padding:5px 0; width:40%;">Name</td>
              <td style="color:#f1f5f9; font-size:0.85rem; font-weight:600;">${buyer.name}</td>
            </tr>
            <tr>
              <td style="color:#94a3b8; font-size:0.85rem; padding:5px 0;">Email</td>
              <td style="color:#f1f5f9; font-size:0.85rem;">${buyer.email}</td>
            </tr>
            <tr>
              <td style="color:#94a3b8; font-size:0.85rem; padding:5px 0;">Phone</td>
              <td style="color:#f1f5f9; font-size:0.85rem;">${buyer.address?.phone || 'N/A'}</td>
            </tr>
            <tr>
              <td style="color:#94a3b8; font-size:0.85rem; padding:5px 0; vertical-align:top;">Delivery Address</td>
              <td style="color:#f1f5f9; font-size:0.85rem; line-height:1.6;">
                ${buyer.address?.street || ''}<br/>
                ${buyer.address?.city || ''}, ${buyer.address?.state || ''}<br/>
                Pincode: ${buyer.address?.pincode || 'N/A'}
              </td>
            </tr>
          </table>
        </div>

        <!-- Footer -->
        <div style="background: #0a0a0f; padding: 16px 28px; text-align:center; border-top:1px solid rgba(255,255,255,0.05);">
          <p style="color:#334155; font-size:0.75rem; margin:0;">© 2024 Uday Steels & General Stores. Please process this order promptly.</p>
        </div>
      </div>
    `
  };

  await transporter.sendMail(mailOptions);
};

module.exports = { sendOTPEmail, sendOrderEmailToSeller };
