import API_BASE from '../config';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import BackButton from '../components/BackButton';
import './Orders.css';

const formatINR = (price) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(price);

const STATUS_COLORS = {
  pending: '#ff9800',
  confirmed: '#2196f3',
  shipped: '#9c27b0',
  delivered: '#4caf50'
};

const STATUS_ICONS = { pending: '⏳', confirmed: '✅', shipped: '🚚', delivered: '📦' };

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('/api/orders/mine')
      .then(r => setOrders(r.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ textAlign: 'center', padding: '4rem' }}>Loading orders...</div>;

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
                  <p style={{ color: '#999', fontSize: '0.85rem' }}>
                    Ordered on {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                  <p style={{ color: '#666', fontSize: '0.85rem' }}>Seller: {order.seller?.name}</p>
                </div>
              </div>
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
            </div>
          );
        })}
      </div>
    </div>
  );
}

