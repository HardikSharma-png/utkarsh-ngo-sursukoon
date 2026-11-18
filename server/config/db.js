const mongoose = require('mongoose');

// Cache the Mongoose connection promise globally across serverless invocations (Vercel best practice)
let cached = global._mongoosePromise;
if (!cached) {
  cached = global._mongoosePromise = { conn: null, promise: null };
}

const connectDB = async () => {
  if (cached.conn && mongoose.connection.readyState === 1) {
    return cached.conn;
  }

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI environment variable is not defined.');
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000,
    };
    cached.promise = mongoose.connect(uri, opts).then((mongooseInstance) => {
      console.log(`✅ MongoDB Connected: ${mongooseInstance.connection.host}`);
      return mongooseInstance;
    }).catch((err) => {
      cached.promise = null; // Reset so subsequent requests can retry
      console.error('❌ MongoDB Connection Error:', err.message);
      throw err;
    });
  }

  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (err) {
    cached.promise = null;
    throw err;
  }
};

const isDbConnected = () => mongoose.connection.readyState === 1;

module.exports = { connectDB, isDbConnected };
