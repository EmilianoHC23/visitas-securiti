/**
 * Vercel Cron Job: Enviar recordatorios de accesos/eventos
 * Se ejecuta cada minuto para enviar recordatorios cuando llega la hora de inicio
 */

const mongoose = require('mongoose');

// Importar modelos y servicios directamente
const Access = require('../../backend/src/models/Access');
const Company = require('../../backend/src/models/Company');
const emailService = require('../../backend/src/services/emailService');
const { formatTime } = require('../../backend/src/utils/dateUtils');

// Conectar a MongoDB si no está conectado
const connectDB = async () => {
  if (mongoose.connection.readyState === 1) {
    return;
  }
  const mongoURI = process.env.DATABASE_URL || 'mongodb+srv://admin:admin123@visitas-securiti.cz8yvzk.mongodb.net/visitas-securiti?retryWrites=true&w=majority&appName=visitas-securiti';
  await mongoose.connect(mongoURI);
};

async function sendDueReminders() {
  try {
    const now = new Date();
    const due = await Access.find({
      status: 'active',
      startDate: { $lte: now },
      reminderSent: { $ne: true }
    }).populate('creatorId', 'firstName lastName email');

    if (!due.length) {
      console.log('ℹ️ [CRON REMINDERS] No hay recordatorios pendientes');
      return { sent: 0 };
    }

    console.log(`📨 [CRON REMINDERS] Enviando recordatorios para ${due.length} acceso(s)`);

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
                companyId: company?.companyId || null,
                companyLogo: company?.logo || null
              });
              console.log(`✅ [CRON REMINDERS] Recordatorio enviado al creador: ${access.creatorId.email}`);
            } catch (e) {
              console.warn('⚠️ [CRON REMINDERS] Error enviando recordatorio al creador:', e?.message);
            }
          }

          // Recordatorio a invitados
          for (const guest of access.invitedUsers || []) {
            if (!guest?.email) continue;
            try {
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
                companyId: company?.companyId || null,
                companyLogo: company?.logo || null
              });
              console.log(`✅ [CRON REMINDERS] Recordatorio enviado al invitado: ${guest.email}`);
            } catch (e) {
              console.warn('⚠️ [CRON REMINDERS] Error enviando recordatorio al invitado:', guest.email, e?.message);
            }
          }
        }

        // Marcar como enviado
        access.reminderSent = true;
        await access.save();
        console.log(`✅ [CRON REMINDERS] Recordatorio marcado como enviado para: ${access.eventName}`);
      } catch (inner) {
        console.warn('⚠️ [CRON REMINDERS] Error procesando acceso:', inner?.message);
      }
    }

    return { sent: due.length };
  } catch (e) {
    console.error('❌ [CRON REMINDERS] Error general:', e?.message);
    throw e;
  }
}

module.exports = async (req, res) => {
  // Verificar que la solicitud venga de Vercel Cron (seguridad)
  const authHeader = req.headers.authorization;
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    console.warn('⚠️ [CRON REMINDERS] Unauthorized cron request');
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    await connectDB();
    const result = await sendDueReminders();
    
    return res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      remindersSent: result.sent,
      message: `Recordatorios procesados: ${result.sent} acceso(s)`
    });
  } catch (error) {
    console.error('❌ [CRON REMINDERS] Cron error:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};
