import API_BASE from '../config';
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import BackButton from '../components/BackButton';
import { toast } from 'react-toastify';
import './SellerChat.css';

export default function SellerChat() {
  const [chats, setChats] = useState([]);
  const [selected, setSelected] = useState(null);
  const [text, setText] = useState('');
  const [image, setImage] = useState(null);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);
  const fileRef = useRef(null);

  useEffect(() => {
    fetchChats();
    const interval = setInterval(fetchChats, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (selected) {
      fetchSelected(selected.buyer);
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [selected?._id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selected?.messages?.length]);

  const fetchChats = async () => {
    try {
      const res = await axios.get('/api/chat/all');
      setChats(res.data);
      if (selected) {
        const updated = res.data.find(c => c.buyer === selected.buyer);
        if (updated) setSelected(updated);
      }
    } catch {}
  };

  const fetchSelected = async (buyerId) => {
    try {
      const res = await axios.get(`/api/chat/${buyerId}`);
      setSelected(res.data);
    } catch {}
  };

  const handleSend = async () => {
    if (!text.trim() && !image) return;
    setSending(true);
    try {
      const fd = new FormData();
      if (text.trim()) fd.append('text', text);
      if (image) fd.append('image', image);
      const res = await axios.post(`/api/chat/reply/${selected.buyer}`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setSelected(res.data);
      setText('');
      setImage(null);
      fetchChats();
    } catch {
      toast.error('Failed to send');
    }
    setSending(false);
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const totalUnread = chats.reduce((sum, c) => sum + (c.unreadSeller || 0), 0);

  return (
    <div className="seller-chat-page">
      <BackButton />
      <h1>💬 Customer Chats {totalUnread > 0 && <span className="unread-pill">{totalUnread} new</span>}</h1>

      <div className="seller-chat-layout">
        {/* Inbox list */}
        <div className="chat-inbox">
          {chats.length === 0 ? (
            <div className="chat-empty">
              <div style={{ fontSize: '3rem' }}>💬</div>
              <p>No customer chats yet</p>
            </div>
          ) : chats.map(c => (
            <div
              key={c._id}
              className={`inbox-item ${selected?._id === c._id ? 'active' : ''}`}
              onClick={() => { setSelected(c); fetchSelected(c.buyer); }}
            >
              <div className="inbox-avatar">{c.buyerName?.[0]?.toUpperCase() || '?'}</div>
              <div className="inbox-info">
                <div className="inbox-name">{c.buyerName}</div>
                <div className="inbox-last">{c.lastMessage || 'No messages yet'}</div>
              </div>
              {c.unreadSeller > 0 && <span className="inbox-badge">{c.unreadSeller}</span>}
            </div>
          ))}
        </div>

        {/* Chat window */}
        <div className="chat-panel">
          {!selected ? (
            <div className="chat-empty-panel">
              <div style={{ fontSize: '4rem' }}>💬</div>
              <p>Select a customer to start chatting</p>
            </div>
          ) : (
            <>
              <div className="chat-panel-header">
                <div className="chat-avatar-sm">{selected.buyerName?.[0]?.toUpperCase()}</div>
                <div>
                  <div className="chat-panel-name">{selected.buyerName}</div>
                  <div className="chat-panel-sub">Customer</div>
                </div>
              </div>

              <div className="chat-panel-messages">
                {selected.messages?.map((msg, i) => (
                  <div key={i} className={`chat-msg ${msg.senderRole === 'seller' ? 'seller' : 'buyer'}`}>
                    <div className="chat-bubble">
                      {msg.senderRole !== 'seller' && (
                        <div className="msg-sender-name">{msg.senderName}</div>
                      )}
                      {msg.text && <p>{msg.text}</p>}
                      {msg.image && (
                        <img
                          src={`${API_BASE}${msg.image}`}
                          alt="attachment"
                          className="chat-img"
                          onClick={() => window.open(`${API_BASE}${msg.image}`, '_blank')}
                        />
                      )}
                      <span className="chat-time">
                        {new Date(msg.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                ))}
                <div ref={bottomRef} />
              </div>

              {image && (
                <div className="chat-img-preview">
                  <img src={URL.createObjectURL(image)} alt="preview" />
                  <button onClick={() => setImage(null)}>✕</button>
                </div>
              )}

              <div className="chat-input-row">
                <button className="chat-attach" onClick={() => fileRef.current.click()}>📎</button>
                <input type="file" ref={fileRef} accept="image/*" style={{ display: 'none' }}
                  onChange={e => setImage(e.target.files[0])} />
                <textarea
                  className="chat-input"
                  placeholder="Reply to customer..."
                  value={text}
                  onChange={e => setText(e.target.value)}
                  onKeyDown={handleKey}
                  rows={1}
                />
                <button className="chat-send" onClick={handleSend} disabled={sending || (!text.trim() && !image)}>
                  {sending ? '...' : '➤'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

