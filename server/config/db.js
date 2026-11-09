const mongoose = require('mongoose');

let isConnected = false;
const inMemoryData = {};

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/utkarsh_ngo', {
      serverSelectionTimeoutMS: 5000,
    });
    isConnected = true;
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (err) {
    console.log('⚠️  MongoDB connection failed. Running with in-memory fallback.');
    console.log('   To use MongoDB, ensure it is running or update MONGODB_URI in .env');
    isConnected = false;
  }
};

const isDbConnected = () => isConnected;

module.exports = { connectDB, isDbConnected };
