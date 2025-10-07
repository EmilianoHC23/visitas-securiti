const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

console.log('🔄 Starting invitationStatus migration...');

const migrateInvitationStatus = async () => {
  try {
    // Connect to MongoDB
    const mongoURI = process.env.DATABASE_URL || 'mongodb+srv://admin:admin123@visitas-securiti.cz8yvzk.mongodb.net/visitas-securiti?retryWrites=true&w=majority&appName=visitas-securiti';
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(mongoURI);
    console.log('✅ Connected to MongoDB Atlas');

    // Find users without invitationStatus field
    const usersWithoutStatus = await User.find({ invitationStatus: { $exists: false } });
    console.log(`📊 Found ${usersWithoutStatus.length} users that need migration`);

    if (usersWithoutStatus.length === 0) {
      console.log('✅ All users already have invitationStatus field');
      return;
    }

    let updatedCount = 0;

    for (const user of usersWithoutStatus) {
      // Determine status based on user state
      let newStatus = 'none';

      if (user.isActive) {
        // Active users are considered registered
        newStatus = 'registered';
      } else {
        // Inactive users might be pending invitations
        newStatus = 'pending';
      }

      // Update the user
      await User.findByIdAndUpdate(user._id, {
        invitationStatus: newStatus
      });

      console.log(`✅ Migrated ${user.email}: ${newStatus}`);
      updatedCount++;
    }

    console.log(`\n🎉 Migration completed! Updated ${updatedCount} users`);

    // Show summary
    const statusSummary = await User.aggregate([
      { $group: { _id: '$invitationStatus', count: { $sum: 1 } } }
    ]);

    console.log('\n📊 Invitation Status Summary:');
    statusSummary.forEach(status => {
      console.log(`   ${status._id}: ${status.count} users`);
    });

  } catch (error) {
    console.error('❌ Migration error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n📡 Disconnected from MongoDB');
  }
};

// Run migration if this file is executed directly
if (require.main === module) {
  migrateInvitationStatus();
}

module.exports = migrateInvitationStatus;