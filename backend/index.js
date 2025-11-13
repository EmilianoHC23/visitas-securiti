const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
const logger = require('./src/utils/logger');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// Import routes
const authRoutes = require('./src/routes/auth');
const userRoutes = require('./src/routes/users');
const visitRoutes = require('./src/routes/visits');
const dashboardRoutes = require('./src/routes/dashboard');
const reportsRoutes = require('./src/routes/reports');
const accessRoutes = require('./src/routes/access');
const blacklistRoutes = require('./src/routes/blacklist');
const companyRoutes = require('./src/routes/company');
const publicRoutes = require('./src/routes/public');
const invitationRoutes = require('./src/routes/invitations');

const app = express();
const PORT = process.env.PORT || 3001;

// Security: Helmet middleware for secure HTTP headers
app.use(helmet({
    contentSecurityPolicy: false, // Disable CSP to avoid breaking Vercel/frontend
    crossOriginEmbedderPolicy: false, // Allow embedding for dev/preview
}));

// CORS configuration
app.use(cors({
    origin: process.env.NODE_ENV === 'production' 
        ? ['https://visitas-securiti.vercel.app', 'https://visitas-securiti-git-main-emilianohc23.vercel.app']
        : ['http://localhost:5173', 'http://localhost:3000'],
    credentials: true
}));

app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

// Request logging middleware
app.use((req, res, next) => {
    logger.log(`📡 ${req.method} ${req.path} - ${new Date().toISOString()}`);
    next();
});

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI || process.env.DATABASE_URL)
.then(() => logger.log('✅ Connected to MongoDB Atlas'))
.catch(err => logger.error('❌ MongoDB connection error:', err));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/visits', visitRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/access', accessRoutes);
app.use('/api/blacklist', blacklistRoutes);
app.use('/api/company', companyRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/invitations', invitationRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
    logger.log('🏥 Health check requested');
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        hasJwtSecret: !!process.env.JWT_SECRET,
        hasDatabase: !!(process.env.MONGODB_URI || process.env.DATABASE_URL),
        routes: 'API routes loaded successfully'
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    logger.error('Unhandled error:', err);
    res.status(500).json({ 
        message: 'Something went wrong!',
        error: process.env.NODE_ENV === 'development' ? err.message : {}
    });
});

// Catch all handler for 404s
app.use('*', (req, res) => {
    res.status(404).json({ message: 'Route not found' });
});

// For local development
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        logger.log(`🚀 Server running on port ${PORT}`);
        logger.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
    });
}

// For Vercel deployment
module.exports = app;