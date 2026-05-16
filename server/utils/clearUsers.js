require('dotenv').config();
const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGO_URI;

mongoose.connect(MONGO_URI).then(async () => {
  console.log('Connected to MongoDB...');
  const result = await mongoose.connection.collection('users').deleteMany({});
  console.log(`✅ Deleted ${result.deletedCount} users`);
  mongoose.disconnect();
}).catch(err => console.error('Error:', err));
