const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const {
  getGalleryPhotos,
  getGalleryVideos,
  getGalleryConfig,
  updateGalleryConfig,
  syncGalleryMedia
} = require('../controllers/galleryController');

// Public proxy endpoints (12-min server-side cache)
router.get('/photos', getGalleryPhotos);
router.get('/videos', getGalleryVideos);

// Admin configuration & cache invalidation endpoints
router.get('/config', authMiddleware, getGalleryConfig);
router.put('/config', authMiddleware, updateGalleryConfig);
router.post('/sync', authMiddleware, syncGalleryMedia);

module.exports = router;

