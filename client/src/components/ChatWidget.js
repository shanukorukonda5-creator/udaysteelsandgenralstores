import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import './ChatWidget.css';

const BOT_STEPS = [
  { id: 'welcome', message: "👋 Hi! Welcome to Uday Steels & General Stores. I'm here to help you.", delay: 400 },
  {
    id: 'ask_topic',
    message: "What can I help you with today?",
    delay: 900,
    options: [
      { label: '📦 Order related query',  value: 'Order related query' },
      { label: '🛍️ Product information',  value: 'Product information' },
      { label: '🔄 Return or Refund',     value: 'Return or Refund' },
      { label: '💳 Payment issue',        value: 'Payment issue' },
      { label: '📞 Other query',          value: 'Other query' },
    ]
  }
];

const FOLLOW_UP = {
  'Order related query': "Please describe your order issue and share your Order ID if available. Our team will get back to you shortly! 🚚",
  'Product information': "Sure! Please tell us which product you'd like to know more about. 🛍️",
  'Return or Refund':    "We're sorry to hear that! Please share your Order ID and reason for return/refund. 🔄",
  'Payment issue':       "Please describe your payment issue and share the transaction ID if available. 💳",
  'Other query':         "Please describe your query in detail and our team will respond shortly. 📞"
};

export default function ChatWidget() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [chat, setChat] = useState(null);
  const [text, setText] = useState('');
  const [image, setImage] = useState(null);
  const [sending, setSending] = useState(false);
  const [unread, setUnread] = useState(0);
  const [botMessages, setBotMessages] = useState([]);
  const [botDone, setBotDone] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [botTyping, setBotTyping] = useState(false);
  const bottomRef = useRef(null);
  const fileRef = useRef(null);
  const pollRef = useRef(null);

  const fetchChat = async () => {
    try {
      const res = await axios.get('/api/chat/mine');
      setChat(res.data);
      if (!open) setUnread(res.data.unreadBuyer || 0);
      if (res.data.messages?.length > 0) {
        setBotDone(true);
        setBotMessages([]);
      }
    } catch {}
  };

  useEffect(() => {
    if (!user || user.role === 'seller') return;
    fetchChat();
    pollRef.current = setInterval(fetchChat, 5000);
    return () => clearInterval(pollRef.current);
  }, [user]);

  useEffect(() => {
    if (!user || user.role === 'seller') return;
    if (open && !botDone && chat?.messages?.length === 0) {
      runBotIntro();
    }
    if (open) setUnread(0);
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [botMessages.length, chat?.messages?.length, botTyping]);

  // Must be after all hooks
  if (!user || user.role === 'seller') return null;

  const runBotIntro = async () => {
    setBotMessages([]);
    for (let i = 0; i < BOT_STEPS.length; i++) {
      const step = BOT_STEPS[i];
      setBotTyping(true);
      await new Promise(r => setTimeout(r, step.delay));
      setBotTyping(false);
      setBotMessages(prev => [...prev, { type: 'bot', text: step.message, id: step.id }]);
      if (step.options) {
        await new Promise(r => setTimeout(r, 300));
        setShowOptions(true);
      }
    }
  };

  const handleOptionClick = async (option) => {
    setShowOptions(false);
    setBotMessages(prev => [...prev, { type: 'user', text: option.label }]);
    setBotTyping(true);
    await new Promise(r => setTimeout(r, 700));
    setBotTyping(false);
    const followUp = FOLLOW_UP[option.value] || "Please describe your query and we'll help you!";
    setBotMessages(prev => [...prev, { type: 'bot', text: followUp }]);
    setBotDone(true);
    try {
      const fd = new FormData();
      fd.append('text', `[${option.value}] — Buyer selected this topic.`);
      const res = await axios.post('/api/chat/send', fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setChat(res.data);
    } catch {}
  };

  const handleSend = async () => {
    if (!text.trim() && !image) return;
    setSending(true);
    try {
      const fd = new FormData();
      if (text.trim()) fd.append('text', text);
      if (image) fd.append('image', image);
      const res = await axios.post('/api/chat/send', fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setChat(res.data);
      setText('');
      setImage(null);
    } catch {
      toast.error('Failed to send message');
    }
    setSending(false);
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const allMessages = [
    ...botMessages,
    ...(chat?.messages || []).map(m => ({
      type: m.senderRole === 'seller' ? 'seller' : 'user',
      text: m.text,
      image: m.image,
      time: m.createdAt,
      real: true
    }))
  ];

  return (
    <>
      <button className="chat-fab" onClick={() => setOpen(!open)}>
        {open ? '✕' : '💬'}
        {unread > 0 && !open && <span className="chat-fab-badge">{unread}</span>}
      </button>

      {open && (
        <div className="chat-window">
          <div className="chat-header">
            <div className="chat-header-info">
              <div className="chat-avatar">🏪</div>
              <div>
                <div className="chat-header-name">Uday Steels Support</div>
                <div className="chat-header-status">🟢 We're here to help</div>
              </div>
            </div>
            <button className="chat-close" onClick={() => setOpen(false)}>✕</button>
          </div>

          <div className="chat-messages">
            {allMessages.map((msg, i) => (
              <div key={i} className={`chat-msg ${msg.type === 'user' ? 'buyer' : 'seller'}`}>
                {msg.type !== 'user' && <div className="chat-bot-avatar">🏪</div>}
                <div className="chat-bubble">
                  {msg.text && <p>{msg.text}</p>}
                  {msg.image && (
                    <img src={`http://localhost:5000${msg.image}`} alt="attachment"
                      className="chat-img"
                      onClick={() => window.open(`http://localhost:5000${msg.image}`, '_blank')} />
                  )}
                  {msg.time && (
                    <span className="chat-time">
                      {new Date(msg.time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                </div>
              </div>
            ))}

            {botTyping && (
              <div className="chat-msg seller">
                <div className="chat-bot-avatar">🏪</div>
                <div className="chat-bubble typing">
                  <span /><span /><span />
                </div>
              </div>
            )}

            {showOptions && (
              <div className="chat-options">
                {BOT_STEPS[1].options.map(opt => (
                  <button key={opt.value} className="chat-option-btn" onClick={() => handleOptionClick(opt)}>
                    {opt.label}
                  </button>
                ))}
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {image && (
            <div className="chat-img-preview">
              <img src={URL.createObjectURL(image)} alt="preview" />
              <button onClick={() => setImage(null)}>✕</button>
            </div>
          )}

          {botDone && (
            <div className="chat-input-row">
              <button className="chat-attach" onClick={() => fileRef.current.click()}>📎</button>
              <input type="file" ref={fileRef} accept="image/*" style={{ display: 'none' }}
                onChange={e => setImage(e.target.files[0])} />
              <textarea
                className="chat-input"
                placeholder="Type your message..."
                value={text}
                onChange={e => setText(e.target.value)}
                onKeyDown={handleKey}
                rows={1}
              />
              <button className="chat-send" onClick={handleSend} disabled={sending || (!text.trim() && !image)}>
                {sending ? '...' : '➤'}
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
}
