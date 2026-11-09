const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { getDashboardStats, getContactSubmissions } = require('../controllers/adminController');

router.get('/dashboard', authMiddleware, getDashboardStats);
router.get('/contact-submissions', authMiddleware, getContactSubmissions);

module.exports = router;
