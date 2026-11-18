require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { connectDB } = require('./config/db');
const seedData = require('./utils/seedData');

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// ─── DISABLE CACHING ON ALL /api/* RESPONSES ─────────────────────
app.use('/api', (req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');
  next();
});

// ─── DIAGNOSTIC ENDPOINT: GET /api/db-status ──────────────────────
app.get('/api/db-status', async (req, res) => {
  const mongoose = require('mongoose');
  let error = null;
  try {
    await connectDB();
  } catch (err) {
    error = err.message;
  }
  return res.json({
    connected: mongoose.connection.readyState === 1,
    error: error,
    hasUri: !!process.env.MONGODB_URI
  });
});

// ─── AWAIT MONGODB CONNECTION BEFORE EVERY API REQUEST ─────────────
app.use('/api', async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error(`[DB Middleware] Connection failed on ${req.method} ${req.originalUrl}:`, err.message);
    return res.status(500).json({
      success: false,
      error: 'Database connection failed',
      message: err.message,
      hasUri: !!process.env.MONGODB_URI
    });
  }
});

// Serve uploaded files (legacy disk files if present)
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));

// API Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/ngo', require('./routes/ngoRoutes'));
app.use('/api/sursukoon', require('./routes/sursukoonRoutes'));
app.use('/api/media', require('./routes/mediaRoutes'));
app.use('/api/gallery', require('./routes/galleryRoutes'));
app.use('/api/homepage', require('./routes/homepageRoutes'));
app.get('/api/homepage-config', (req, res, next) => {
  req.url = '/config';
  return require('./routes/homepageRoutes')(req, res, next);
});
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api', require('./routes/settingsRoutes'));

// Admin panel SPA - serve admin/index.html for /admin route
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/admin/index.html'));
});

// Legacy Sur-Sukoon redirects to main website (must precede static middleware)
app.get('/sursukoon', (req, res) => res.redirect(301, '/'));
app.get('/sursukoon/', (req, res) => res.redirect(301, '/'));
app.get('/sursukoon/about', (req, res) => res.redirect(301, '/about'));
app.get('/sursukoon/gallery', (req, res) => res.redirect(301, '/gallery'));
app.get('/sursukoon/register', (req, res) => res.redirect(301, '/register'));
app.get('/sursukoon/*', (req, res) => {
  const page = req.path.replace(/^\/sursukoon\//, '');
  res.redirect(301, `/${page}`);
});

// Backward-compatibility: redirect old direct NGO routes to /utkarsh/*
app.get('/programmes', (req, res) => res.redirect(301, '/utkarsh/programmes'));
app.get('/media', (req, res) => res.redirect(301, '/utkarsh/media'));
app.get('/contact', (req, res) => res.redirect(301, '/utkarsh/contact'));

// Sur-Sukoon Main Website (Root & Clean URLs)
app.get('/', (req, res) => res.sendFile(path.join(__dirname, '../public/index.html')));
app.get('/about', (req, res) => res.sendFile(path.join(__dirname, '../public/about.html')));
app.get('/gallery', (req, res) => res.sendFile(path.join(__dirname, '../public/gallery.html')));
app.get('/register', (req, res) => res.sendFile(path.join(__dirname, '../public/register.html')));

// Utkarsh NGO Portal Routes
app.get('/utkarsh', (req, res) => res.sendFile(path.join(__dirname, '../public/utkarsh/index.html')));
app.get('/utkarsh/', (req, res) => res.sendFile(path.join(__dirname, '../public/utkarsh/index.html')));
app.get('/utkarsh/about', (req, res) => res.sendFile(path.join(__dirname, '../public/utkarsh/about.html')));
app.get('/utkarsh/programmes', (req, res) => res.sendFile(path.join(__dirname, '../public/utkarsh/programmes.html')));
app.get('/utkarsh/media', (req, res) => res.sendFile(path.join(__dirname, '../public/utkarsh/media.html')));
app.get('/utkarsh/contact', (req, res) => res.sendFile(path.join(__dirname, '../public/utkarsh/contact.html')));

// Serve static frontend assets (css, js, images, uploads, etc.)
app.use(express.static(path.join(__dirname, '../public')));

// Catch-all: serve 404 page
app.use((req, res) => {
  const fs = require('fs');
  const notFoundPath = path.join(__dirname, '../public/404.html');
  if (fs.existsSync(notFoundPath)) {
    res.status(404).sendFile(notFoundPath);
  } else {
    res.status(404).json({ error: 'Page not found' });
  }
});

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();

  // Run seed data after DB connection
  try {
    await seedData();
  } catch (err) {
    console.log('Seed data skipped (DB may be offline):', err.message);
  }

  // Only start listening when not running in Vercel serverless environment and when run as main script
  if (process.env.VERCEL !== '1' && !process.env.VERCEL_ENV && require.main === module) {
    app.listen(PORT, () => {
      console.log(`\n🚀 Utkarsh NGO & Sur-Sukoon Server running on http://localhost:${PORT}`);
      console.log(`📋 Admin Panel: http://localhost:${PORT}/admin`);
      console.log(`🎵 Sur-Sukoon: http://localhost:${PORT}/sursukoon`);
      console.log(`💡 Admin access: Press Ctrl+Shift+A on any page or visit /admin directly\n`);
    });
  }
};

startServer();
module.exports = app;