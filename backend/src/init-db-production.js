const mongoose = require('mongoose');
const User = require('./models/User');
const Visit = require('./models/Visit');
require('dotenv').config();

const initializeProductionDatabase = async () => {
  try {
    // Connect to MongoDB
    const mongoURI = process.env.DATABASE_URL || 'mongodb+srv://admin:admin123@visitas-securiti.cz8yvzk.mongodb.net/visitas-securiti?retryWrites=true&w=majority&appName=visitas-securiti';
    await mongoose.connect(mongoURI);
    console.log('✅ Connected to MongoDB Atlas (Production)');
    console.log('📊 Database:', mongoose.connection.db.databaseName);

    // Check if admin user already exists
    const existingAdmin = await User.findOne({ email: 'admin@securiti.com' });
    if (existingAdmin) {
      console.log('👑 Admin user already exists');
      console.log('📧 Email:', existingAdmin.email);
      console.log('🔑 Role:', existingAdmin.role);
      return;
    }

    console.log('🔧 Creating initial users for production...');

    // Create default users (only if they don't exist)
    const defaultUsers = [
      {
        email: 'admin@securiti.com',
        password: 'SecuriTI2025!Admin',
        firstName: 'Admin',
        lastName: 'Sistema',
        role: 'admin',
        companyId: 'comp-1'
      },
      {
        email: 'reception@securiti.com',
        password: 'SecuriTI2025!Reception',
        firstName: 'Recepcionista',
        lastName: 'Principal',
        role: 'reception',
        companyId: 'comp-1'
      },
      {
        email: 'host1@securiti.com',
        password: 'SecuriTI2025!Host1',
        firstName: 'Juan',
        lastName: 'Pérez',
        role: 'host',
        companyId: 'comp-1'
      }
    ];

    // Create users
    const createdUsers = await User.insertMany(defaultUsers);
    console.log('👥 Created production users');

    console.log('\n✅ Production Database initialized successfully!');
    console.log('\n📊 Production login credentials:');
    console.log('Admin: admin@securiti.com / SecuriTI2025!Admin');
    console.log('Reception: reception@securiti.com / SecuriTI2025!Reception');
    console.log('Host 1: host1@securiti.com / SecuriTI2025!Host1');

  } catch (error) {
    console.error('❌ Error initializing production database:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n📡 Disconnected from MongoDB');
  }
};

// Run initialization
initializeProductionDatabase();