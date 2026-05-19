import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import API_BASE from '../config';
import './OfferPopup.css';

const formatINR = (price) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(price);

export default function OfferPopup() {
  const [offers, setOffers] = useState([]);
  const [current, setCurrent] = useState(0);
  const [visible, setVisible] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Only show once per session
    const shown = sessionStorage.getItem('offerPopupShown');
    if (shown) return;

    const timer = setTimeout(async () => {
      try {
        const res = await axios.get('/api/products?offerActive=true');
        const activeOffers = res.data.filter(p => p.offerActive && p.offer);
        if (activeOffers.length > 0) {
          setOffers(activeOffers);
          setVisible(true);
          sessionStorage.setItem('offerPopupShown', 'true');
        }
      } catch {}
    }, 1500); // show after 1.5s

    return () => clearTimeout(timer);
  }, []);

  if (!visible || offers.length === 0) return null;

  const product = offers[current];
  const imgSrc = product.images?.[0]
    ? (product.images[0].startsWith('http') ? product.images[0] : `${API_BASE}${product.images[0]}`)
    : `https://placehold.co/300x200/1a1a2e/a855f7?text=${encodeURIComponent(product.name)}`;

  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  const handleViewProduct = () => {
    setVisible(false);
    navigate(`/product/${product._id}`);
  };

  const handleOk = () => setVisible(false);

  return (
    <div className="op-overlay" onClick={handleOk}>
      <div className="op-modal" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="op-header">
          <span className="op-fire">🔥</span>
          <span className="op-title">Special Offer!</span>
          <button className="op-close" onClick={handleOk}>✕</button>
        </div>

        {/* Multiple offers indicator */}
        {offers.length > 1 && (
          <div className="op-dots">
            {offers.map((_, i) => (
              <span key={i} className={`op-dot ${i === current ? 'active' : ''}`}
                onClick={() => setCurrent(i)} />
            ))}
          </div>
        )}

        {/* Product image */}
        <div className="op-img-wrap">
          <img src={imgSrc} alt={product.name} className="op-img" />
          {discount > 0 && (
            <div className="op-discount-badge">{discount}% OFF</div>
          )}
        </div>

        {/* Product info */}
        <div className="op-info">
          <h3 className="op-name">{product.name}</h3>
          <p className="op-desc">{product.description?.substring(0, 80)}...</p>

          <div className="op-offer-tag">🎉 {product.offer}</div>

          <div className="op-price-row">
            <span className="op-price">{formatINR(product.price)}</span>
            {product.originalPrice && (
              <span className="op-original">{formatINR(product.originalPrice)}</span>
            )}
          </div>
        </div>

        {/* Buttons */}
        <div className="op-actions">
          <button className="op-btn-ok" onClick={handleOk}>
            OK, Maybe Later
          </button>
          <button className="op-btn-view" onClick={handleViewProduct}>
            View Product →
          </button>
        </div>

        {/* Navigate between offers */}
        {offers.length > 1 && (
          <div className="op-nav">
            <button onClick={() => setCurrent(c => (c - 1 + offers.length) % offers.length)}>‹ Prev</button>
            <span>{current + 1} / {offers.length} offers</span>
            <button onClick={() => setCurrent(c => (c + 1) % offers.length)}>Next ›</button>
          </div>
        )}
      </div>
    </div>
  );
}
