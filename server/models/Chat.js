const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  senderName: String,
  senderRole: String,
  text: String,
  image: String,
  createdAt: { type: Date, default: Date.now }
});

const chatSchema = new mongoose.Schema({
  buyer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  buyerName: String,
  messages: [messageSchema],
  lastMessage: String,
  lastMessageAt: { type: Date, default: Date.now },
  unreadBuyer: { type: Number, default: 0 },
  unreadSeller: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Chat', chatSchema);
