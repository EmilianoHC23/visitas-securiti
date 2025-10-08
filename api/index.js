const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

// Import database initialization
const { initializeDatabase } = require('../backend/src/init-db');

// Import routes
const authRoutes = require('../backend/src/routes/auth');
const userRoutes = require('../backend/src/routes/users');
const visitRoutes = require('../backend/src/routes/visits');
const dashboardRoutes = require('../backend/src/routes/dashboard');
const debugRoutes = require('../backend/src/routes/debug');
const companyRoutes = require('../backend/src/routes/company');
const blacklistRoutes = require('../backend/src/routes/blacklist');
const accessRoutes = require('../backend/src/routes/access');
const publicRoutes = require('../backend/src/routes/public');
const reportsRoutes = require('../backend/src/routes/reports');
const invitationRoutes = require('../backend/src/routes/invitations');

const app = express();

// Middleware
app.use(cors({
    origin: process.env.NODE_ENV === 'production'
        ? ['https://visitas-securiti.vercel.app', 'https://visitas-securiti-git-main-emilianohc23.vercel.app']
        : ['http://localhost:5173', 'http://localhost:3000'],
    credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// MongoDB connection
const connectDB = async () => {
  try {
    const mongoURI = process.env.DATABASE_URL || 'mongodb+srv://admin:admin123@visitas-securiti.cz8yvzk.mongodb.net/visitas-securiti?retryWrites=true&w=majority&appName=visitas-securiti';
    await mongoose.connect(mongoURI);
    console.log('✅ MongoDB Atlas connected successfully');

    // Initialize database with default data if needed
    await initializeDatabase();
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
  }
};

// Connect to database
connectDB();

// Routes
app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/visits', visitRoutes);
app.use('/dashboard', dashboardRoutes);
app.use('/debug', debugRoutes);
app.use('/company', companyRoutes);
app.use('/blacklist', blacklistRoutes);
app.use('/access', accessRoutes);
app.use('/public', publicRoutes);
app.use('/reports', reportsRoutes);
app.use('/invitations', invitationRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Export for Vercel
module.exports = app;