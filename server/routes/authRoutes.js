const express = require('express');
const router = express.Router();
const { login, changePassword, verifyToken } = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/login', login);
router.get('/verify', authMiddleware, verifyToken);
router.put('/change-password', authMiddleware, changePassword);

module.exports = router;
