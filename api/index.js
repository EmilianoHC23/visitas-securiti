const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

console.log('🚀 Backend starting...');
console.log('🌍 NODE_ENV:', process.env.NODE_ENV);
console.log('🔧 Vercel environment detected:', !!process.env.VERCEL);

const app = express();
const PORT = process.env.PORT || 3001;

// Import routes
let authRoutes, userRoutes, visitRoutes, dashboardRoutes, reportsRoutes, accessRoutes, blacklistRoutes, companyRoutes, publicRoutes, invitationRoutes;

try {
  authRoutes = require('../backend/src/routes/auth');
  userRoutes = require('../backend/src/routes/users');
  visitRoutes = require('../backend/src/routes/visits');
  dashboardRoutes = require('../backend/src/routes/dashboard');
  reportsRoutes = require('../backend/src/routes/reports');
  accessRoutes = require('../backend/src/routes/access');
  blacklistRoutes = require('../backend/src/routes/blacklist');
  companyRoutes = require('../backend/src/routes/company');
  publicRoutes = require('../backend/src/routes/public');
  invitationRoutes = require('../backend/src/routes/invitations');
  console.log('✅ All routes imported successfully');

  // API Routes
  console.log('📡 Mounting API routes...');
  app.use('/auth', authRoutes);
  app.use('/users', userRoutes);
  app.use('/visits', visitRoutes);
  app.use('/dashboard', dashboardRoutes);
  app.use('/reports', reportsRoutes);
  app.use('/access', accessRoutes);
  app.use('/blacklist', blacklistRoutes);
  app.use('/company', companyRoutes);
  app.use('/public', publicRoutes);
  app.use('/invitations', invitationRoutes);
  console.log('✅ API routes mounted');
} catch (error) {
  console.error('❌ Error importing routes:', error);
  process.exit(1);
}

// CORS configuration
app.use(cors({
    origin: process.env.NODE_ENV === 'production' 
        ? ['https://visitas-securiti.vercel.app', 'https://visitas-securiti-git-main-emilianohc23.vercel.app']
        : ['http://localhost:5173', 'http://localhost:3000'],
    credentials: true
}));

app.use(express.json());

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI || process.env.DATABASE_URL)
.then(() => console.log('✅ Connected to MongoDB Atlas'))
.catch(err => console.error('❌ MongoDB connection error:', err));

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
        hasJwtSecret: !!process.env.JWT_SECRET,
        hasDatabase: !!(process.env.MONGODB_URI || process.env.DATABASE_URL)
    });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/visits', visitRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/company', companyRoutes);
app.use('/api/blacklist', blacklistRoutes);
app.use('/api/access', accessRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/invitations', invitationRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ 
        message: 'Something went wrong!',
        error: process.env.NODE_ENV === 'development' ? err.message : {}
    });
});

// Catch all handler for 404s
app.use('*', (req, res) => {
    console.log(`❌ 404 - Route not found: ${req.method} ${req.originalUrl}`);
    res.status(404).json({ message: 'Route not found', path: req.originalUrl });
});

// For local development
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}

// For Vercel deployment
module.exports = app;