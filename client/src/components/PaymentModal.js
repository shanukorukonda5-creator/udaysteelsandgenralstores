import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import API_BASE from '../config';
import './PaymentModal.css';

const formatINR = (price) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(price);

export default function PaymentModal({ product, quantity, onClose }) {
  const [placing, setPlacing] = useState(false);
  const navigate = useNavigate();
  const total = product.price * quantity;

  const handlePlaceOrder = async () => {
    setPlacing(true);
    try {
      await axios.post('/api/orders', {
        productId: product._id,
        quantity,
        paymentMethod: 'cod'
      });
      toast.success('Order placed! Cash on Delivery 🎉');
      onClose();
      navigate('/orders');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Order failed');
    }
    setPlacing(false);
  };

  const imgSrc = product.images?.[0]
    ? (product.images[0].startsWith('http') ? product.images[0] : `${API_BASE}${product.images[0]}`)
    : `https://placehold.co/60x60/1a1a2e/a855f7?text=P`;

  return (
    <div className="payment-overlay" onClick={onClose}>
      <div className="payment-modal" onClick={e => e.stopPropagation()}>
        <div className="payment-header">
          <h2>🛒 Confirm Order</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        {/* Order summary */}
        <div className="order-summary">
          <img src={imgSrc} alt={product.name} className="summary-img" />
          <div>
            <p className="summary-name">{product.name}</p>
            <p className="summary-qty">Qty: {quantity}</p>
            <p className="summary-total">{formatINR(total)}</p>
          </div>
        </div>

        {/* COD info */}
        <div style={{
          background: 'rgba(16,185,129,0.08)',
          border: '1px solid rgba(16,185,129,0.2)',
          borderRadius: 16,
          padding: '1rem 1.2rem',
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          marginBottom: '1.2rem'
        }}>
          <span style={{ fontSize: '2rem' }}>💵</span>
          <div>
            <div style={{ fontWeight: 700, color: 'var(--text)', fontSize: '0.95rem' }}>Cash on Delivery</div>
            <div style={{ color: 'var(--text3)', fontSize: '0.78rem', marginTop: 2 }}>Pay when your order arrives at your doorstep</div>
          </div>
        </div>

        <div className="payment-total-row">
          <span>Total Amount</span>
          <span className="payment-total-amount">{formatINR(total)}</span>
        </div>

        <button className="pay-btn" onClick={handlePlaceOrder} disabled={placing}>
          {placing ? 'Placing Order...' : '✅ Place Order (Cash on Delivery)'}
        </button>
      </div>
    </div>
  );
}
