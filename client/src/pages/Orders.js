import API_BASE from '../config';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import BackButton from '../components/BackButton';
import { toast } from 'react-toastify';
import './Orders.css';

const formatINR = (price) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(price);

const STATUS_COLORS = {
  pending: '#ff9800', confirmed: '#2196f3', shipped: '#9c27b0', delivered: '#4caf50'
};
const STATUS_ICONS = { pending: '⏳', confirmed: '✅', shipped: '🚚', delivered: '📦' };

const Stars = ({ rating, onRate }) => (
  <span>
    {[1,2,3,4,5].map(i => (
      <span key={i}
        onClick={() => onRate && onRate(i)}
        style={{ fontSize: '1.6rem', cursor: onRate ? 'pointer' : 'default',
          color: i <= rating ? '#f59e0b' : '#444', transition: 'transform 0.1s' }}
        onMouseEnter={e => { if (onRate) e.target.style.transform = 'scale(1.2)'; }}
        onMouseLeave={e => { e.target.style.transform = 'scale(1)'; }}
      >★</span>
    ))}
  </span>
);

function ReviewModal({ order, onClose, onSubmitted }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await axios.post(`/api/reviews/${order.product._id}`, { rating, comment });
      toast.success('Review submitted! ⭐');
      onSubmitted(order._id);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit review');
    }
    setSubmitting(false);
  };

  return (
    <div className="review-modal-overlay" onClick={onClose}>
      <div className="review-modal" onClick={e => e.stopPropagation()}>
        <div className="review-modal-header">
          <h3>⭐ Review Product</h3>
          <button onClick={onClose} className="review-modal-close">✕</button>
        </div>
        <div className="review-modal-product">
          <span style={{ fontSize: '1.2rem' }}>📦</span>
          <span>{order.product?.name}</span>
        </div>
        <form onSubmit={handleSubmit}>
          <div style={{ margin: '1rem 0', textAlign: 'center' }}>
            <p style={{ color: 'var(--text3)', fontSize: '0.82rem', marginBottom: 8 }}>Tap to rate</p>
            <Stars rating={rating} onRate={setRating} />
          </div>
          <textarea
            placeholder="Share your experience with this product..."
            value={comment}
            onChange={e => setComment(e.target.value)}
            required
            rows={4}
            style={{
              width: '100%', padding: '12px', borderRadius: '12px',
              border: '1px solid rgba(124,58,237,0.2)', background: 'var(--bg2)',
              color: 'var(--text)', fontFamily: 'Poppins', fontSize: '0.88rem',
              resize: 'vertical', outline: 'none', boxSizing: 'border-box'
            }}
          />
          <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
            <button type="button" onClick={onClose} style={{
              flex: 1, padding: '11px', borderRadius: '12px', border: '1px solid var(--border)',
              background: 'var(--bg2)', color: 'var(--text2)', cursor: 'pointer',
              fontFamily: 'Poppins', fontWeight: 600, fontSize: '0.88rem'
            }}>Cancel</button>
            <button type="submit" disabled={submitting} style={{
              flex: 1.5, padding: '11px', borderRadius: '12px', border: 'none',
              background: 'linear-gradient(135deg, var(--primary), var(--pink))',
              color: 'white', cursor: 'pointer', fontFamily: 'Poppins',
              fontWeight: 700, fontSize: '0.88rem',
              boxShadow: '0 0 20px rgba(124,58,237,0.3)',
              opacity: submitting ? 0.6 : 1
            }}>
              {submitting ? 'Submitting...' : '⭐ Submit Review'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviewModal, setReviewModal] = useState(null);
  const [reviewed, setReviewed] = useState({});

  useEffect(() => {
    axios.get('/api/orders/mine')
      .then(r => setOrders(r.data))
      .finally(() => setLoading(false));
  }, []);

  const handleReviewed = (orderId) => {
    setReviewed(prev => ({ ...prev, [orderId]: true }));
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text2)' }}>Loading orders...</div>;

  if (orders.length === 0) return (
    <div className="orders-empty">
      <div style={{ fontSize: '4rem' }}>📦</div>
      <h2>No orders yet</h2>
      <p>Your orders will appear here</p>
    </div>
  );

  return (
    <div className="orders-page">
      <BackButton />
      <h1>📦 My Orders</h1>
      <div className="orders-list">
        {orders.map(order => {
          const imgSrc = order.product?.images?.[0]
            ? (order.product.images[0].startsWith('http') ? order.product.images[0] : `${API_BASE}${order.product.images[0]}`)
            : `https://via.placeholder.com/80x80?text=Product`;

          const canReview = ['confirmed', 'shipped', 'delivered'].includes(order.status);
          const alreadyReviewed = reviewed[order._id];

          return (
            <div key={order._id} className="order-card">
              <div className="order-header">
                <span className="order-id">Order #{order._id.slice(-8).toUpperCase()}</span>
                {order.status === 'cancelled' ? (
                  <span className="order-status" style={{ background: 'rgba(239,68,68,0.15)', color: 'var(--red)' }}>
                    ❌ Cancelled
                  </span>
                ) : (
                  <span className="order-status" style={{ background: STATUS_COLORS[order.status] + '20', color: STATUS_COLORS[order.status] }}>
                    {STATUS_ICONS[order.status]} {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </span>
                )}
              </div>

              <div className="order-body">
                <img src={imgSrc} alt={order.product?.name} className="order-img" />
                <div className="order-info">
                  <h3>{order.product?.name}</h3>
                  <p>Qty: {order.quantity} | Total: <strong>{formatINR(order.totalPrice)}</strong></p>
                  <p style={{ color: 'var(--text3)', fontSize: '0.85rem' }}>
                    Ordered on {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                  <p style={{ color: 'var(--text3)', fontSize: '0.85rem' }}>Seller: {order.seller?.name}</p>

                  {/* Review button */}
                  {canReview && (
                    <button
                      onClick={() => setReviewModal(order)}
                      disabled={alreadyReviewed}
                      style={{
                        marginTop: 8,
                        padding: '6px 14px',
                        borderRadius: 20,
                        border: 'none',
                        background: alreadyReviewed
                          ? 'rgba(16,185,129,0.15)'
                          : 'linear-gradient(135deg, var(--primary), var(--pink))',
                        color: alreadyReviewed ? 'var(--green)' : 'white',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        cursor: alreadyReviewed ? 'default' : 'pointer',
                        fontFamily: 'Poppins',
                        boxShadow: alreadyReviewed ? 'none' : '0 0 12px rgba(124,58,237,0.3)'
                      }}
                    >
                      {alreadyReviewed ? '✅ Reviewed' : '⭐ Write a Review'}
                    </button>
                  )}
                </div>
              </div>

              {order.status !== 'cancelled' && (
                <div className="order-progress">
                  {['pending', 'confirmed', 'shipped', 'delivered'].map((s, i) => {
                    const statuses = ['pending', 'confirmed', 'shipped', 'delivered'];
                    const current = statuses.indexOf(order.status);
                    return (
                      <div key={s} className={`progress-step ${i <= current ? 'done' : ''}`}>
                        <div className="step-dot">{i <= current ? '✓' : i + 1}</div>
                        <span>{s.charAt(0).toUpperCase() + s.slice(1)}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {reviewModal && (
        <ReviewModal
          order={reviewModal}
          onClose={() => setReviewModal(null)}
          onSubmitted={handleReviewed}
        />
      )}
    </div>
  );
}
