import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import './Sidebar.css';

export default function Sidebar() {
  const { user, logout } = useAuth();
  const { cartCount } = useCart();
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
    setOpen(false);
  };

  const isActive = (path) => location.pathname === path;

  const buyerLinks = [
    { to: '/', icon: '🏠', label: 'Home' },
    { to: '/cart', icon: '🛒', label: 'My Cart', badge: cartCount },
    { to: '/orders', icon: '📦', label: 'My Orders' },
    { to: '/notifications', icon: '🔔', label: 'Notifications' },
    { to: '/profile', icon: '👤', label: 'Account Details' },
  ];

  const sellerLinks = [
    { to: '/', icon: '🏠', label: 'Home' },
    { to: '/seller', icon: '📊', label: 'Dashboard' },
    { to: '/seller/chat', icon: '💬', label: 'Customer Chats' },
    { to: '/notifications', icon: '🔔', label: 'Notifications' },
    { to: '/profile', icon: '👤', label: 'Account Details' },
  ];

  const links = user?.role === 'seller' ? sellerLinks : buyerLinks;

  return (
    <>
      {/* Toggle button */}
      <button className="sidebar-toggle" onClick={() => setOpen(!open)} aria-label="Menu">
        <span className={`sidebar-toggle-icon ${open ? 'open' : ''}`}>
          {open ? '✕' : '☰'}
        </span>
      </button>

      {/* Overlay */}
      {open && <div className="sidebar-overlay" onClick={() => setOpen(false)} />}

      {/* Sidebar panel */}
      <div className={`sidebar ${open ? 'open' : ''}`}>
        {/* Header */}
        <div className="sidebar-header">
          <div className="sidebar-logo">🏪</div>
          <div>
            <div className="sidebar-store-name">Uday Steels</div>
            <div className="sidebar-store-sub">& General Stores</div>
          </div>
        </div>

        {/* User info */}
        {user && (
          <div className="sidebar-user">
            <div className="sidebar-avatar">{user.name[0].toUpperCase()}</div>
            <div>
              <div className="sidebar-user-name">{user.name}</div>
              <div className={`sidebar-role ${user.role}`}>
                {user.role === 'seller' ? '🏪 Seller' : '🛒 Buyer'}
              </div>
            </div>
          </div>
        )}

        {/* Nav links */}
        <nav className="sidebar-nav">
          {user ? links.map(link => (
            <Link
              key={link.to}
              to={link.to}
              className={`sidebar-link ${isActive(link.to) ? 'active' : ''}`}
              onClick={() => setOpen(false)}
            >
              <span className="sidebar-link-icon">{link.icon}</span>
              <span className="sidebar-link-label">{link.label}</span>
              {link.badge > 0 && <span className="sidebar-badge">{link.badge}</span>}
            </Link>
          )) : (
            <>
              <Link to="/" className={`sidebar-link ${isActive('/') ? 'active' : ''}`} onClick={() => setOpen(false)}>
                <span className="sidebar-link-icon">🏠</span>
                <span className="sidebar-link-label">Home</span>
              </Link>
              <Link to="/login" className="sidebar-link" onClick={() => setOpen(false)}>
                <span className="sidebar-link-icon">🔑</span>
                <span className="sidebar-link-label">Login</span>
              </Link>
              <Link to="/register" className="sidebar-link" onClick={() => setOpen(false)}>
                <span className="sidebar-link-icon">✨</span>
                <span className="sidebar-link-label">Register</span>
              </Link>
            </>
          )}
        </nav>

        {/* Logout */}
        {user && (
          <button className="sidebar-logout" onClick={handleLogout}>
            🚪 Logout
          </button>
        )}
      </div>
    </>
  );
}
