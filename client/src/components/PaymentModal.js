import API_BASE from '../config';
import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './PaymentModal.css';

const formatINR = (price) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(price);

// Load Razorpay script dynamically
const loadRazorpay = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) { resolve(true); return; }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export default function PaymentModal({ product, quantity, onClose }) {
  const [method, setMethod] = useState('cod');
  const [placing, setPlacing] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();
  const total = product.price * quantity;

  const handleCOD = async () => {
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

  const handleRazorpay = async () => {
    setPlacing(true);
    try {
      // Load Razorpay script
      const loaded = await loadRazorpay();
      if (!loaded) {
        toast.error('Failed to load payment gateway. Check your internet.');
        setPlacing(false);
        return;
      }

      // Create order on backend
      const { data } = await axios.post('/api/payment/create-order', {
        amount: total,
        productId: product._id,
        quantity
      });

      // Open Razorpay checkout
      const options = {
        key: data.keyId,
        amount: data.amount,
        currency: data.currency,
        name: 'Uday Steels & General Stores',
        description: product.name,
        order_id: data.orderId,
        prefill: {
          name: user?.name,
          email: user?.email,
          contact: user?.address?.phone || ''
        },
        theme: { color: '#7c3aed' },
        handler: async (response) => {
          try {
            // Verify payment and place order
            const res = await axios.post('/api/payment/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              productId: product._id,
              quantity
            });
            if (res.data.success) {
              toast.success('Payment successful! Order placed 🎉');
              onClose();
              navigate('/orders');
            }
          } catch {
            toast.error('Payment verification failed');
          }
        },
        modal: {
          ondismiss: () => {
            toast.info('Payment cancelled');
            setPlacing(false);
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Payment failed');
      setPlacing(false);
    }
  };

  const handlePlaceOrder = () => {
    if (method === 'cod') handleCOD();
    else handleRazorpay();
  };

  return (
    <div className="payment-overlay" onClick={onClose}>
      <div className="payment-modal" onClick={e => e.stopPropagation()}>
        <div className="payment-header">
          <h2>💳 Choose Payment Method</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        {/* Order summary */}
        <div className="order-summary">
          <img
            src={product.images?.[0] ? (product.images[0].startsWith('http') ? product.images[0] : `${API_BASE}${product.images[0]}`) : `https://placehold.co/60x60/1a1a2e/a855f7?text=P`}
            alt={product.name}
            className="summary-img"
          />
          <div>
            <p className="summary-name">{product.name}</p>
            <p className="summary-qty">Qty: {quantity}</p>
            <p className="summary-total">{formatINR(total)}</p>
          </div>
        </div>

        {/* Payment methods */}
        <div className="payment-methods">
          {/* Cash on Delivery */}
          <div className={`payment-option ${method === 'cod' ? 'selected' : ''}`}
            onClick={() => setMethod('cod')}>
            <div className="payment-option-left">
              <span className="payment-icon">💵</span>
              <div>
                <strong>Cash on Delivery</strong>
                <p>Pay when your order arrives</p>
              </div>
            </div>
            <div className={`radio ${method === 'cod' ? 'checked' : ''}`} />
          </div>

          {/* Razorpay — UPI/Cards/Wallets */}
          <div className={`payment-option ${method === 'razorpay' ? 'selected' : ''}`}
            onClick={() => setMethod('razorpay')}>
            <div className="payment-option-left">
              <span className="payment-icon">📱</span>
              <div>
                <strong>Pay Online</strong>
                <p>UPI • PhonePe • GPay • Cards • Wallets</p>
              </div>
            </div>
            <div className={`radio ${method === 'razorpay' ? 'checked' : ''}`} />
          </div>
        </div>

        {/* Razorpay info */}
        {method === 'razorpay' && (
          <div className="razorpay-info">
            <div className="razorpay-logos">
              <span>📱 PhonePe</span>
              <span>💚 GPay</span>
              <span>💙 Paytm</span>
              <span>💳 Cards</span>
            </div>
            <p>Secure payment powered by Razorpay</p>
          </div>
        )}

        <div className="payment-total-row">
          <span>Total Amount</span>
          <span className="payment-total-amount">{formatINR(total)}</span>
        </div>

        <button className="pay-btn" onClick={handlePlaceOrder} disabled={placing}>
          {placing ? 'Processing...' :
            method === 'cod' ? '✅ Place Order (COD)' : '💳 Pay Now'}
        </button>
      </div>
    </div>
  );
}

