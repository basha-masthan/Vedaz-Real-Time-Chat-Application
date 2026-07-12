require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');

const { connectDB } = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const messageRoutes = require('./routes/messageRoutes');
const { initializeSocket } = require('./sockets/socketHandler');
const { errorHandler, notFoundHandler } = require('./middlewares/errorHandler');

const app = express();
const server = http.createServer(app);

// Configure Socket.io with permissive CORS for real-time mobile and web access
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
  }
});

// Middleware
app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Attach Socket.io server instance to request object so REST routes can emit real-time updates
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'Vedaz Real-Time Chat API is running smoothly.',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/messages', messageRoutes);

// Error Handling Middleware
app.use(notFoundHandler);
app.use(errorHandler);

// Initialize Socket.io real-time event handlers
initializeSocket(io);

const PORT = process.env.PORT || 5000;

// Connect Database & Start Server
const startServer = async () => {
  await connectDB();
  server.listen(PORT, () => {
    console.log(`🚀 ========================================================= 🚀`);
    console.log(`🌟 Vedaz Real-Time Chat Backend running on port ${PORT}`);
    console.log(`⚡ Socket.io real-time server ready for instant communication`);
    console.log(`🔗 Health Check URL: http://localhost:${PORT}/api/health`);
    console.log(`🚀 ========================================================= 🚀`);
  });
};

startServer();
