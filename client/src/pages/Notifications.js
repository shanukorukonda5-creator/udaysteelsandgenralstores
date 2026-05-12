import React, { useState, useEffect } from 'react';
import axios from 'axios';
import BackButton from '../components/BackButton';
import './Notifications.css';

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('/api/notifications')
      .then(r => setNotifications(r.data))
      .finally(() => setLoading(false));
  }, []);

  const markAllRead = async () => {
    await axios.put('/api/notifications/read-all');
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const deleteNotif = async (id) => {
    await axios.delete(`/api/notifications/${id}`);
    setNotifications(notifications.filter(n => n._id !== id));
  };

  const unread = notifications.filter(n => !n.read).length;

  if (loading) return <div style={{ textAlign: 'center', padding: '4rem' }}>Loading...</div>;

  return (
    <div className="notif-page">
      <BackButton />
      <div className="notif-header">
        <h1>🔔 Notifications {unread > 0 && <span className="unread-count">{unread} new</span>}</h1>
        {unread > 0 && <button className="mark-read-btn" onClick={markAllRead}>Mark all as read</button>}
      </div>

      {notifications.length === 0 ? (
        <div className="notif-empty">
          <div style={{ fontSize: '4rem' }}>🔔</div>
          <p>No notifications yet</p>
        </div>
      ) : (
        <div className="notif-list">
          {notifications.map(n => (
            <div key={n._id} className={`notif-card ${!n.read ? 'unread' : ''} type-${n.type}`}>
              <div className="notif-icon">
                {n.type === 'offer' ? '🎉' : n.type === 'order' ? '📦' : '📢'}
              </div>
              <div className="notif-content">
                <p>{n.message}</p>
                <span className="notif-time">{new Date(n.createdAt).toLocaleString('en-IN')}</span>
              </div>
              <button className="notif-delete" onClick={() => deleteNotif(n._id)}>✕</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
