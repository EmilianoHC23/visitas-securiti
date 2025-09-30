const mongoose = require('mongoose');
const User = require('./models/User');
const Visit = require('./models/Visit');
require('dotenv').config();

const initializeDatabase = async () => {
  try {
    // Connect to MongoDB
    const mongoURI = process.env.DATABASE_URL || 'mongodb+srv://admin:admin123@visitas-securiti.cz8yvzk.mongodb.net/visitas-securiti?retryWrites=true&w=majority&appName=visitas-securiti';
    await mongoose.connect(mongoURI);
    console.log('✅ Connected to MongoDB Atlas');
    console.log('📊 Database:', mongoose.connection.db.databaseName);
    if (process.env.NODE_ENV !== 'production') {
      await User.deleteMany({});
      await Visit.deleteMany({});
      console.log('🗑️ Cleared existing data');
    }

    // Create default users
    const defaultUsers = [
      {
        email: 'admin@securiti.com',
        password: 'password',
        firstName: 'Admin',
        lastName: 'Usuario',
        role: 'admin',
        companyId: 'comp-1'
      },
      {
        email: 'reception@securiti.com',
        password: 'password',
        firstName: 'Recepcionista',
        lastName: 'Principal',
        role: 'reception',
        companyId: 'comp-1'
      },
      {
        email: 'host1@securiti.com',
        password: 'password',
        firstName: 'Juan',
        lastName: 'Pérez',
        role: 'host',
        companyId: 'comp-1'
      },
      {
        email: 'host2@securiti.com',
        password: 'password',
        firstName: 'Ana',
        lastName: 'García',
        role: 'host',
        companyId: 'comp-1'
      },
      {
        email: 'host3@securiti.com',
        password: 'password',
        firstName: 'Carlos',
        lastName: 'Rodríguez',
        role: 'host',
        companyId: 'comp-1'
      }
    ];

    // Create users
    const createdUsers = await User.insertMany(defaultUsers);
    console.log('👥 Created default users');

    // Create sample visits
    const hosts = createdUsers.filter(user => user.role === 'host');
    const sampleVisits = [
      {
        visitorName: 'María González',
        visitorCompany: 'Tech Solutions SA',
        reason: 'Reunión de negocios',
        host: hosts[0]._id,
        status: 'pending',
        scheduledDate: new Date(),
        companyId: 'comp-1',
        visitorEmail: 'maria@techsolutions.com',
        visitorPhone: '+1234567890'
      },
      {
        visitorName: 'Roberto Silva',
        visitorCompany: 'Digital Corp',
        reason: 'Presentación de proyecto',
        host: hosts[1]._id,
        status: 'approved',
        scheduledDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
        companyId: 'comp-1',
        visitorEmail: 'roberto@digitalcorp.com',
        visitorPhone: '+1234567891'
      },
      {
        visitorName: 'Laura Martínez',
        visitorCompany: 'Innovate Inc',
        reason: 'Consultoría técnica',
        host: hosts[0]._id,
        status: 'checked-in',
        scheduledDate: new Date(),
        checkInTime: new Date(),
        companyId: 'comp-1',
        visitorEmail: 'laura@innovate.com',
        visitorPhone: '+1234567892'
      },
      {
        visitorName: 'Diego Fernández',
        visitorCompany: 'StartupXYZ',
        reason: 'Demo de producto',
        host: hosts[2] ? hosts[2]._id : hosts[0]._id,
        status: 'completed',
        scheduledDate: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
        checkInTime: new Date(Date.now() - 24 * 60 * 60 * 1000),
        checkOutTime: new Date(Date.now() - 22 * 60 * 60 * 1000),
        companyId: 'comp-1',
        visitorEmail: 'diego@startupxyz.com',
        visitorPhone: '+1234567893'
      }
    ];

    await Visit.insertMany(sampleVisits);
    console.log('📋 Created sample visits');

    console.log('\n✅ Database initialized successfully!');
    console.log('\n📊 Default login credentials:');
    console.log('Admin: admin@securiti.com / password');
    console.log('Reception: reception@securiti.com / password');
    console.log('Host 1: host1@securiti.com / password');
    console.log('Host 2: host2@securiti.com / password');
    console.log('Host 3: host3@securiti.com / password');

  } catch (error) {
    console.error('❌ Error initializing database:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n📡 Disconnected from MongoDB');
  }
};

// Run initialization
initializeDatabase();