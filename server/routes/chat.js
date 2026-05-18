const router = require('express').Router();
const Chat = require('../models/Chat');
const auth = require('../middleware/auth');
const { uploadChat } = require('../utils/cloudinary');

const upload = uploadChat;

// Buyer: get or create their chat
router.get('/mine', auth, async (req, res) => {
  try {
    let chat = await Chat.findOne({ buyer: req.user._id });
    if (!chat) {
      chat = await Chat.create({ buyer: req.user._id, buyerName: req.user.name, messages: [] });
    }
    // Mark buyer messages as read
    chat.unreadBuyer = 0;
    await chat.save();
    res.json(chat);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Buyer: send message
router.post('/send', auth, upload.single('image'), async (req, res) => {
  try {
    let chat = await Chat.findOne({ buyer: req.user._id });
    if (!chat) {
      chat = await Chat.create({ buyer: req.user._id, buyerName: req.user.name, messages: [] });
    }
    const msg = {
      sender: req.user._id,
      senderName: req.user.name,
      senderRole: req.user.role,
      text: req.body.text || '',
      image: req.file ? req.file.path : null
    };
    chat.messages.push(msg);
    chat.lastMessage = msg.text || '📷 Image';
    chat.lastMessageAt = new Date();
    chat.unreadSeller += 1;
    await chat.save();
    res.json(chat);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Seller: get all chats
router.get('/all', auth, async (req, res) => {
  try {
    if (req.user.role !== 'seller') return res.status(403).json({ message: 'Sellers only' });
    const chats = await Chat.find({}).sort({ lastMessageAt: -1 });
    res.json(chats);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Seller: get specific buyer chat
router.get('/:buyerId', auth, async (req, res) => {
  try {
    if (req.user.role !== 'seller') return res.status(403).json({ message: 'Sellers only' });
    const chat = await Chat.findOne({ buyer: req.params.buyerId });
    if (!chat) return res.status(404).json({ message: 'No chat found' });
    chat.unreadSeller = 0;
    await chat.save();
    res.json(chat);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Seller: reply to buyer
router.post('/reply/:buyerId', auth, upload.single('image'), async (req, res) => {
  try {
    if (req.user.role !== 'seller') return res.status(403).json({ message: 'Sellers only' });
    const chat = await Chat.findOne({ buyer: req.params.buyerId });
    if (!chat) return res.status(404).json({ message: 'Chat not found' });
    const msg = {
      sender: req.user._id,
      senderName: req.user.name,
      senderRole: 'seller',
      text: req.body.text || '',
      image: req.file ? req.file.path : null
    };
    chat.messages.push(msg);
    chat.lastMessage = msg.text || '📷 Image';
    chat.lastMessageAt = new Date();
    chat.unreadBuyer += 1;
    await chat.save();
    res.json(chat);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
