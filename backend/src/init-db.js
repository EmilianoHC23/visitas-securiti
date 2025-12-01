const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

let alreadyInitialized = false;

const initializeDatabase = async () => {
  try {
    if (alreadyInitialized) {
      return;
    }
    // Ensure we have an active connection (1 = connected) AND db object is available
    if (mongoose.connection.readyState !== 1 || !mongoose.connection.db) {
      // En entorno serverless, db puede no estar disponible inmediatamente después de conectar
      // Simplemente retornamos sin warning - se ejecutará en la siguiente petición
      return;
    }
    const dbName = mongoose.connection.db.databaseName;
    console.log('✅ Mongo connection ready. DB:', dbName);

    // Check if users already exist
    const existingUsers = await User.countDocuments();
    console.log(`👥 Existing users: ${existingUsers}`);

    if (existingUsers === 0) {
      console.log('👤 Creating default admin user only...');

      const adminEmail = process.env.DEFAULT_ADMIN_EMAIL || 'admin@securiti.com';
      const adminPassword = process.env.DEFAULT_ADMIN_PASSWORD || 'Admin2025!';

      const adminUser = new User({
        email: adminEmail,
        password: adminPassword,
        firstName: 'Admin',
        lastName: 'Sistema',
        role: 'admin',
        companyId: 'comp-1',
        invitationStatus: 'registered'
      });
      await adminUser.save();
      console.log(`✅ Created admin user: ${adminEmail}`);
    }

    // Migration: Update existing users without invitationStatus
    console.log('🔄 Checking for users that need invitationStatus migration...');
    const usersWithoutStatus = await User.find({ invitationStatus: { $exists: false } });
    
    if (usersWithoutStatus.length > 0) {
      console.log(`📝 Found ${usersWithoutStatus.length} users without invitationStatus, updating...`);
      
      for (const user of usersWithoutStatus) {
        // If user is active and has a password, mark as registered
        // If user is inactive, mark as pending (from old invitation system)
        const newStatus = user.isActive ? 'registered' : 'pending';
        
        await User.findByIdAndUpdate(user._id, { 
          invitationStatus: newStatus,
          // Also ensure isActive is set for pending users
          ...(newStatus === 'pending' && { isActive: false })
        });
        
        console.log(`✅ Updated ${user.email}: ${newStatus}`);
      }
      
      console.log('🎉 Migration completed!');
    } else {
      console.log('✅ All users have invitationStatus field');
    }

  console.log('\n✅ Database initialized successfully!');
  console.log('\n📊 Credenciales de acceso:');
  console.log(`👑 Admin: ${process.env.DEFAULT_ADMIN_EMAIL || 'admin@securiti.com'} / ${process.env.DEFAULT_ADMIN_PASSWORD || 'Admin2025!'}`);

    alreadyInitialized = true;

  } catch (error) {
    console.error('❌ Error initializing database:', error);
  }
};

// Run initialization
// initializeDatabase();

// Export for use in other files
module.exports = { initializeDatabase };