import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import './Auth.css';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post('/api/auth/login', form);
      login(res.data);
      toast.success(`Welcome back, ${res.data.user.name}! 👋`);
      navigate(res.data.user.role === 'seller' ? '/seller' : '/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    }
    setLoading(false);
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <span className="auth-logo">🏪</span>
          <h2>Welcome Back</h2>
          <p>Login to Uday Steels & General Stores</p>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email</label>
            <input type="email" placeholder="your@email.com" value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })} required />
          </div>
          <div className="form-group">
            <label>Password</label>
            <div style={{ position: 'relative' }}>
              <input type={showPass ? 'text' : 'password'} placeholder="••••••••"
                value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
                required style={{ paddingRight: 44 }} />
              <button type="button" onClick={() => setShowPass(!showPass)}
                style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.1rem' }}>
                {showPass ? '🙈' : '👁️'}
              </button>
            </div>
          </div>
          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? 'Logging in...' : '🔑 Login'}
          </button>
        </form>
        <p className="auth-switch">Don't have an account? <Link to="/register">Register here</Link></p>
      </div>
    </div>
  );
}
