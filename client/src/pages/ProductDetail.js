import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import PaymentModal from '../components/PaymentModal';
import BackButton from '../components/BackButton';
import './ProductDetail.css';

const formatINR = (price) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(price);

const Stars = ({ rating, interactive, onRate }) => (
  <span className="stars">
    {[1,2,3,4,5].map(i => (
      <span key={i}
        className={i <= Math.round(rating) ? 'star-filled' : 'star-empty'}
        style={{ cursor: interactive ? 'pointer' : 'default', fontSize: '1.4rem' }}
        onClick={() => interactive && onRate && onRate(i)}
      >★</span>
    ))}
  </span>
);

export default function ProductDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [activeImg, setActiveImg] = useState(0);
  const [qty, setQty] = useState(1);
  const [review, setReview] = useState({ rating: 5, comment: '' });
  const [reviewImages, setReviewImages] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [reminded, setReminded] = useState(false);

  useEffect(() => {
    axios.get(`/api/products/${id}`).then(r => {
      setProduct(r.data);
      // Check if current user already set a reminder
      if (user && r.data.stockReminders?.includes(user._id)) {
        setReminded(true);
      }
    }).catch(() => navigate('/'));
    axios.get(`/api/reviews/${id}`).then(r => setReviews(r.data));
  }, [id, navigate, user]);

  const handleAddToCart = async (e) => {
    if (!user) { toast.info('Please login'); return; }
    if (user.role === 'seller') { toast.info('Sellers cannot buy'); return; }
    await addToCart(product._id, e);
    toast.success('Added to cart! 🛒');
  };

  const handleBuy = async () => {
    if (!user) { toast.info('Please login'); return; }
    if (user.role === 'seller') { toast.info('Sellers cannot buy'); return; }
    if (!user.address?.street) {
      toast.error('Please update your delivery address in Profile first');
      navigate('/profile');
      return;
    }
    setShowPayment(true);
  };

  const handleRemindMe = async () => {
    if (!user) { toast.info('Please login'); return; }
    try {
      await axios.post(`/api/products/${id}/remind`);
      setReminded(true);
      toast.success('You will be notified when stock is restored! 🔔');
    } catch {
      toast.error('Failed to set reminder');
    }
  };

  const handleReview = async (e) => {
    e.preventDefault();
    if (!user) { toast.info('Please login to review'); return; }
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('rating', review.rating);
      fd.append('comment', review.comment);
      reviewImages.forEach(img => fd.append('images', img));
      const res = await axios.post(`/api/reviews/${id}`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setReviews([res.data, ...reviews]);
      setReview({ rating: 5, comment: '' });
      setReviewImages([]);
      toast.success('Review submitted! ⭐');
      const updated = await axios.get(`/api/products/${id}`);
      setProduct(updated.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
    setSubmitting(false);
  };

  if (!product) return <div style={{ textAlign: 'center', padding: '4rem', fontSize: '1.5rem' }}>Loading...</div>;

  const imgSrc = (idx) => product.images?.[idx]
    ? `http://localhost:5000${product.images[idx]}`
    : `https://via.placeholder.com/500x400?text=${encodeURIComponent(product.name)}`;

  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  return (
    <div className="detail-page">
      <BackButton />
      <div className="detail-container">
        {/* Images */}
        <div className="detail-images">
          <img src={imgSrc(activeImg)} alt={product.name} className="main-img" />
          {product.images?.length > 1 && (
            <div className="thumb-row">
              {product.images.map((_, i) => (
                <img key={i} src={imgSrc(i)} alt="" className={`thumb ${activeImg === i ? 'active' : ''}`}
                  onClick={() => setActiveImg(i)} />
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="detail-info">
          <h1 className="detail-name">{product.name}</h1>
          <div className="detail-rating">
            <Stars rating={product.ratings} />
            <span style={{ color: '#999', fontSize: '0.9rem' }}>({product.numReviews} reviews)</span>
          </div>

          {product.offerActive && product.offer && (
            <div className="offer-badge" style={{ marginBottom: '1rem' }}>🔥 {product.offer}</div>
          )}

          <div className="detail-price-row">
            <span className="detail-price">{formatINR(product.price)}</span>
            {product.originalPrice && (
              <>
                <span className="detail-original">{formatINR(product.originalPrice)}</span>
                <span className="detail-discount">{discount}% off</span>
              </>
            )}
          </div>

          <p className="detail-desc">{product.description}</p>

          <div className="detail-meta">
            <span>Category: <strong>{product.category}</strong></span>
            <span>Seller: <strong>{product.seller?.name}</strong></span>
            <span>Stock: <strong>
              {product.stock === 0 ? (
                <span className="stock-badge out">Out of Stock</span>
              ) : product.stock < 2 ? (
                <span className="stock-badge low">⚠️ Only {product.stock} left — Low Stock!</span>
              ) : product.stock >= 3 && product.stock <= 7 ? (
                <span className="stock-badge fast">🔥 Selling Fast! {product.stock} left</span>
              ) : (
                <span className="stock-badge good">✅ Well Stocked ({product.stock} available)</span>
              )}
            </strong></span>
          </div>

          {user?.role !== 'seller' && (
            <div className="detail-actions">
              {product.stock === 0 ? (
                <button
                  className="btn-remind"
                  onClick={handleRemindMe}
                  disabled={reminded}
                >
                  {reminded ? '🔔 Reminder Set!' : '🔔 Remind Me When Back in Stock'}
                </button>
              ) : (
                <>
                  <div className="qty-selector">
                    <button onClick={() => setQty(Math.max(1, qty - 1))}>−</button>
                    <span>{qty}</span>
                    <button onClick={() => setQty(Math.min(product.stock, qty + 1))}>+</button>
                  </div>
                  <button className="btn-detail-cart" onClick={handleAddToCart}>🛒 Add to Cart</button>
                  <button className="btn-detail-buy" onClick={handleBuy}>⚡ Buy Now</button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {showPayment && product && (
        <PaymentModal
          product={product}
          quantity={qty}
          onClose={() => setShowPayment(false)}
        />
      )}

      {/* Reviews */}
      <div className="reviews-section">
        <h2>Customer Reviews</h2>

        {user && user.role !== 'seller' && (
          <form className="review-form" onSubmit={handleReview}>
            <h3>Write a Review</h3>
            <div style={{ marginBottom: '0.5rem' }}>
              <Stars rating={review.rating} interactive onRate={r => setReview({ ...review, rating: r })} />
            </div>
            <textarea
              placeholder="Share your experience..."
              value={review.comment}
              onChange={e => setReview({ ...review, comment: e.target.value })}
              required
              rows={3}
            />
            {/* Photo upload */}
            <div style={{ marginTop: '0.8rem' }}>
              <label style={{ fontSize: '0.82rem', color: 'var(--text3)', fontWeight: 600, display: 'block', marginBottom: 6 }}>
                📷 Add Photos (optional, up to 3)
              </label>
              <input type="file" accept="image/*" multiple
                onChange={e => setReviewImages(Array.from(e.target.files).slice(0, 3))}
                style={{ width: '100%', padding: '8px', border: '1px dashed rgba(124,58,237,0.3)', borderRadius: '10px', background: 'var(--bg2)', color: 'var(--text2)', cursor: 'pointer', fontSize: '0.82rem' }}
              />
              {reviewImages.length > 0 && (
                <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                  {reviewImages.map((img, i) => (
                    <div key={i} style={{ position: 'relative' }}>
                      <img src={URL.createObjectURL(img)} alt="" style={{ width: 70, height: 70, objectFit: 'cover', borderRadius: 10, border: '2px solid var(--primary)' }} />
                      <button type="button" onClick={() => setReviewImages(reviewImages.filter((_, idx) => idx !== i))}
                        style={{ position: 'absolute', top: -6, right: -6, background: 'var(--red)', color: 'white', border: 'none', borderRadius: '50%', width: 20, height: 20, cursor: 'pointer', fontSize: '0.7rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <button type="submit" disabled={submitting}>
              {submitting ? 'Submitting...' : 'Submit Review'}
            </button>
          </form>
        )}

        <div className="reviews-list">
          {reviews.length === 0 ? (
            <p style={{ color: '#999', textAlign: 'center', padding: '2rem' }}>No reviews yet. Be the first!</p>
          ) : reviews.map(r => (
            <div key={r._id} className="review-card">
              <div className="review-header">
                <span className="reviewer-name">👤 {r.userName}</span>
                <Stars rating={r.rating} />
                <span style={{ color: '#999', fontSize: '0.8rem' }}>{new Date(r.createdAt).toLocaleDateString('en-IN')}</span>
              </div>
              <p className="review-comment">{r.comment}</p>
              {r.images?.length > 0 && (
                <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                  {r.images.map((img, i) => (
                    <img key={i} src={`http://localhost:5000${img}`} alt="review"
                      style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 10, cursor: 'pointer', border: '1px solid var(--border)' }}
                      onClick={() => window.open(`http://localhost:5000${img}`, '_blank')}
                    />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
