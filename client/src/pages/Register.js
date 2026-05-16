import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import './Auth.css';

const PasswordStrength = ({ password }) => {
  const checks = [
    { label: '8+ chars', ok: password.length >= 8 },
    { label: 'Uppercase', ok: /[A-Z]/.test(password) },
    { label: 'Number', ok: /[0-9]/.test(password) },
  ];
  const score = checks.filter(c => c.ok).length;
  const colors = ['#ef4444', '#f59e0b', '#10b981'];
  const labels = ['Weak', 'Fair', 'Strong'];
  if (!password) return null;
  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ display: 'flex', gap: 4, marginBottom: 6 }}>
        {[0,1,2].map(i => (
          <div key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: i < score ? colors[score-1] : '#333', transition: 'background 0.3s' }} />
        ))}
      </div>
      <span style={{ fontSize: '0.75rem', color: colors[score-1] || '#aaa', fontWeight: 700 }}>
        {score > 0 ? labels[score-1] : ''}
      </span>
    </div>
  );
};

export default function Register() {
  const [form, setForm] = useState({
    name: '', email: '', password: '', role: 'buyer', sellerKey: '',
    address: { street: '', city: '', state: '', pincode: '', phone: '' }
  });
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post('/api/auth/register', form);
      login(res.data);
      toast.success(`Welcome to Uday Steels! 🎉`);
      navigate(res.data.user.role === 'seller' ? '/seller' : '/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    }
    setLoading(false);
  };

  const setAddr = (field, val) => setForm({ ...form, address: { ...form.address, [field]: val } });

  return (
    <div className="auth-page">
      <div className="auth-card wide">
        <div className="auth-header">
          <span className="auth-logo">🏪</span>
          <h2>Create Account</h2>
          <p>Join Uday Steels & General Stores</p>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label>Full Name</label>
              <input placeholder="Your full name" value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input type="email" placeholder="your@email.com" value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })} required />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Password</label>
              <div style={{ position: 'relative' }}>
                <input type={showPass ? 'text' : 'password'} placeholder="Min 8 chars, 1 uppercase, 1 number"
                  value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required
                  style={{ paddingRight: 44 }} />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.1rem' }}>
                  {showPass ? '🙈' : '👁️'}
                </button>
              </div>
              <PasswordStrength password={form.password} />
            </div>
            <div className="form-group">
              <label>I am a</label>
              <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value, sellerKey: '' })}>
                <option value="buyer">🛒 Buyer</option>
                <option value="seller">🏪 Seller</option>
              </select>
            </div>
          </div>

          {form.role === 'seller' && (
            <div className="seller-key-box">
              <div className="seller-key-header">
                <span>🔑</span>
                <div>
                  <strong>Seller Verification Required</strong>
                  <p>Enter the secret key provided by the store admin.</p>
                </div>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Seller Secret Key</label>
                <div style={{ position: 'relative' }}>
                  <input type={showKey ? 'text' : 'password'} placeholder="Enter seller secret key"
                    value={form.sellerKey} onChange={e => setForm({ ...form, sellerKey: e.target.value })} required
                    style={{ paddingRight: 44 }} />
                  <button type="button" onClick={() => setShowKey(!showKey)}
                    style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.1rem' }}>
                    {showKey ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {form.role === 'buyer' && (
            <>
              <p className="section-label">📍 Delivery Address</p>
              <div className="form-group">
                <label>Street Address</label>
                <input placeholder="House no, Street, Area" value={form.address.street}
                  onChange={e => setAddr('street', e.target.value)} />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>City</label>
                  <input placeholder="City" value={form.address.city} onChange={e => setAddr('city', e.target.value)} />
                </div>
                <div className="form-group">
                  <label>State</label>
                  <input placeholder="State" value={form.address.state} onChange={e => setAddr('state', e.target.value)} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Pincode</label>
                  <input placeholder="Pincode" value={form.address.pincode} onChange={e => setAddr('pincode', e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Phone</label>
                  <input placeholder="+91 XXXXX XXXXX" value={form.address.phone} onChange={e => setAddr('phone', e.target.value)} />
                </div>
              </div>
            </>
          )}

          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? 'Creating Account...' : '🚀 Create Account'}
          </button>
        </form>
        <p className="auth-switch">Already have an account? <Link to="/login">Login here</Link></p>
      </div>
    </div>
  );
}
