import API_BASE from '../config';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import './SellerDashboard.css';

const formatINR = (price) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(price);

const CATEGORIES = ['Mixer Grinders', 'Rice Cookers', 'Iron Boxes', 'Grinders', 'Pressure Cookers', 'Gas Stoves', '2 Burners', '4 Burners', 'Fans', 'Ceiling Fans', 'Stand Fans', 'Table Fans', 'USA Products', 'Dosa Tawas', 'Others'];

const emptyForm = { name: '', description: '', price: '', originalPrice: '', category: 'Mixer Grinders', stock: 10 };

export default function SellerDashboard() {
  const [tab, setTab] = useState('products');
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [buyers, setBuyers] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [images, setImages] = useState([]);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [offerModal, setOfferModal] = useState(null);
  const [offerText, setOfferText] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [cancelModal, setCancelModal] = useState(null);
  const [cancelReason, setCancelReason] = useState('');

  useEffect(() => {
    fetchProducts();
    fetchOrders();
    fetchBuyers();
  }, []);

  const fetchProducts = async () => {
    const res = await axios.get('/api/products/seller/mine');
    setProducts(res.data);
  };

  const fetchOrders = async () => {
    const res = await axios.get('/api/orders/seller');
    setOrders(res.data);
  };

  const fetchBuyers = async () => {
    try {
      const res = await axios.get('/api/auth/buyers');
      setBuyers(res.data);
    } catch {}
  };

  const cancelOrder = async () => {
    if (!cancelReason.trim()) { toast.error('Please enter a reason'); return; }
    try {
      await axios.put(`/api/orders/${cancelModal}/cancel`, { reason: cancelReason });
      toast.success('Order cancelled and buyer notified');
      setCancelModal(null);
      setCancelReason('');
      fetchOrders();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel');
    }
  };

  const toggleBlock = async (buyerId, isBlocked, name) => {
    if (!window.confirm(`${isBlocked ? 'Unblock' : 'Block'} ${name}?`)) return;
    try {
      await axios.put(`/api/auth/${isBlocked ? 'unblock' : 'block'}/${buyerId}`);
      toast.success(`${name} ${isBlocked ? 'unblocked' : 'blocked'} successfully`);
      fetchBuyers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      images.forEach(img => fd.append('images', img));

      if (editing) {
        await axios.put(`/api/products/${editing}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        toast.success('Product updated!');
      } else {
        await axios.post('/api/products', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        toast.success('Product added! 🎉');
      }
      setForm(emptyForm);
      setImages([]);
      setEditing(null);
      setShowForm(false);
      fetchProducts();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
    setSaving(false);
  };

  const handleEdit = (product) => {
    setForm({
      name: product.name,
      description: product.description,
      price: product.price,
      originalPrice: product.originalPrice || '',
      category: product.category,
      stock: product.stock
    });
    setEditing(product._id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this product?')) return;
    await axios.delete(`/api/products/${id}`);
    toast.success('Deleted');
    fetchProducts();
  };

  const sendOffer = async () => {
    if (!offerText.trim()) return;
    try {
      await axios.post(`/api/products/${offerModal}/offer`, { offer: offerText });
      toast.success('Offer sent to all buyers! 🎉');
      setOfferModal(null);
      setOfferText('');
      fetchProducts();
    } catch {
      toast.error('Failed to send offer');
    }
  };

  const removeOffer = async (productId) => {
    if (!window.confirm('Remove this offer?')) return;
    try {
      await axios.put(`/api/products/${productId}/remove-offer`);
      toast.success('Offer removed');
      fetchProducts();
    } catch {
      toast.error('Failed to remove offer');
    }
  };

  const updateOrderStatus = async (orderId, status) => {
    await axios.put(`/api/orders/${orderId}/status`, { status });
    toast.success('Status updated');
    fetchOrders();
  };

  const totalRevenue = orders.reduce((sum, o) => sum + o.totalPrice, 0);

  return (
    <div className="seller-page">
      <div className="seller-header">
        <h1>🏪 Seller Dashboard</h1>
        <div className="seller-stats">
          <div className="stat-card"><div className="stat-num">{products.length}</div><div className="stat-label">Products</div></div>
          <div className="stat-card"><div className="stat-num">{orders.length}</div><div className="stat-label">Orders</div></div>
          <div className="stat-card"><div className="stat-num">{formatINR(totalRevenue)}</div><div className="stat-label">Revenue</div></div>
        </div>
      </div>

      <div className="seller-tabs">
        <button className={tab === 'products' ? 'active' : ''} onClick={() => setTab('products')}>📦 My Products</button>
        <button className={tab === 'orders' ? 'active' : ''} onClick={() => setTab('orders')}>🛒 Orders ({orders.length})</button>
        <button className={tab === 'buyers' ? 'active' : ''} onClick={() => setTab('buyers')}>👥 Buyers ({buyers.length})</button>
      </div>

      {tab === 'products' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
            <button className="add-product-btn" onClick={() => { setShowForm(!showForm); setEditing(null); setForm(emptyForm); }}>
              {showForm ? '✕ Cancel' : '+ Add Product'}
            </button>
          </div>

          {showForm && (
            <div className="product-form-card">
              <h2>{editing ? 'Edit Product' : 'Add New Product'}</h2>
              <form onSubmit={handleSubmit}>
                <div className="form-row">
                  <div className="form-group">
                    <label>Product Name *</label>
                    <input placeholder="e.g. Wireless Earbuds" value={form.name}
                      onChange={e => setForm({ ...form, name: e.target.value })} required />
                  </div>
                  <div className="form-group">
                    <label>Category</label>
                    <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                      {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label>Description *</label>
                  <textarea placeholder="Describe your product..." value={form.description}
                    onChange={e => setForm({ ...form, description: e.target.value })} required rows={3} />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Price (₹) *</label>
                    <input type="number" placeholder="999" value={form.price}
                      onChange={e => setForm({ ...form, price: e.target.value })} required min="1" />
                  </div>
                  <div className="form-group">
                    <label>Original Price (₹) <span style={{ color: '#aaa' }}>optional</span></label>
                    <input type="number" placeholder="1499" value={form.originalPrice}
                      onChange={e => setForm({ ...form, originalPrice: e.target.value })} min="1" />
                  </div>
                  <div className="form-group">
                    <label>Stock</label>
                    <input type="number" value={form.stock}
                      onChange={e => setForm({ ...form, stock: e.target.value })} min="0" />
                  </div>
                </div>
                <div className="form-group">
                  <label>Product Images (up to 5)</label>
                  <input type="file" accept="image/*" multiple
                    onChange={e => setImages(Array.from(e.target.files))}
                    style={{ width: '100%', padding: '10px', border: '1.5px dashed #ff6b35', borderRadius: '10px', cursor: 'pointer', background: '#fff8f5' }}
                  />
                  <p style={{ fontSize: '0.78rem', color: '#aaa', marginTop: '4px' }}>Hold Ctrl (or Cmd) to select multiple images</p>
                  {images.length > 0 && (
                    <div className="img-preview-row">
                      {images.map((img, i) => (
                        <div key={i} style={{ position: 'relative' }}>
                          <img src={URL.createObjectURL(img)} alt="" className="img-preview" />
                          <button type="button"
                            onClick={() => setImages(images.filter((_, idx) => idx !== i))}
                            style={{ position: 'absolute', top: -6, right: -6, background: '#ff4444', color: 'white', border: 'none', borderRadius: '50%', width: 20, height: 20, cursor: 'pointer', fontSize: '0.7rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <button type="submit" className="save-product-btn" disabled={saving}>
                  {saving ? 'Saving...' : editing ? 'Update Product' : 'Add Product'}
                </button>
              </form>
            </div>
          )}

          <div className="products-table">
            {products.length === 0 ? (
              <div className="empty-state"><div style={{ fontSize: '3rem' }}>📦</div><p>No products yet. Add your first product!</p></div>
            ) : products.map(p => {
              const imgSrc = p.images?.[0] ? `${API_BASE}${p.images[0]}` : `https://via.placeholder.com/60x60?text=P`;
              return (
                <div key={p._id} className="product-row">
                  <img src={imgSrc} alt={p.name} className="product-row-img" />
                  <div className="product-row-info">
                    <h3>{p.name}</h3>
                    <p>{p.category} • Stock: {p.stock}</p>
                    {p.offerActive && <span className="offer-badge">🔥 {p.offer}</span>}
                  </div>
                  <div className="product-row-price">
                    <strong>{formatINR(p.price)}</strong>
                    {p.originalPrice && <span style={{ color: '#aaa', fontSize: '0.8rem', textDecoration: 'line-through' }}>{formatINR(p.originalPrice)}</span>}
                  </div>
                  <div className="product-row-actions">
                    <button className="btn-offer" onClick={() => { setOfferModal(p._id); setOfferText(p.offer || ''); }}>🔥 {p.offerActive ? 'Edit Offer' : 'Add Offer'}</button>
                    {p.offerActive && (
                      <button className="btn-delete" onClick={() => removeOffer(p._id)}>✕ Remove Offer</button>
                    )}
                    <button className="btn-edit" onClick={() => handleEdit(p)}>✏️ Edit</button>
                    <button className="btn-delete" onClick={() => handleDelete(p._id)}>🗑️</button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {tab === 'orders' && (
        <div className="orders-section">
          {orders.length === 0 ? (
            <div className="empty-state"><div style={{ fontSize: '3rem' }}>🛒</div><p>No orders yet</p></div>
          ) : orders.map(order => (
            <div key={order._id} className="seller-order-card">
              <div className="seller-order-header">
                <span className="order-id">#{order._id.slice(-8).toUpperCase()}</span>
                <span style={{ color: '#999', fontSize: '0.85rem' }}>{new Date(order.createdAt).toLocaleString('en-IN')}</span>
                {order.status !== 'cancelled' && order.status !== 'delivered' ? (
                  <select value={order.status} onChange={e => updateOrderStatus(order._id, e.target.value)} className="status-select">
                    {['pending', 'confirmed', 'shipped', 'delivered'].map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                  </select>
                ) : (
                  <span style={{ marginLeft: 'auto', padding: '6px 14px', borderRadius: 10, fontSize: '0.82rem', fontWeight: 700,
                    background: order.status === 'cancelled' ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.15)',
                    color: order.status === 'cancelled' ? 'var(--red)' : 'var(--green)' }}>
                    {order.status === 'cancelled' ? '❌ Cancelled' : '✅ Delivered'}
                  </span>
                )}
                {order.status !== 'cancelled' && order.status !== 'delivered' && (
                  <button className="btn-delete" style={{ marginLeft: 8 }} onClick={() => { setCancelModal(order._id); setCancelReason(''); }}>
                    ❌ Cancel
                  </button>
                )}
              </div>
              <div className="seller-order-body">
                <div className="order-product-info">
                  <strong>📦 {order.product?.name}</strong>
                  <span>Qty: {order.quantity} | {formatINR(order.totalPrice)}</span>
                </div>
                <div className="buyer-details">
                  <h4>👤 Buyer Details</h4>
                  <p><strong>Name:</strong> {order.buyerDetails?.name}</p>
                  <p><strong>Email:</strong> {order.buyerDetails?.email}</p>
                  <p><strong>Phone:</strong> {order.buyerDetails?.phone || 'N/A'}</p>
                  <p><strong>Address:</strong> {order.buyerDetails?.address?.street}, {order.buyerDetails?.address?.city}, {order.buyerDetails?.address?.state} - {order.buyerDetails?.address?.pincode}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Buyers Tab */}
      {tab === 'buyers' && (
        <div className="buyers-section">
          {buyers.length === 0 ? (
            <div className="empty-state"><div style={{ fontSize: '3rem' }}>👥</div><p>No buyers registered yet</p></div>
          ) : buyers.map(buyer => (
            <div key={buyer._id} className="buyer-row">
              <div className="buyer-avatar">{buyer.name[0].toUpperCase()}</div>
              <div className="buyer-info">
                <h3>{buyer.name} {buyer.isBlocked && <span className="blocked-tag">🚫 Blocked</span>}</h3>
                <p>{buyer.email}</p>
                <p style={{ fontSize: '0.78rem', color: 'var(--text3)' }}>
                  📍 {buyer.address?.city || 'No address'} • 📞 {buyer.address?.phone || 'No phone'}
                </p>
              </div>
              <button
                className={buyer.isBlocked ? 'btn-edit' : 'btn-delete'}
                onClick={() => toggleBlock(buyer._id, buyer.isBlocked, buyer.name)}
              >
                {buyer.isBlocked ? '✅ Unblock' : '🚫 Block'}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Cancel Order Modal */}
      {cancelModal && (
        <div className="modal-overlay" onClick={() => setCancelModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>❌ Cancel Order</h3>
            <p style={{ color: 'var(--text2)', fontSize: '0.88rem', marginBottom: '1rem' }}>
              The buyer will be notified and stock will be restored.
            </p>
            <div className="form-group">
              <label>Reason for cancellation *</label>
              <textarea
                placeholder="e.g. Out of stock, delivery not possible to this area..."
                value={cancelReason}
                onChange={e => setCancelReason(e.target.value)}
                rows={3}
                style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid rgba(124,58,237,0.2)', background: 'var(--bg2)', color: 'var(--text)', fontFamily: 'Poppins', fontSize: '0.88rem', resize: 'vertical', outline: 'none' }}
              />
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '1rem' }}>
              <button className="modal-cancel" onClick={() => setCancelModal(null)}>Go Back</button>
              <button className="modal-send" style={{ background: 'linear-gradient(135deg, var(--red), #ff6b35)' }} onClick={cancelOrder}>
                ❌ Confirm Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Offer Modal */}
      {offerModal && (
        <div className="modal-overlay" onClick={() => setOfferModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>🔥 {products.find(p => p._id === offerModal)?.offerActive ? 'Edit Special Offer' : 'Add Special Offer'}</h3>
            <p style={{ color: 'var(--text2)', fontSize: '0.88rem', marginBottom: '1rem' }}>This will notify all buyers about your offer</p>
            <input
              placeholder="e.g. 20% off today only!"
              value={offerText}
              onChange={e => setOfferText(e.target.value)}
              style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1.5px solid #ddd', fontSize: '0.95rem', fontFamily: 'Poppins', outline: 'none' }}
            />
            <div style={{ display: 'flex', gap: '10px', marginTop: '1rem' }}>
              <button className="modal-cancel" onClick={() => setOfferModal(null)}>Cancel</button>
              <button className="modal-send" onClick={sendOffer}>Send Offer 🚀</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

