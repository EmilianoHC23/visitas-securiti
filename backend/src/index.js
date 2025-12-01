const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// Import database initialization
const { initializeDatabase } = require('./init-db');

// Access scheduler to send reminders/finalizations on time
const { startScheduler } = require('./jobs/accessScheduler');

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
    origin: ['http://13.0.0.87:3001', 'http://localhost:3001', 'http://localhost:5173', 'http://localhost:3000'],
    credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// MongoDB connection
const connectDB = async () => {
  try {
    // Evitar reconectar si ya está conectado
    if (mongoose.connection.readyState === 1) {
      console.log('✅ MongoDB already connected');
      return;
    }
    
    const mongoURI = process.env.DATABASE_URL || 'mongodb+srv://visitantes_db_user:terCgnmhxQNFSlGl@visitas-securiti.gjgocbm.mongodb.net/visitas-securiti?retryWrites=true&w=majority&appName=visitas-securiti';
    await mongoose.connect(mongoURI);
    console.log('✅ MongoDB Atlas connected successfully');
    // In some environments (e.g., serverless cold starts), connection.db may not be immediately available
    const dbName = mongoose.connection?.name || mongoose.connection?.db?.databaseName;
    if (dbName) {
      console.log('📊 Database:', dbName);
    } else {
      console.log('⚠️ Mongo connected but database name not yet available');
    }

    // Initialize database with default data if needed
    await initializeDatabase();
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Initialize database connection
connectDB();

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
  const frontendDistPath = path.join(__dirname, '../../frontend/dist');
  console.log(`📦 Serving static files from: ${frontendDistPath}`);
  
  app.use(express.static(frontendDistPath));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(frontendDistPath, 'index.html'));
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

// Start server
app.listen(PORT, '0.0.0.0', (err) => {
  if (err) {
    console.error('❌ Error starting server:', err);
    process.exit(1);
  }
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 Server listening on http://localhost:${PORT}`);
  // Start access scheduler
  try {
    startScheduler();
  } catch (e) {
    console.warn('⚠️ Scheduler failed to start:', e?.message);
  }
});

module.exports = app;