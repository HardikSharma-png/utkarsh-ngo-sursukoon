const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const {
  getSetting, getSettings, upsertSetting, updateSettings,
  getPageContent, updatePageContent, getAllPageContent, deletePageContent,
  getTestimonials, addTestimonial, deleteTestimonial
} = require('../controllers/settingsController');

// Public routes
router.get('/setting/:key', getSetting);
router.get('/settings', getSettings);
router.get('/page-content', getPageContent);
router.get('/testimonials', getTestimonials);

// Admin routes
router.post('/admin/setting', authMiddleware, upsertSetting);
router.put('/admin/settings', authMiddleware, updateSettings);
router.get('/admin/page-content', authMiddleware, getAllPageContent);
router.post('/admin/page-content', authMiddleware, updatePageContent);
router.delete('/admin/page-content/:id', authMiddleware, deletePageContent);
router.post('/admin/testimonials', authMiddleware, addTestimonial);
router.delete('/admin/testimonials/:id', authMiddleware, deleteTestimonial);

module.exports = router;
