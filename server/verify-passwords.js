const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

const verifyPasswordHashes = async () => {
  try {
    // Connect to MongoDB
    const mongoURI = process.env.DATABASE_URL || 'mongodb+srv://admin:admin123@visitas-securiti.cz8yvzk.mongodb.net/visitas-securiti';
    await mongoose.connect(mongoURI);
    console.log('✅ Connected to MongoDB Atlas');

    // Get all users with passwords (usually excluded from queries)
    const users = await User.find({}).select('+password');
    
    console.log('\n🔍 Verificando hashes de contraseñas:');
    console.log('==========================================');
    
    for (const user of users) {
      const isHashed = user.password.startsWith('$2a$') || user.password.startsWith('$2b$');
      const hashLength = user.password.length;
      
      console.log(`📧 ${user.email}`);
      console.log(`🔑 Password hashed: ${isHashed ? '✅ YES' : '❌ NO'}`);
      console.log(`📏 Password length: ${hashLength} chars`);
      console.log(`🔐 Password format: ${user.password.substring(0, 15)}...`);
      
      // Test password comparison
      try {
        const isValidPassword = await user.comparePassword('password');
        console.log(`🧪 Compare test: ${isValidPassword ? '✅ PASS' : '❌ FAIL'}`);
      } catch (error) {
        console.log(`🧪 Compare test: ❌ ERROR - ${error.message}`);
      }
      
      console.log('------------------------------------------');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n📡 Disconnected from MongoDB');
  }
};

verifyPasswordHashes();