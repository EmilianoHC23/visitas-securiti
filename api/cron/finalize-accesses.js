/**
 * Vercel Cron Job: Finalize expired accesses
 * Runs every hour to mark expired accesses as 'finalized'
 * Skips accesses with noExpiration flag set to true
 */
const mongoose = require('mongoose');
const Access = require('../../backend/src/models/Access');

module.exports = async (req, res) => {
  // Verify authorization
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    // Connect to MongoDB if not already connected
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(process.env.MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
    }

    const now = new Date();

    // Find active accesses that have expired (endDate < now) and do not have noExpiration flag
    const expiredAccesses = await Access.find({
      status: 'active',
      endDate: { $lt: now },
      'settings.noExpiration': { $ne: true } // Skip accesses with noExpiration = true
    });

    console.log(`🕐 Cron: Found ${expiredAccesses.length} expired accesses to finalize`);

    let finalizedCount = 0;

    for (const access of expiredAccesses) {
      // Update status to finalized
      access.status = 'finalized';

      // Update all pending invitees to 'no-asistio'
      if (access.invitedUsers && Array.isArray(access.invitedUsers)) {
        access.invitedUsers.forEach(user => {
          if (user.attendanceStatus === 'pendiente') {
            user.attendanceStatus = 'no-asistio';
          }
        });
      }

      await access.save();
      finalizedCount++;
      console.log(`✅ Finalized access: ${access.eventName} (${access._id})`);
    }

    res.status(200).json({
      success: true,
      message: `Finalized ${finalizedCount} accesses`,
      finalizedCount,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Cron error:', error);
    res.status(500).json({
      success: false,
      message: 'Error finalizing accesses',
      error: error.message
    });
  }
};
