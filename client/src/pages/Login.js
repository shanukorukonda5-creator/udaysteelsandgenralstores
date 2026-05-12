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
  const [needsOTP, setNeedsOTP] = useState(false);
  const [otp, setOtp] = useState('');
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
      const data = err.response?.data;
      if (data?.requiresOTP) {
        setNeedsOTP(true);
        toast.info('Please verify your email first');
      } else {
        toast.error(data?.message || 'Login failed');
      }
    }
    setLoading(false);
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post('/api/auth/verify-otp', { email: form.email, otp });
      login(res.data);
      toast.success(`Verified! Welcome, ${res.data.user.name}! 🎉`);
      navigate(res.data.user.role === 'seller' ? '/seller' : '/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid OTP');
    }
    setLoading(false);
  };

  if (needsOTP) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <div className="auth-header">
            <span className="auth-logo">🔐</span>
            <h2>Verify Your Account</h2>
            <p>Enter the 6-digit OTP sent to your email</p>
          </div>
          <form onSubmit={handleVerifyOTP}>
            <div className="form-group">
              <label>OTP Code</label>
              <input type="text" placeholder="Enter 6-digit OTP"
                value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                maxLength={6} required
                style={{ textAlign: 'center', fontSize: '1.5rem', letterSpacing: '0.5rem', fontWeight: 700, color: 'white', background: 'var(--bg3)' }} />
            </div>
            <button type="submit" className="auth-btn" disabled={loading || otp.length !== 6}>
              {loading ? 'Verifying...' : '✅ Verify & Login'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <span className="auth-logo">🏪</span>
          <h2>Welcome Back</h2>
          <p>Login to Uday Steels & General Stores</p>
        </div>

        <div className="otp-hint">
          🔒 Your account is protected with OTP verification & brute-force protection
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
