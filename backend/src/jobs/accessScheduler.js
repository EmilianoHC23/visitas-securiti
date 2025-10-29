// Access Scheduler: envía recordatorios al inicio del evento y finaliza accesos expirados
const Access = require('../models/Access');
const Company = require('../models/Company');
const emailService = require('../services/emailService');
const { formatTime } = require('../utils/dateUtils');

let reminderTimer = null;
let finalizeTimer = null;
let running = false;

async function finalizeExpiredAccesses() {
  try {
    const now = new Date();
    const expired = await Access.find({ status: 'active', endDate: { $lt: now } });
    if (!expired.length) return;

    for (const access of expired) {
      access.status = 'finalized';
      for (const guest of access.invitedUsers) {
        if (guest.attendanceStatus === 'pendiente') {
          guest.attendanceStatus = 'no-asistio';
        }
      }
      await access.save();
    }
    if (expired.length) {
      console.log(`🕒 Finalizados ${expired.length} accesos expirados`);
    }
  } catch (e) {
    console.warn('⚠️ [Scheduler] finalizeExpiredAccesses error:', e?.message || e);
  }
}

async function sendDueReminders() {
  try {
    const now = new Date();
    const due = await Access.find({
      status: 'active',
      startDate: { $lte: now },
      reminderSent: { $ne: true }
    }).populate('creatorId', 'firstName lastName email');

    if (!due.length) return;

    for (const access of due) {
      try {
        if (access?.settings?.sendAccessByEmail !== false) {
          const company = await Company.findOne({ companyId: access.companyId });
          const startTimeStr = formatTime(access.startDate);

          // Recordatorio al creador
          if (access.creatorId?.email) {
            try {
              await emailService.sendAccessReminderToCreatorEmail({
                creatorEmail: access.creatorId.email,
                creatorName: `${access.creatorId.firstName} ${access.creatorId.lastName}`,
                accessTitle: access.eventName,
                startDate: access.startDate,
                startTime: startTimeStr,
                location: access.location,
                companyName: company?.name || 'Empresa',
                companyLogo: company?.logo
              });
            } catch (e) {
              console.warn('⚠️ [Scheduler] Error creator reminder:', e?.message);
            }
          }

          // Recordatorio a invitados
          for (const guest of access.invitedUsers || []) {
            if (!guest?.email) continue;
            try {
              // Reutilizar el mismo payload de QR que se envió en la invitación
              const qrData = {
                type: 'access-invitation',
                accessId: access._id.toString(),
                accessCode: access.accessCode,
                guestName: guest.name,
                guestEmail: guest.email || '',
                eventName: access.eventName,
                eventDate: access.startDate
              };
              await emailService.sendAccessReminderToGuestEmail({
                invitedEmail: guest.email,
                invitedName: guest.name,
                hostName: `${access.creatorId?.firstName || ''} ${access.creatorId?.lastName || ''}`.trim(),
                accessTitle: access.eventName,
                startDate: access.startDate,
                startTime: startTimeStr,
                location: access.location,
                qrData: JSON.stringify(qrData),
                additionalInfo: access.additionalInfo || '',
                companyName: company?.name || 'Empresa',
                companyLogo: company?.logo
              });
            } catch (e) {
              console.warn('⚠️ [Scheduler] Error guest reminder:', guest?.email, e?.message);
            }
          }
        }

        access.reminderSent = true;
        await access.save();
      } catch (inner) {
        console.warn('⚠️ [Scheduler] sendDueReminders inner error:', inner?.message);
      }
    }
    console.log(`📨 Recordatorios enviados para ${due.length} acceso(s)`);
  } catch (e) {
    console.warn('⚠️ [Scheduler] sendDueReminders error:', e?.message);
  }
}

function startScheduler() {
  if (running) return;
  running = true;
  // Revisar recordatorios cada minuto
  reminderTimer = setInterval(sendDueReminders, 60 * 1000);
  // Finalizar accesos expirados cada 5 minutos
  finalizeTimer = setInterval(finalizeExpiredAccesses, 5 * 60 * 1000);
  console.log('⏱️ accessScheduler iniciado: reminders cada 1m, finalización cada 5m');
}

function stopScheduler() {
  if (reminderTimer) clearInterval(reminderTimer);
  if (finalizeTimer) clearInterval(finalizeTimer);
  reminderTimer = null;
  finalizeTimer = null;
  running = false;
  console.log('⏹️ accessScheduler detenido');
}

module.exports = { startScheduler, stopScheduler };
