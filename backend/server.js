import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';

// Import routes
import adminRoutes from './routes/admin.js';
import voterRoutes from './routes/voter.js';
import electionRoutes from './routes/election.js';
import setupRoutes from './routes/setup.js';

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/admin', adminRoutes);
app.use('/api/voter', voterRoutes);
app.use('/api/election', electionRoutes);
app.use('/setup', setupRoutes); // Setup routes

// Test routes
app.get('/', (req, res) => {
  res.json({ 
    message: '🚀 SpringVote Backend Server is Running!',
    version: '1.0.0',
    status: 'Active ✅',
    timestamp: new Date().toISOString(),
    endpoints: {
      admin: {
        'POST /api/admin/login': 'Admin login',
        'GET /api/admin/elections': 'Get elections (auth required)'
      },
      voter: {
        'POST /api/voter/verify': 'Voter verification',
        'GET /api/voter/elections/active': 'Get active elections'
      },
      setup: {
        'POST /setup/create-admin': 'Create default admin account'
      },
      public: {
        'GET /api/election/public': 'Get public elections',
        'GET /health': 'Health check'
      }
    }
  });
});

// Health check route
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok',
    server: 'running',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString()
  });
});

// MongoDB Connection
const connectDB = async () => {
  try {
    console.log('🔗 Attempting to connect to MongoDB...');
    
    const mongoURI = process.env.MONGODB_URI;
    
    if (!mongoURI) {
      console.log('❌ MONGODB_URI is not set in environment variables');
      console.log('💡 Please set MONGODB_URI in your Render environment variables');
      return;
    }
    
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ MongoDB Connected Successfully!');
    console.log(`📊 Database: ${mongoose.connection.db.databaseName}`);
    
  } catch (error) {
    console.error('❌ MongoDB Connection Failed:', error.message);
  }
};

// Connect to database
connectDB();

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log('='.repeat(60));
  console.log('🚀 DIGITAL BACKEND SERVER STARTED');
  console.log('='.repeat(60));
  console.log(`📍 Port: ${PORT}`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 MongoDB: ${process.env.MONGODB_URI ? 'Configured' : 'Not configured'}`);
  console.log(`📊 DB Status: ${mongoose.connection.readyState === 1 ? 'Connected ✅' : 'Disconnected ❌'}`);
  console.log('='.repeat(60));
  console.log('📋 Quick Setup:');
  console.log('   1. Visit: https://digital-voting-system-backend.onrender.com/setup/create-admin');
  console.log('   2. Use credentials: admin / admin123');
  console.log('='.repeat(60));
});