import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import BackButton from '../components/BackButton';
import './Profile.css';

export default function Profile() {
  const { user, setUser } = useAuth();
  const [form, setForm] = useState({
    name: user?.name || '',
    address: {
      street: user?.address?.street || '',
      city: user?.address?.city || '',
      state: user?.address?.state || '',
      pincode: user?.address?.pincode || '',
      phone: user?.address?.phone || ''
    }
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await axios.put('/api/auth/profile', form);
      setUser(res.data);
      toast.success('Profile updated! ✅');
    } catch {
      toast.error('Update failed');
    }
    setSaving(false);
  };

  const setAddr = (field, val) => setForm({ ...form, address: { ...form.address, [field]: val } });

  return (
    <div className="profile-page">
      <BackButton />
      <div className="profile-card">
        <div className="profile-avatar">
          <div className="avatar-circle">{user?.name?.[0]?.toUpperCase()}</div>
          <div>
            <h2>{user?.name}</h2>
            <p>{user?.email}</p>
            <span className={`role-badge ${user?.role}`}>{user?.role === 'seller' ? '🏪 Seller' : '🛒 Buyer'}</span>
          </div>
        </div>

        <form onSubmit={handleSave} className="profile-form">
          <h3>Personal Info</h3>
          <div className="form-group">
            <label>Full Name</label>
            <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          </div>

          {user?.role === 'buyer' && (
            <>
              <h3 style={{ marginTop: '1.5rem' }}>📍 Delivery Address</h3>
              <div className="form-group">
                <label>Street Address</label>
                <input placeholder="House no, Street, Area" value={form.address.street}
                  onChange={e => setAddr('street', e.target.value)} />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>City</label>
                  <input value={form.address.city} onChange={e => setAddr('city', e.target.value)} />
                </div>
                <div className="form-group">
                  <label>State</label>
                  <input value={form.address.state} onChange={e => setAddr('state', e.target.value)} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Pincode</label>
                  <input value={form.address.pincode} onChange={e => setAddr('pincode', e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Phone</label>
                  <input value={form.address.phone} onChange={e => setAddr('phone', e.target.value)} />
                </div>
              </div>
            </>
          )}

          <button type="submit" className="save-btn" disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  );
}
