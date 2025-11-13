/**
 * Migration script to add account lockout fields to existing users
 * Run: node backend/scripts/add-lockout-fields.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const path = require('path');

// Load environment variables from parent directory
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

const User = require('../src/models/User');

async function migrateUsers() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || process.env.DATABASE_URL);
    console.log('✅ Connected to MongoDB');

    // Update all users that don't have loginAttempts field
    const result = await User.updateMany(
      { loginAttempts: { $exists: false } },
      { 
        $set: { 
          loginAttempts: 0 
        } 
      }
    );

    console.log(`✅ Updated ${result.modifiedCount} users with loginAttempts field`);

    // Verify
    const usersWithLockout = await User.countDocuments({ loginAttempts: { $exists: true } });
    const totalUsers = await User.countDocuments();
    
    console.log(`📊 Users with lockout fields: ${usersWithLockout}/${totalUsers}`);
    console.log('✅ Migration completed successfully');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

migrateUsers();
