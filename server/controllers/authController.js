const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

// Hardcoded admin credentials (fallback when MongoDB is unavailable)
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'sursukoon2812@gmail.com').toLowerCase();
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'abhimegh18';

// Try to load Admin model safely
let Admin = null;
try { Admin = require('../models/Admin'); } catch (e) {}

const isDbReady = () => mongoose.connection.readyState === 1;

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    let authenticated = false;
    let adminId = 'local-admin';

    // Try MongoDB ONLY if connection is actually ready
    if (Admin && isDbReady()) {
      try {
        const admin = await Admin.findOne({ email: email.toLowerCase() });
        if (admin) {
          const isMatch = await admin.matchPassword(password);
          if (isMatch) {
            authenticated = true;
            adminId = admin._id;
            try { admin.lastLogin = new Date(); await admin.save(); } catch (_) {}
          } else {
            return res.status(401).json({ success: false, message: 'Invalid credentials.' });
          }
        }
      } catch (dbErr) {
        console.log('DB query error, using fallback:', dbErr.message);
      }
    }

    // Hardcoded fallback check
    if (!authenticated) {
      if (email.toLowerCase() !== ADMIN_EMAIL) {
        return res.status(401).json({ success: false, message: 'Invalid credentials.' });
      }
      if (password !== ADMIN_PASSWORD) {
        return res.status(401).json({ success: false, message: 'Invalid credentials.' });
      }
      authenticated = true;
    }

    const token = jwt.sign(
      { id: adminId, email: email.toLowerCase() },
      process.env.JWT_SECRET || 'utkarsh_jwt_secret_2025',
      { expiresIn: '24h' }
    );

    res.json({ success: true, token, message: 'Login successful.' });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, message: 'Login failed. Please try again.' });
  }
};

const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Both current and new passwords are required.' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters.' });
    }

    const admin = await Admin.findById(req.admin.id);
    const isMatch = await admin.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect.' });
    }

    const salt = await bcrypt.genSalt(10);
    admin.passwordHash = await bcrypt.hash(newPassword, salt);
    await admin.save();

    res.json({ success: true, message: 'Password changed successfully.' });
  } catch (err) {
    console.error('Change password error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const verifyToken = async (req, res) => {
  res.json({ success: true, message: 'Token is valid.', admin: { email: req.admin.email } });
};

module.exports = { login, changePassword, verifyToken };
