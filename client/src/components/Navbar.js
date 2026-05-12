import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import './Navbar.css';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { cartCount } = useCart();
  const [notifCount, setNotifCount] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [cartAnim, setCartAnim] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      try {
        const res = await axios.get('/api/notifications');
        setNotifCount(res.data.filter(n => !n.read).length);
      } catch {}
    };
    fetch();
    const interval = setInterval(fetch, 15000);
    return () => clearInterval(interval);
  }, [user]);

  // Bounce cart icon when count changes
  useEffect(() => {
    if (cartCount > 0) {
      setCartAnim(true);
      setTimeout(() => setCartAnim(false), 600);
    }
  }, [cartCount]);

  const handleLogout = () => {
    logout();
    navigate('/');
    setMenuOpen(false);
    setMobileOpen(false);
  };

  return (
    <>
      <nav className="navbar">
        <Link to="/" className="navbar-brand">
          <span className="brand-logo">🏪</span>
          <div className="brand-text">
            <span className="brand-name">Uday Steels & General Stores</span>
            <span className="brand-tagline">Quality You Can Trust</span>
          </div>
        </Link>

        {/* Desktop links */}
        <div className="navbar-links">
          {user?.role === 'seller' && (
            <Link to="/seller" className="nav-link seller-link">
              <span className="nav-link-icon">📊</span> Dashboard
            </Link>
          )}
          {user && user.role !== 'seller' && (
            <Link to="/cart" className={`nav-link cart-link ${cartAnim ? 'cart-bounce' : ''}`}>
              <span className="nav-link-icon">🛒</span> Cart
              {cartCount > 0 && <span className="notif-badge">{cartCount}</span>}
            </Link>
          )}
          {user && (
            <>
              <Link to="/notifications" className="nav-link notif-link" style={{ position: 'relative' }}>
                🔔
                {notifCount > 0 && <span className="notif-badge">{notifCount}</span>}
              </Link>
              <div className="nav-dropdown" onClick={() => setMenuOpen(!menuOpen)}>
                <span className="nav-link">
                  <span className="nav-link-icon">👤</span>
                  {user.name.split(' ')[0]}
                  <span style={{ fontSize: '0.7rem', marginLeft: 2 }}>▾</span>
                </span>
                {menuOpen && (
                  <div className="dropdown-menu">
                    <Link to="/profile" onClick={() => setMenuOpen(false)}>⚙️ My Profile</Link>
                    {user.role !== 'seller' && <Link to="/orders" onClick={() => setMenuOpen(false)}>📦 My Orders</Link>}
                    <button onClick={handleLogout}>🚪 Logout</button>
                  </div>
                )}
              </div>
            </>
          )}
          {!user && (
            <>
              <Link to="/login" className="nav-link">Login</Link>
              <Link to="/register" className="nav-btn">Register Free</Link>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <div className="hamburger" onClick={() => setMobileOpen(!mobileOpen)}>
          <span style={{ transform: mobileOpen ? 'rotate(45deg) translate(5px,5px)' : 'none' }} />
          <span style={{ opacity: mobileOpen ? 0 : 1 }} />
          <span style={{ transform: mobileOpen ? 'rotate(-45deg) translate(5px,-5px)' : 'none' }} />
        </div>
      </nav>

      {/* Mobile menu */}
      <div className={`mobile-menu ${mobileOpen ? 'open' : ''}`}>
        {user?.role === 'seller' && (
          <Link to="/seller" className="mobile-nav-link" onClick={() => setMobileOpen(false)}>📊 Dashboard</Link>
        )}
        {user && user.role !== 'seller' && (
          <Link to="/cart" className="mobile-nav-link" onClick={() => setMobileOpen(false)}>
            🛒 Cart {cartCount > 0 && `(${cartCount})`}
          </Link>
        )}
        {user && (
          <>
            <Link to="/notifications" className="mobile-nav-link" onClick={() => setMobileOpen(false)}>
              🔔 Notifications {notifCount > 0 && `(${notifCount})`}
            </Link>
            <Link to="/profile" className="mobile-nav-link" onClick={() => setMobileOpen(false)}>⚙️ Profile</Link>
            {user.role !== 'seller' && (
              <Link to="/orders" className="mobile-nav-link" onClick={() => setMobileOpen(false)}>📦 My Orders</Link>
            )}
            <button onClick={handleLogout} className="mobile-nav-link" style={{ background: 'rgba(255,61,154,0.15)', border: 'none', cursor: 'pointer', width: '100%', textAlign: 'left', color: '#ff3d9a', fontFamily: 'Poppins' }}>
              🚪 Logout
            </button>
          </>
        )}
        {!user && (
          <>
            <Link to="/login" className="mobile-nav-link" onClick={() => setMobileOpen(false)}>🔑 Login</Link>
            <Link to="/register" className="mobile-nav-link" onClick={() => setMobileOpen(false)} style={{ color: '#ffd700' }}>✨ Register Free</Link>
          </>
        )}
      </div>
    </>
  );
}
