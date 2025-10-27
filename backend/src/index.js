const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// Import database initialization
const { initializeDatabase } = require('./init-db');

// Import schedulers
const { startScheduler } = require('./jobs/accessScheduler');
const { scheduleAccessFinalization } = require('./jobs/accessFinalizationScheduler');

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const visitRoutes = require('./routes/visits');
const dashboardRoutes = require('./routes/dashboard');
const debugRoutes = require('./routes/debug');
const companyRoutes = require('./routes/company');
const blacklistRoutes = require('./routes/blacklist');
const accessRoutes = require('./routes/access');
const publicRoutes = require('./routes/public');
const reportsRoutes = require('./routes/reports');
const invitationRoutes = require('./routes/invitations');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
// Debug: log incoming requests (helps diagnose 404s in serverless)
app.use((req, res, next) => {
  console.log(`➡️  ${req.method} ${req.url}`);
  next();
});

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
    // En Vercel, evitar reconectar si ya está conectado
    if (mongoose.connection.readyState === 1) {
      console.log('✅ MongoDB already connected');
      return;
    }
    
    const mongoURI = process.env.DATABASE_URL || 'mongodb+srv://admin:admin123@visitas-securiti.cz8yvzk.mongodb.net/visitas-securiti?retryWrites=true&w=majority&appName=visitas-securiti';
    await mongoose.connect(mongoURI);
    console.log('✅ MongoDB Atlas connected successfully');
    console.log('📊 Database:', mongoose.connection.db.databaseName);

    // Initialize database with default data if needed
    await initializeDatabase();
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    // En Vercel, no salimos del proceso para que la app siga funcionando
    if (process.env.NODE_ENV !== 'production') {
      process.exit(1);
    }
  }
};

// Initialize database connection
connectDB();

// Para Vercel serverless, asegurar conexión en cada request
app.use(async (req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    await connectDB();
  }
  next();
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
app.use('/api', debugRoutes); // Temporal debug route

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../dist')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.stack);
  res.status(500).json({ 
    message: 'Algo salió mal en el servidor',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Endpoint no encontrado' });
});

// Start server only if not in serverless environment
if (!process.env.VERCEL) {
  app.listen(PORT, '0.0.0.0', (err) => {
    if (err) {
      console.error('❌ Error starting server:', err);
      process.exit(1);
    }
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🌐 Server listening on http://localhost:${PORT}`);
    
    // Start scheduler jobs (only in local development, not in Vercel)
    startScheduler();
    scheduleAccessFinalization();
  });
}

// Export for Vercel serverless functions
module.exports = app;