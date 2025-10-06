const mongoose = require('mongoose');
const User = require('./models/User');
const Visit = require('./models/Visit');
require('dotenv').config();

console.log('🚀 Starting database initialization...');
console.log('📝 Environment variables:');
console.log('  DATABASE_URL:', process.env.DATABASE_URL ? '✅ Configured' : '❌ Not configured');
console.log('  NODE_ENV:', process.env.NODE_ENV);

const initializeDatabase = async () => {
  console.log('🔄 Attempting to connect to MongoDB...');
  try {
    // Connect to MongoDB
    const mongoURI = process.env.DATABASE_URL || 'mongodb+srv://admin:admin123@visitas-securiti.cz8yvzk.mongodb.net/visitas-securiti?retryWrites=true&w=majority&appName=visitas-securiti';
    console.log('🔗 Connection string:', mongoURI.replace(/:([^:@]{4})[^:@]*@/, ':****@'));
    await mongoose.connect(mongoURI);
    console.log('✅ Connected to MongoDB Atlas');
    console.log('📊 Database:', mongoose.connection.db.databaseName);

    // Check if users already exist
    const existingUsers = await User.countDocuments();
    console.log(`👥 Existing users: ${existingUsers}`);

    if (existingUsers === 0) {
      console.log('� Creating default users...');

      // Create default users with realistic data
      const defaultUsers = [
      {
        email: 'admin@securiti.com',
        password: 'password',
        firstName: 'Carlos',
        lastName: 'Administrador',
        role: 'admin',
        companyId: 'comp-1'
      },
      {
        email: 'reception@securiti.com',
        password: 'password',
        firstName: 'María',
        lastName: 'Recepcionista',
        role: 'reception',
        companyId: 'comp-1'
      },
      {
        email: 'juan.perez@securiti.com',
        password: 'password',
        firstName: 'Juan',
        lastName: 'Pérez',
        role: 'host',
        companyId: 'comp-1'
      },
      {
        email: 'ana.garcia@securiti.com',
        password: 'password',
        firstName: 'Ana',
        lastName: 'García',
        role: 'host',
        companyId: 'comp-1'
      },
      {
        email: 'carlos.rodriguez@securiti.com',
        password: 'password',
        firstName: 'Carlos',
        lastName: 'Rodríguez',
        role: 'host',
        companyId: 'comp-1'
      },
      {
        email: 'sofia.lopez@securiti.com',
        password: 'password',
        firstName: 'Sofía',
        lastName: 'López',
        role: 'host',
        companyId: 'comp-1'
      }
    ];

    // Create users one by one to trigger pre('save') middleware
    const createdUsers = [];
    for (const userData of defaultUsers) {
      const user = new User(userData);
      await user.save(); // This will trigger the password hashing
      createdUsers.push(user);
      console.log(`✅ Created user: ${user.email}`);
    }
    
    console.log('👥 Created default users with hashed passwords');

    // Create sample visits with realistic data
    const hosts = createdUsers.filter(user => user.role === 'host');
    const sampleVisits = [
      {
        visitorName: 'Roberto Silva',
        visitorCompany: 'TechCorp Solutions',
        reason: 'Reunión estratégica de negocios',
        host: hosts[0]._id,
        status: 'approved',
        scheduledDate: new Date(Date.now() + 2 * 60 * 60 * 1000), // En 2 horas
        companyId: 'comp-1',
        visitorEmail: 'roberto.silva@techcorp.com',
        visitorPhone: '+521234567890'
      },
      {
        visitorName: 'Isabel Méndez',
        visitorCompany: 'Innovación Digital SA',
        reason: 'Presentación de proyecto IoT',
        host: hosts[1]._id,
        status: 'pending',
        scheduledDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Mañana
        companyId: 'comp-1',
        visitorEmail: 'isabel.mendez@innovacion.com',
        visitorPhone: '+521234567891'
      },
      {
        visitorName: 'Fernando Gutiérrez',
        visitorCompany: 'Consultoría TI Avanzada',
        reason: 'Auditoría de seguridad informática',
        host: hosts[2]._id,
        status: 'checked-in',
        scheduledDate: new Date(Date.now() - 30 * 60 * 1000), // Hace 30 minutos
        checkInTime: new Date(Date.now() - 15 * 60 * 1000), // Hace 15 minutos
        companyId: 'comp-1',
        visitorEmail: 'fernando.gutierrez@consultoria.com',
        visitorPhone: '+521234567892'
      },
      {
        visitorName: 'Patricia Vega',
        visitorCompany: 'Sistemas Empresariales México',
        reason: 'Capacitación en ciberseguridad',
        host: hosts[3] ? hosts[3]._id : hosts[0]._id,
        status: 'completed',
        scheduledDate: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
        checkInTime: new Date(Date.now() - 24 * 60 * 60 * 1000),
        checkOutTime: new Date(Date.now() - 22 * 60 * 60 * 1000),
        companyId: 'comp-1',
        visitorEmail: 'patricia.vega@sistemasem.com',
        visitorPhone: '+521234567893'
      }
    ];

    await Visit.insertMany(sampleVisits);
    console.log('📋 Created sample visits');

    console.log('\n✅ Database initialized successfully!');
    console.log('\n📊 Credenciales de acceso actualizadas:');
    console.log('👑 Admin: admin@securiti.com / password');
    console.log('📥 Recepción: reception@securiti.com / password');
    console.log('🏢 Hosts:');
    console.log('   - Juan Pérez: juan.perez@securiti.com / password');
    console.log('   - Ana García: ana.garcia@securiti.com / password');
    console.log('   - Carlos Rodríguez: carlos.rodriguez@securiti.com / password');
    console.log('   - Sofía López: sofia.lopez@securiti.com / password');
    }

  } catch (error) {
    console.error('❌ Error initializing database:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n📡 Disconnected from MongoDB');
  }
};

// Run initialization
// initializeDatabase();

// Export for use in other files
module.exports = { initializeDatabase };