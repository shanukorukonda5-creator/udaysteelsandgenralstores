import API_BASE from '../config';
import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import './ProductCard.css';

const formatINR = (price) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(price);

const Stars = ({ rating }) => (
  <span>
    {[1,2,3,4,5].map(i => (
      <span key={i} className={i <= Math.round(rating) ? 'star-filled' : 'star-empty'}>★</span>
    ))}
  </span>
);

// Inline SVG truck that drives across the button
const TruckSVG = () => (
  <svg width="64" height="32" viewBox="0 0 64 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Truck body */}
    <rect x="2" y="8" width="38" height="16" rx="3" fill="#7c3aed" />
    {/* Cab */}
    <rect x="36" y="4" width="20" height="20" rx="3" fill="#a855f7" />
    {/* Windshield */}
    <rect x="38" y="6" width="14" height="10" rx="2" fill="#06b6d4" opacity="0.8" />
    {/* Headlight */}
    <circle cx="57" cy="18" r="2" fill="#f59e0b" />
    {/* Cargo door lines */}
    <line x1="14" y1="8" x2="14" y2="24" stroke="#a855f7" strokeWidth="1" />
    <line x1="26" y1="8" x2="26" y2="24" stroke="#a855f7" strokeWidth="1" />
    {/* Wheels */}
    <circle cx="12" cy="26" r="5" fill="#1e1e35" stroke="#06b6d4" strokeWidth="2" />
    <circle cx="12" cy="26" r="2" fill="#06b6d4" />
    <circle cx="48" cy="26" r="5" fill="#1e1e35" stroke="#06b6d4" strokeWidth="2" />
    <circle cx="48" cy="26" r="2" fill="#06b6d4" />
    {/* Exhaust smoke dots */}
    <circle cx="4" cy="10" r="1.5" fill="#94a3b8" opacity="0.6" />
    <circle cx="2" cy="7" r="1" fill="#94a3b8" opacity="0.4" />
  </svg>
);

export default function ProductCard({ product }) {
  const { addToCart } = useCart();
  const { user } = useAuth();
  const [animating, setAnimating] = useState(false);
  const [wished, setWished] = useState(false);
  const [added, setAdded] = useState(false);
  const btnRef = useRef(null);

  const handleAddToCart = async (e) => {
    e.preventDefault();
    if (!user) { toast.info('Please login to add to cart'); return; }
    if (user.role === 'seller') { toast.info('Sellers cannot buy products'); return; }
    if (animating) return;

    setAnimating(true);

    // Trigger cart context animation
    await addToCart(product._id, e);

    // After truck drives across, show "Added" state
    setTimeout(() => {
      setAnimating(false);
      setAdded(true);
      toast.success(`${product.name} added! 🚚`, { icon: false });
      setTimeout(() => setAdded(false), 2500);
    }, 1900);
  };

  const imgSrc = product.images?.[0]
    ? `${API_BASE}${product.images[0]}`
    : `https://placehold.co/300x200/1a1a2e/a855f7?text=${encodeURIComponent(product.name)}`;

  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  return (
    <div className="product-card">
      <Link to={`/product/${product._id}`}>
        <div className="product-img-wrap">
          <img src={imgSrc} alt={product.name} className="product-img" />
          {product.offerActive && product.offer && (
            <div className="product-offer-tag">🔥 {product.offer}</div>
          )}
          {discount > 0 && <div className="discount-badge">{discount}% OFF</div>}
          <button className="wishlist-btn" onClick={e => { e.preventDefault(); setWished(!wished); }}>
            {wished ? '❤️' : '🤍'}
          </button>
        </div>
        <div className="product-info">
          <h3 className="product-name">{product.name}</h3>
          <p className="product-desc">{product.description.substring(0, 55)}...</p>
          <div className="product-rating">
            <Stars rating={product.ratings} />
            <span className="review-count">({product.numReviews})</span>
          </div>
          <div className="product-price-row">
            <span className="product-price">{formatINR(product.price)}</span>
            {product.originalPrice && (
              <span className="product-original-price">{formatINR(product.originalPrice)}</span>
            )}
          </div>
        </div>
      </Link>

      {user?.role !== 'seller' && (
        <div className="product-actions">
          {/* Truck Button */}
          <div className="truck-btn-wrap">
            <button
              ref={btnRef}
              className={`truck-btn ${animating ? 'animating' : ''} ${added ? 'added' : ''}`}
              onClick={handleAddToCart}
              disabled={animating}
              style={added ? { background: 'rgba(16,185,129,0.15)', borderColor: 'var(--green)', color: 'var(--green)' } : {}}
            >
              <span className="btn-label">
                {added ? '✅ Added!' : '🛒 Add to Cart'}
              </span>

              {/* Truck SVG that drives across */}
              {animating && (
                <span className="truck-anim driving">
                  <TruckSVG />
                </span>
              )}

              {/* Road line */}
              <span className="truck-road" />

              {/* Smoke */}
              {animating && <span className="smoke" style={{ left: '5%' }}>💨</span>}
            </button>
          </div>

          <Link to={`/product/${product._id}`} className="btn-buy">⚡ Buy</Link>
        </div>
      )}
    </div>
  );
}

