const multer = require('multer');
const path = require('path');

// Memory storage for serverless deployment (Vercel)
// Files are held in memory as Buffer and saved directly to MongoDB as Base64 Data URIs
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedExts = /\.(jpe?g|png|gif|webp|svg|pdf|mp4|webm|mov|m4v|ogg)$/i;
  const isExtAllowed = allowedExts.test(path.extname(file.originalname).toLowerCase());
  const isMimeAllowed =
    file.mimetype.startsWith('image/') ||
    file.mimetype.startsWith('video/') ||
    file.mimetype === 'application/pdf';

  if (isExtAllowed || isMimeAllowed) {
    cb(null, true);
  } else {
    cb(new Error('Only images (jpg, png, webp, gif, svg), videos (mp4, webm, mov), and PDFs are allowed.'));
  }
};

const upload = multer({
  storage,
  limits: { fileSize: 4 * 1024 * 1024 }, // 4MB safe limit for Vercel serverless & MongoDB
  fileFilter
});

// Helper: converts a multer file object into a Base64 Data URI
const fileToDataUri = (file) => {
  if (!file) return null;
  if (file.buffer) {
    return `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
  }
  if (file.filename) {
    return `/uploads/${file.filename}`;
  }
  return null;
};

upload.fileToDataUri = fileToDataUri;

module.exports = upload;
