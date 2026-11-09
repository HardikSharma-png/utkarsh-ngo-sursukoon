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

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));

// Serve static frontend
app.use(express.static(path.join(__dirname, '../public')));

// API Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/ngo', require('./routes/ngoRoutes'));
app.use('/api/sursukoon', require('./routes/sursukoonRoutes'));
app.use('/api/media', require('./routes/mediaRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api', require('./routes/settingsRoutes'));

// Admin panel SPA - serve admin/index.html for /admin route
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/admin/index.html'));
});

// Sur-Sukoon pages
app.get('/sursukoon', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/sursukoon/index.html'));
});
app.get('/sursukoon/*', (req, res) => {
  const page = req.path.replace('/sursukoon/', '');
  const filePath = path.join(__dirname, `../public/sursukoon/${page}.html`);
  const fs = require('fs');
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.sendFile(path.join(__dirname, '../public/404.html'));
  }
});

// NGO pages with clean URLs
app.get('/about', (req, res) => res.sendFile(path.join(__dirname, '../public/about.html')));
app.get('/programmes', (req, res) => res.sendFile(path.join(__dirname, '../public/programmes.html')));
app.get('/media', (req, res) => res.sendFile(path.join(__dirname, '../public/media.html')));
app.get('/contact', (req, res) => res.sendFile(path.join(__dirname, '../public/contact.html')));

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

  app.listen(PORT, () => {
    console.log(`\n🚀 Utkarsh NGO & Sur-Sukoon Server running on http://localhost:${PORT}`);
    console.log(`📋 Admin Panel: http://localhost:${PORT}/admin`);
    console.log(`🎵 Sur-Sukoon: http://localhost:${PORT}/sursukoon`);
    console.log(`💡 Admin access: Press Ctrl+Shift+A on any page or visit /admin directly\n`);
  });
};

startServer();
module.exports = app;