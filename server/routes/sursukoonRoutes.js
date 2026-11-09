const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');
const {
  getEvents, getAllEvents, getEvent,
  registerPerformer, registerAudience,
  createEvent, updateEvent, deleteEvent,
  getPerformerRegistrations, getAudienceRegistrations,
  updatePaymentStatus, deletePerformer, deleteAudience,
  exportPerformersCSV, exportAudienceCSV, getAllEventsAdmin
} = require('../controllers/sursukoonController');

// Public routes
router.get('/events', getEvents);
router.get('/events/all', getAllEvents);
router.get('/events/:id', getEvent);
router.post('/register/performer', upload.single('paymentScreenshot'), registerPerformer);
router.post('/register/audience', registerAudience);

// Admin routes
router.get('/admin/events', authMiddleware, getAllEventsAdmin);
router.post('/admin/events', authMiddleware, createEvent);
router.put('/admin/events/:id', authMiddleware, updateEvent);
router.delete('/admin/events/:id', authMiddleware, deleteEvent);
router.get('/admin/registrations/performers', authMiddleware, getPerformerRegistrations);
router.get('/admin/registrations/audience', authMiddleware, getAudienceRegistrations);
router.put('/admin/registrations/performers/:id/payment', authMiddleware, updatePaymentStatus);
router.delete('/admin/registrations/performers/:id', authMiddleware, deletePerformer);
router.delete('/admin/registrations/audience/:id', authMiddleware, deleteAudience);
router.get('/admin/export/performers', authMiddleware, exportPerformersCSV);
router.get('/admin/export/audience', authMiddleware, exportAudienceCSV);

module.exports = router;
