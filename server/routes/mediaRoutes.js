const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');
const { getMedia, getAlbums, uploadPhoto, addVideo, addPress, deleteMedia, updateOrder, updateMedia } = require('../controllers/mediaController');

// Public routes
router.get('/', getMedia);
router.get('/albums', getAlbums); // GET /api/media/albums?section=ngo|sursukoon

// Admin routes
router.post('/admin/photo', authMiddleware, upload.single('file'), uploadPhoto);
router.post('/admin/video', authMiddleware, addVideo);
router.post('/admin/press', authMiddleware, addPress);
router.put('/admin/order', authMiddleware, updateOrder);
router.put('/admin/:id', authMiddleware, updateMedia);
router.delete('/admin/:id', authMiddleware, deleteMedia);

module.exports = router;
