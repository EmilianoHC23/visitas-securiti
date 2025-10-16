const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
require('dotenv').config();

const resetAdminPassword = async () => {
  try {
    // Connect to MongoDB
    const mongoURI = process.env.DATABASE_URL || 'mongodb+srv://admin:admin123@visitas-securiti.cz8yvzk.mongodb.net/visitas-securiti?retryWrites=true&w=majority&appName=visitas-securiti';
    await mongoose.connect(mongoURI);
    console.log('✅ Connected to MongoDB Atlas');

    // Delete existing admin if exists
    await User.deleteOne({ email: 'admin@securiti.com' });
    console.log('🗑️ Removed existing admin user');

    // Create new admin user (password will be hashed automatically by pre-save middleware)
    const password = 'Admin2025!';
    const adminUser = new User({
      email: 'admin@securiti.com',
      password: password, // Will be hashed by the model's pre-save hook
      firstName: 'Admin',
      lastName: 'Sistema',
      role: 'admin',
      companyId: 'comp-1'
    });

    await adminUser.save();
    console.log('✅ Created new admin user successfully');

    // Verify the user can authenticate
    const testUser = await User.findOne({ email: 'admin@securiti.com' });
    const isPasswordValid = await testUser.comparePassword(password);
    
    console.log('\n📊 Admin user verification:');
    console.log('Email:', testUser.email);
    console.log('Role:', testUser.role);
    console.log('Password hash valid:', isPasswordValid);
    console.log('\n🔑 Login credentials:');
    console.log('Email: admin@securiti.com');
    console.log('Password: Admin2025!');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n📡 Disconnected from MongoDB');
  }
};

resetAdminPassword();