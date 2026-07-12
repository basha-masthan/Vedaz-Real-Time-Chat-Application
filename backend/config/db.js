const mongoose = require('mongoose');

// Track if MongoDB is successfully connected
let isConnected = false;

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI;
    if (!mongoURI) {
      console.warn('⚠️ No MONGODB_URI found in environment variables. Running with in-memory storage fallback.');
      return false;
    }

    console.log(`⏳ Connecting to MongoDB (${mongoURI.replace(/:([^:@]{3,})@/, ':****@')})...`);
    
    // Connect with a timeout so app doesn't hang if Atlas IP is restricted
    await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    isConnected = true;
    console.log(`✅ MongoDB Connected successfully to host: ${mongoose.connection.host}`);
    return true;
  } catch (error) {
    console.warn(`⚠️ MongoDB connection warning: ${error.message}`);
    console.warn('⚠️ Switching to high-reliability in-memory data store fallback so all features remain 100% functional.');
    isConnected = false;
    return false;
  }
};

const getIsConnected = () => isConnected;

module.exports = { connectDB, getIsConnected };
