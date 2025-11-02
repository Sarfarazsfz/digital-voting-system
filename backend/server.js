// server.js
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import adminRoutes from './routes/admin.js';
import voterRoutes from './routes/voter.js';
import electionRoutes from './routes/election.js';

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Root + health routes
app.get('/', (req, res) => {
  res.send('Server is running. Use /health or API routes under /api.');
});
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// API routes
app.use('/api/admin', adminRoutes);
app.use('/api/voter', voterRoutes);
app.use('/api/election', electionRoutes);

// Read connection string from env
const mongoURI = process.env.MONGODB_URI;

// Start server and connect to MongoDB
async function startServer() {
  try {
    if (!mongoURI) {
      console.error('ERROR: MONGODB_URI is not set. Add it in environment variables.');
      process.exit(1);
    }

    await mongoose.connect(mongoURI);
    console.log('MongoDB connected');

    const PORT = process.env.PORT || "https://digital-voting-system-frontend.onrender.com";
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

// graceful shutdown for unhandled rejections
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason);
  process.exit(1);
});

startServer();
