const cron = require('node-cron');
const Access = require('../models/Access');
const Company = require('../models/Company');
const emailService = require('../services/emailService');
const { generateAccessInvitationQR } = require('../utils/qrGenerator');

/**
 * Job para finalizar accesos expirados automáticamente
 * Se ejecuta cada hora
 */
const finalizeExpiredAccesses = cron.schedule('0 * * * *', async () => {
  try {
    console.log('⏰ Running job: Finalize expired accesses');
    
    const now = new Date();
    
    // Buscar accesos activos cuya fecha de fin haya pasado
    const expiredAccesses = await Access.find({
      status: 'active',
      endDate: { $lt: now }
    });

    if (expiredAccesses.length === 0) {
      console.log('✅ No expired accesses found');
      return;
    }

    console.log(`📋 Found ${expiredAccesses.length} expired accesses to finalize`);

    for (const access of expiredAccesses) {
      access.status = 'finalized';
      await access.save();
      console.log(`✅ Finalized access: ${access.eventName} (${access.accessCode})`);
    }

    console.log(`✅ Job completed: ${expiredAccesses.length} accesses finalized`);
  } catch (error) {
    console.error('❌ Error in finalizeExpiredAccesses job:', error);
  }
}, {
  scheduled: false // No iniciar automáticamente
});

/**
 * Job para enviar recordatorios del día
 * Se ejecuta cada hora de 6 AM a 10 PM
 */
const sendDailyReminders = cron.schedule('0 6-22 * * *', async () => {
  try {
    console.log('⏰ Running job: Send daily reminders');
    
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

    // Buscar accesos activos que inician hoy y que no han enviado recordatorio
    const accessesToRemind = await Access.find({
      status: 'active',
      startDate: { $gte: startOfToday, $lte: endOfToday },
      reminderSent: { $ne: true }
    }).populate('creatorId', 'firstName lastName email');

    if (accessesToRemind.length === 0) {
      console.log('✅ No accesses need reminders today');
      return;
    }

    console.log(`📋 Found ${accessesToRemind.length} accesses to send reminders`);

    for (const access of accessesToRemind) {
      try {
        const company = await Company.findById(access.companyId);
        
        if (!company) {
          console.warn(`⚠️  Company not found for access: ${access._id}`);
          continue;
        }

        // Send reminder to creator
        if (access.settings.sendAccessByEmail) {
          try {
            await emailService.sendAccessReminderToCreatorEmail(
              access.creatorId.email,
              {
                creatorName: `${access.creatorId.firstName} ${access.creatorId.lastName}`,
                eventName: access.eventName,
                eventType: access.type,
                startDate: access.startDate,
                endDate: access.endDate,
                location: access.location,
                accessCode: access.accessCode,
                invitedCount: access.invitedUsers.length
              },
              company
            );
            console.log(`✅ Reminder sent to creator: ${access.creatorId.email}`);
          } catch (emailError) {
            console.error(`❌ Error sending reminder to creator ${access.creatorId.email}:`, emailError);
          }

          // Send reminders to guests
          for (const guest of access.invitedUsers) {
            if (guest.email && guest.attendanceStatus === 'pendiente') {
              try {
                const qrCode = await generateAccessInvitationQR(access, guest);
                
                await emailService.sendAccessReminderToGuestEmail(
                  guest.email,
                  {
                    guestName: guest.name,
                    creatorName: `${access.creatorId.firstName} ${access.creatorId.lastName}`,
                    eventName: access.eventName,
                    eventType: access.type,
                    startDate: access.startDate,
                    endDate: access.endDate,
                    location: access.location,
                    accessCode: access.accessCode,
                    qrCode: qrCode
                  },
                  company
                );
                console.log(`✅ Reminder sent to guest: ${guest.email}`);
              } catch (emailError) {
                console.error(`❌ Error sending reminder to guest ${guest.email}:`, emailError);
              }
            }
          }
        }

        // Mark reminder as sent
        access.reminderSent = true;
        await access.save();
        console.log(`✅ Marked reminder as sent for access: ${access.eventName}`);
        
      } catch (error) {
        console.error(`❌ Error processing access ${access._id}:`, error);
      }
    }

    console.log(`✅ Job completed: Reminders sent for ${accessesToRemind.length} accesses`);
  } catch (error) {
    console.error('❌ Error in sendDailyReminders job:', error);
  }
}, {
  scheduled: false // No iniciar automáticamente
});

/**
 * Marca invitados como "no asistió" después de que pasa el evento
 * Se ejecuta cada hora
 */
const markNoShowGuests = cron.schedule('0 * * * *', async () => {
  try {
    console.log('⏰ Running job: Mark no-show guests');
    
    const now = new Date();
    
    // Buscar accesos finalizados donde hay invitados pendientes
    const accessesWithPendingGuests = await Access.find({
      status: 'finalized',
      'invitedUsers.attendanceStatus': 'pendiente'
    });

    if (accessesWithPendingGuests.length === 0) {
      console.log('✅ No pending guests to mark as no-show');
      return;
    }

    console.log(`📋 Found ${accessesWithPendingGuests.length} accesses with pending guests`);

    let totalMarked = 0;

    for (const access of accessesWithPendingGuests) {
      let modified = false;
      
      for (const guest of access.invitedUsers) {
        if (guest.attendanceStatus === 'pendiente') {
          guest.attendanceStatus = 'no-asistio';
          modified = true;
          totalMarked++;
        }
      }

      if (modified) {
        await access.save();
        console.log(`✅ Updated attendance for access: ${access.eventName}`);
      }
    }

    console.log(`✅ Job completed: ${totalMarked} guests marked as no-show`);
  } catch (error) {
    console.error('❌ Error in markNoShowGuests job:', error);
  }
}, {
  scheduled: false // No iniciar automáticamente
});

/**
 * Inicia todos los jobs del scheduler
 */
function startScheduler() {
  console.log('🚀 Starting Access Scheduler jobs...');
  
  finalizeExpiredAccesses.start();
  console.log('✅ Job started: Finalize expired accesses (runs every hour)');
  
  sendDailyReminders.start();
  console.log('✅ Job started: Send daily reminders (runs hourly from 6 AM to 10 PM)');
  
  markNoShowGuests.start();
  console.log('✅ Job started: Mark no-show guests (runs every hour)');
  
  console.log('🎉 All Access Scheduler jobs are running!');
}

/**
 * Detiene todos los jobs del scheduler
 */
function stopScheduler() {
  console.log('🛑 Stopping Access Scheduler jobs...');
  
  finalizeExpiredAccesses.stop();
  sendDailyReminders.stop();
  markNoShowGuests.stop();
  
  console.log('✅ All Access Scheduler jobs stopped');
}

module.exports = {
  startScheduler,
  stopScheduler,
  finalizeExpiredAccesses,
  sendDailyReminders,
  markNoShowGuests
};
