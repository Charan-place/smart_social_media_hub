const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Storage for video uploads
const videoStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'youtube-dashboard/videos',
    resource_type: 'video',
    allowed_formats: ['mp4', 'mov', 'avi', 'mkv', 'webm'],
  },
});

// Storage for image uploads (thumbnails, Instagram posts)
const imageStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'youtube-dashboard/images',
    resource_type: 'image',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
  },
});

const uploadVideo = multer({
  storage: videoStorage,
  limits: { fileSize: 500 * 1024 * 1024 }, // 500MB
});

const uploadImage = multer({
  storage: imageStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

// Memory storage for direct API uploads to YouTube/Instagram
const memoryStorage = multer.memoryStorage();
const uploadMemory = multer({
  storage: memoryStorage,
  limits: { fileSize: 500 * 1024 * 1024 },
});

module.exports = { cloudinary, uploadVideo, uploadImage, uploadMemory };
