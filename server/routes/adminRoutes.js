const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { getDashboardStats, getContactSubmissions } = require('../controllers/adminController');
const {
  getAllEventsAdmin,
  getEvent,
  createEvent,
  updateEvent,
  deleteEvent
} = require('../controllers/sursukoonController');

router.get('/dashboard', authMiddleware, getDashboardStats);
router.get('/contact-submissions', authMiddleware, getContactSubmissions);

// Event management aliases
router.get('/events', authMiddleware, getAllEventsAdmin);
router.get('/events/:id', authMiddleware, getEvent);
router.post('/events', authMiddleware, createEvent);
router.put('/events/:id', authMiddleware, updateEvent);
router.delete('/events/:id', authMiddleware, deleteEvent);

module.exports = router;
