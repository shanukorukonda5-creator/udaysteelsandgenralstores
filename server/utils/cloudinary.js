const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Storage for product images
const productStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'uday-steels/products',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 800, height: 800, crop: 'limit', quality: 'auto' }]
  }
});

// Storage for review images
const reviewStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'uday-steels/reviews',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 600, height: 600, crop: 'limit', quality: 'auto' }]
  }
});

// Storage for chat images
const chatStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'uday-steels/chat',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 800, quality: 'auto' }]
  }
});

const uploadProduct = multer({ storage: productStorage });
const uploadReview = multer({ storage: reviewStorage });
const uploadChat = multer({ storage: chatStorage });

module.exports = { cloudinary, uploadProduct, uploadReview, uploadChat };
