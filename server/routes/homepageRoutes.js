const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');
const {
  getHomepageConfig,
  updateHeroVideo,
  addBanner,
  updateBanner,
  deleteBanner,
  reorderBanners,
  addHighlight,
  updateHighlight,
  deleteHighlight,
  reorderHighlights
} = require('../controllers/homepageController');

// Public endpoints
router.get('/config', getHomepageConfig);

// Admin endpoints (Protected)
router.post('/admin/hero-video', authMiddleware, upload.single('video'), updateHeroVideo);

router.post('/admin/banner', authMiddleware, upload.single('image'), addBanner);
router.put('/admin/banner/:id', authMiddleware, upload.single('image'), updateBanner);
router.delete('/admin/banner/:id', authMiddleware, deleteBanner);
router.put('/admin/banners/reorder', authMiddleware, reorderBanners);

router.post('/admin/highlight', authMiddleware, addHighlight);
router.put('/admin/highlight/:id', authMiddleware, updateHighlight);
router.delete('/admin/highlight/:id', authMiddleware, deleteHighlight);
router.put('/admin/highlights/reorder', authMiddleware, reorderHighlights);

module.exports = router;

