import API_BASE from '../config';
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { toast } from 'react-toastify';
import PaymentModal from '../components/PaymentModal';
import BackButton from '../components/BackButton';
import './Cart.css';

const formatINR = (price) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(price);

export default function Cart() {
  const { cart, removeFromCart, updateQuantity, cartTotal, fetchCart } = useCart();
  const [paymentItem, setPaymentItem] = useState(null);
  const navigate = useNavigate();

  const handleBuy = async (item) => {
    setPlacing(item.product._id);
    try {
      await axios.post('/api/orders', { productId: item.product._id, quantity: item.quantity });
      toast.success('Order placed! 🎉');
      await fetchCart();
      navigate('/orders');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Order failed');
    }
    setPlacing(null);
  };

  if (cart.length === 0) return (
    <div className="cart-empty">
      <div style={{ fontSize: '5rem' }}>🛒</div>
      <h2>Your cart is empty</h2>
      <p>Looks like you haven't added anything yet</p>
      <Link to="/" className="shop-btn">Start Shopping</Link>
    </div>
  );

  return (
    <div className="cart-page">
      <BackButton />
      <h1>🛒 My Cart <span>({cart.length} items)</span></h1>
      <div className="cart-layout">
        <div className="cart-items">
          {cart.map(item => {
            if (!item.product) return null;
            const imgSrc = item.product.images?.[0]
              ? `${API_BASE}${item.product.images[0]}`
              : `https://via.placeholder.com/100x100?text=Product`;
            return (
              <div key={item.product._id} className="cart-item">
                <img src={imgSrc} alt={item.product.name} className="cart-item-img" />
                <div className="cart-item-info">
                  <Link to={`/product/${item.product._id}`} className="cart-item-name">{item.product.name}</Link>
                  <div className="cart-item-price">{formatINR(item.product.price)}</div>
                  <div className="cart-item-actions">
                    <div className="qty-selector">
                      <button onClick={() => updateQuantity(item.product._id, Math.max(1, item.quantity - 1))}>−</button>
                      <span>{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.product._id, item.quantity + 1)}>+</button>
                    </div>
                    <span className="cart-item-total">{formatINR(item.product.price * item.quantity)}</span>
                    <button className="buy-item-btn" onClick={() => setPaymentItem(item)} >
                      ⚡ Buy
                    </button>
                    <button className="remove-btn" onClick={() => removeFromCart(item.product._id)}>🗑️</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="cart-summary">
          <h3>Order Summary</h3>
          <div className="summary-row"><span>Items ({cart.length})</span><span>{formatINR(cartTotal)}</span></div>
          <div className="summary-row"><span>Delivery</span><span style={{ color: '#2e7d32' }}>FREE</span></div>
          <div className="summary-total"><span>Total</span><span>{formatINR(cartTotal)}</span></div>
          <p style={{ fontSize: '0.8rem', color: '#999', marginTop: '0.5rem' }}>Use "Buy" on individual items to choose payment method</p>
        </div>
      </div>

      {paymentItem && (
        <PaymentModal
          product={paymentItem.product}
          quantity={paymentItem.quantity}
          onClose={() => { setPaymentItem(null); fetchCart(); }}
        />
      )}
    </div>
  );
}

