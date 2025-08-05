import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoose from 'mongoose';
import { PORT, MONGODB_URI, ALLOWED_ORIGINS } from './config.js';
import { errorHandler } from './utils/errorHandler.js';

// Routers
import authRouter from './routes/auth.js';
import gmailRouter from './routes/gmail.js';
import clioRouter from './routes/clio.js';
import aiRouter from './routes/ai.js';
import extensionRouter from './routes/extension.js';
import emailTrackingRouter from './routes/emailTracking.js';
import emailAnalysisRouter from './routes/emailAnalysis.js';
import testRouter from './routes/test.js';
import configRouter from './routes/config.js';
import notificationRouter from './routes/notifications.js';
import { startEmailTracking } from './services/emailTrackingService.js';

const app = express();

// Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:", "chrome-extension:"],
      connectSrc: ["'self'", "http://localhost:*", "https://localhost:*"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
}));
// CORS configuration for Chrome extensions
app.use((req, res, next) => {
  // Allow all origins for Chrome extensions
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use(express.static('public'));

// Database connection
let dbConnected = false;
const connectDB = async () => {
  try {
    console.log('🔗 Attempting to connect to MongoDB...');
    console.log('📋 MongoDB URI:', MONGODB_URI);
    
    if (MONGODB_URI && !MONGODB_URI.includes('<db_password>')) {
      await mongoose.connect(MONGODB_URI, {
        serverSelectionTimeoutMS: 5000, // 5 second timeout
        socketTimeoutMS: 45000, // 45 second timeout
      });
      console.log('✅ MongoDB connected successfully');
      dbConnected = true;
    } else {
      console.log('⚠️ MongoDB URI not properly configured, running without database');
      console.log('💡 To enable database features, set MONGODB_URI in env.local');
      dbConnected = false;
    }
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    console.log('⚠️ Continuing without database...');
    console.log('💡 Make sure MongoDB is running: mongod');
    console.log('💡 Or install MongoDB: https://docs.mongodb.com/manual/installation/');
    dbConnected = false;
  }
};

// Routes
app.get('/', (req, res) => {
  res.json({ 
    message: 'BillableAI Backend API', 
    version: '1.0.0', 
    status: 'running',
    database: dbConnected ? 'connected' : 'disconnected'
  });
});
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    database: dbConnected ? 'connected' : 'disconnected'
  });
});

app.use('/api/auth', authRouter);
app.use('/api/gmail', gmailRouter);
app.use('/api/clio', clioRouter);
app.use('/api/ai', aiRouter);
app.use('/api/extension', extensionRouter);
app.use('/api/email-tracking', emailTrackingRouter);
app.use('/api/email-analysis', emailAnalysisRouter);
app.use('/api/test', testRouter);
app.use('/api/config', configRouter);
app.use('/api/notifications', notificationRouter);

// Simple test route for email tracking
app.post('/api/simple-test/email-tracking/start', async (req, res) => {
  try {
    const { to, subject, content } = req.body;
    
    if (!to || !subject) {
      return res.status(400).json({ error: 'Recipients and subject are required' });
    }
    
    const emailData = { to, subject, content: content || '' };
    const result = await startEmailTracking('test_user_123', emailData);
    
    res.json({
      success: true,
      sessionId: result.sessionId,
      startTime: result.startTime
    });
    
  } catch (error) {
    console.error('Simple test email tracking start error:', error);
    res.status(500).json({ error: 'Failed to start email tracking' });
  }
});

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found', path: req.originalUrl });
});

// Start server
const startServer = async () => {
  try {
    await connectDB();
    const server = app.listen(PORT, () => {
      console.log(`🚀 BillableAI Backend running on port ${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
      console.log(`🔗 Extension API: http://localhost:${PORT}/api/extension`);
      if (!dbConnected) {
        console.log('⚠️ Database is not connected - user registration will not work');
        console.log('💡 To fix this:');
        console.log('   1. Install MongoDB: https://docs.mongodb.com/manual/installation/');
        console.log('   2. Start MongoDB: mongod');
        console.log('   3. Or use MongoDB Atlas: https://www.mongodb.com/atlas');
      }
    });
    
    server.on('error', (error) => {
      console.error('❌ Server error:', error);
      if (error.code === 'EADDRINUSE') {
        console.error(`❌ Port ${PORT} is already in use`);
      }
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
  }
};

startServer(); 