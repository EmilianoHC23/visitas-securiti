const express = require('express');
const Access = require('../models/Access');
const Visit = require('../models/Visit');
const Company = require('../models/Company');
const { auth, authorize } = require('../middleware/auth');
const emailService = require('../services/emailService');
const { generateAccessInvitationQR } = require('../utils/qrGenerator');
const { formatTime } = require('../utils/dateUtils');

const router = express.Router();

// ==================== LAZY HELPERS: FINALIZATION + REMINDERS ====================
// Marca como 'finalized' todos los accesos activos cuyo endDate ya pasó
// y cambia invitados 'pendiente' -> 'no-asistio'. Idempotente.
async function finalizeExpiredAccesses() {
  try {
    const now = new Date();
    const AccessModel = Access; // evitar shadowing
    const expired = await AccessModel.find({ status: 'active', endDate: { $lt: now } });
    if (!expired.length) return;

    for (const access of expired) {
      access.status = 'finalized';
      let modified = false;
      for (const guest of access.invitedUsers) {
        if (guest.attendanceStatus === 'pendiente') {
          guest.attendanceStatus = 'no-asistio';
          modified = true;
        }
      }
      await access.save();
    }
  } catch (e) {
    console.warn('⚠️ finalizeExpiredAccesses error:', e?.message || e);
  }
}

// Envía recordatorios cuando da la hora/fecha de inicio del acceso/evento.
// Lazy/On-demand: se ejecuta al consultar la lista de accesos.
// Usa reminderSent como candado permanente para evitar duplicados.
async function sendDueReminders() {
  try {
    const now = new Date();
    const AccessModel = Access;
    const due = await AccessModel.find({
      status: 'active',
      startDate: { $lte: now },
      reminderSent: { $ne: true }
    }).populate('creatorId', 'firstName lastName email');

    if (!due.length) return;

    console.log(`📨 [LAZY REMINDERS] Enviando recordatorios para ${due.length} acceso(s)`);

    for (const access of due) {
      try {
        // Respetar configuración de envío de correos
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
              console.log(`✅ [LAZY REMINDERS] Recordatorio enviado al creador: ${access.creatorId.email}`);
            } catch (e) {
              console.warn('⚠️ [LAZY REMINDERS] Error enviando recordatorio al creador:', e?.message);
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
                companyId: company?.companyId || null,
                companyLogo: company?.logo || null
              });
              console.log(`✅ [LAZY REMINDERS] Recordatorio enviado al invitado: ${guest.email}`);
            } catch (e) {
              console.warn('⚠️ [LAZY REMINDERS] Error enviando recordatorio al invitado:', guest.email, e?.message);
            }
          }
        }

        // Marcar recordatorio como enviado para evitar duplicados
        access.reminderSent = true;
        await access.save();
        console.log(`✅ [LAZY REMINDERS] Recordatorio marcado como enviado para: ${access.eventName}`);
      } catch (inner) {
        console.warn('⚠️ [LAZY REMINDERS] Error procesando acceso:', inner?.message);
      }
    }
  } catch (e) {
    console.warn('⚠️ [LAZY REMINDERS] Error general:', e?.message);
  }
}

// ==================== GET ALL ACCESS CODES ====================
router.get('/', auth, authorize(['admin', 'reception', 'host']), async (req, res) => {
  try {
    // Lazy finalize before listing
    await finalizeExpiredAccesses();
    // Lazy reminders at access start
    await sendDueReminders();
    const { status } = req.query;
    const filter = { companyId: req.user.companyId };

    if (status) {
      filter.status = status;
    }

    // If user is host, only show their access codes
    if (req.user.role === 'host') {
      filter.creatorId = req.user._id;
    }

    const accesses = await Access.find(filter)
      .populate('creatorId', 'firstName lastName email')
      .populate('notifyUsers', 'firstName lastName email')
      .sort({ createdAt: -1 });

    res.json(accesses);
  } catch (error) {
    console.error('Get accesses error:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// ==================== GET ACCESS FOR AGENDA/CALENDAR ====================
router.get('/agenda', auth, authorize(['admin', 'reception', 'host']), async (req, res) => {
  try {
    // Lazy finalize before agenda
    await finalizeExpiredAccesses();
    // Lazy reminders at access start
    await sendDueReminders();
    const { start, end } = req.query;
    
    const filter = { 
      companyId: req.user.companyId,
      status: { $in: ['active', 'finalized'] }
    };

    // Filter by date range if provided
    if (start && end) {
      filter.$or = [
        { startDate: { $gte: new Date(start), $lte: new Date(end) } },
        { endDate: { $gte: new Date(start), $lte: new Date(end) } }
      ];
    }

    // If user is host, only show their access codes
    if (req.user.role === 'host') {
      filter.creatorId = req.user._id;
    }

    const accesses = await Access.find(filter)
      .populate('creatorId', 'firstName lastName email')
      .sort({ startDate: 1 });

    res.json(accesses);
  } catch (error) {
    console.error('Get agenda accesses error:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// ==================== GET SINGLE ACCESS ====================
router.get('/:id', auth, authorize(['admin', 'reception', 'host']), async (req, res) => {
  try {
    // Lazy finalize before fetch
    await finalizeExpiredAccesses();
    // Lazy reminders at access start
    await sendDueReminders();
    const access = await Access.findById(req.params.id)
      .populate('creatorId', 'firstName lastName email')
      .populate('notifyUsers', 'firstName lastName email');

    if (!access) {
      return res.status(404).json({ message: 'Acceso no encontrado' });
    }

    // Check permissions
    if (req.user.role === 'host' && access.creatorId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'No tienes permiso para ver este acceso' });
    }

    res.json(access);
  } catch (error) {
    console.error('Get access error:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// ==================== CREATE NEW ACCESS ====================
router.post('/', auth, authorize(['admin', 'host']), async (req, res) => {
  try {
    const { 
      eventName,
      type,
      startDate,
      endDate,
      location,
      eventImage,
      invitedUsers,
      notifyUsers,
      settings,
      additionalInfo
    } = req.body;

    // Validations
    if (!eventName || !type || !startDate || !endDate) {
      return res.status(400).json({ 
        message: 'Nombre del evento, tipo, fecha de inicio y fecha de fin son requeridos' 
      });
    }

    if (invitedUsers && !Array.isArray(invitedUsers)) {
      return res.status(400).json({ message: 'invitedUsers debe ser un array' });
    }

    // Get company info for emails
    const company = await Company.findOne({ companyId: req.user.companyId });
    if (!company) {
      return res.status(404).json({ message: 'Empresa no encontrada' });
    }

    // Create access
    const access = new Access({
      eventName,
      type,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      location: location || '',
      eventImage: eventImage || '',
      creatorId: req.user._id,
      companyId: req.user.companyId,
      invitedUsers: invitedUsers ? invitedUsers.map(user => ({
        name: user.name,
        email: user.email || '',
        phone: user.phone || '',
        company: user.company || '',
        attendanceStatus: 'pendiente'
      })) : [],
      notifyUsers: notifyUsers || [],
      settings: {
        sendAccessByEmail: settings?.sendAccessByEmail !== false,
        language: settings?.language || 'es',
        noExpiration: settings?.noExpiration || false,
        // Persistir explicitamente el pre-registro público
        enablePreRegistration: settings?.enablePreRegistration === true
      },
      additionalInfo: additionalInfo || '',
      status: 'active'
    });

    await access.save();
    await access.populate('creatorId', 'firstName lastName email');

    // Generar y almacenar QR para cada invitado con email o teléfono (para descarga en UI)
    if (Array.isArray(access.invitedUsers) && access.invitedUsers.length > 0) {
      let modifiedGuestQRCodes = false;
      for (const guest of access.invitedUsers) {
        try {
          // Generar QR base64 y guardarlo para permitir descarga desde el panel
          const qrCode = await generateAccessInvitationQR(access, guest);
          if (qrCode) {
            guest.qrCode = qrCode;
            modifiedGuestQRCodes = true;
          }
        } catch (qrErr) {
          console.warn('⚠️ Error generating QR for invited user:', guest?.email || guest?.name, qrErr?.message);
        }
      }
      if (modifiedGuestQRCodes) {
        try { await access.save(); } catch (saveErr) { console.warn('⚠️ Error saving guest QR codes:', saveErr?.message); }
      }
    }

    // Send emails if enabled
    if (access.settings.sendAccessByEmail) {
      // Send confirmation email to creator
      try {
        await emailService.sendAccessCreatedEmail({
          creatorEmail: req.user.email,
          creatorName: `${req.user.firstName} ${req.user.lastName}`,
          accessTitle: access.eventName,
          accessType: access.type,
          startDate: access.startDate,
          endDate: access.endDate,
          startTime: formatTime(access.startDate),
          endTime: formatTime(access.endDate),
          location: access.location,
          accessCode: access.accessCode,
          invitedCount: access.invitedUsers.length,
          companyName: company.name,
          companyLogo: company.logo,
          companyId: company._id.toString() // ✅ AGREGAR companyId
        });
      } catch (emailError) {
        console.error('Error sending access created email:', emailError);
      }

      // Send invitation emails to guests
      for (const guest of access.invitedUsers) {
        if (guest.email) {
          try {
            // Enviar datos del QR para que el email renderice un QR escaneable
            const qrData = {
              type: 'access-invitation',
              accessId: access._id.toString(),
              accessCode: access.accessCode,
              guestName: guest.name,
              guestEmail: guest.email || '',
              eventName: access.eventName,
              eventDate: access.startDate
            };

            await emailService.sendAccessInvitationEmail({
              invitedEmail: guest.email,
              invitedName: guest.name,
              creatorName: `${req.user.firstName} ${req.user.lastName}`,
              accessTitle: access.eventName,
              accessType: access.type,
              startDate: access.startDate,
              endDate: access.endDate,
              startTime: formatTime(access.startDate),
              endTime: formatTime(access.endDate),
              location: access.location,
              accessCode: access.accessCode,
              qrData: JSON.stringify(qrData), // Pasar como string para usar en la API pública
              eventImage: access.eventImage,
              additionalInfo: access.additionalInfo,
              hostName: `${req.user.firstName} ${req.user.lastName}`,
              companyName: company.name,
              companyLogo: company.logo,
              companyId: company._id,
              accessId: access._id.toString() // ✅ AGREGAR accessId
            });
          } catch (emailError) {
            console.error(`Error sending invitation to ${guest.email}:`, emailError);
          }
        }
      }
    }

    res.status(201).json(access);
  } catch (error) {
    console.error('Create access error:', error);
    res.status(500).json({ message: 'Error interno del servidor', error: error.message });
  }
});

// ==================== UPDATE ACCESS (LIMITED FIELDS) ====================
router.put('/:id', auth, authorize(['admin', 'host']), async (req, res) => {
  try {
    const access = await Access.findById(req.params.id)
      .populate('creatorId', 'firstName lastName email');

    if (!access) {
      return res.status(404).json({ message: 'Acceso no encontrado' });
    }

    // Check permissions
    if (req.user.role === 'host' && access.creatorId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'No tienes permiso para editar este acceso' });
    }

    // Only allow editing certain fields
  const { endDate, eventImage, invitedUsers, additionalInfo } = req.body;

    let modified = false;
    const oldData = { ...access.toObject() };

    // Update endDate (can only extend, not reduce)
    if (endDate) {
      const newEndDate = new Date(endDate);
      if (newEndDate > access.endDate) {
        access.endDate = newEndDate;
        modified = true;
      }
    }

    // Update image
    if (eventImage !== undefined) {
      access.eventImage = eventImage;
      modified = true;
    }

    // Update additional info
    if (additionalInfo !== undefined) {
      access.additionalInfo = additionalInfo;
      modified = true;
    }

    // Add new invited users (cannot remove existing)
    if (invitedUsers && Array.isArray(invitedUsers)) {
      const newGuests = [];
      for (const user of invitedUsers) {
        // Check if user already exists
        const exists = access.invitedUsers.some(
          existing => existing.email === user.email || existing.phone === user.phone
        );
        
        if (!exists) {
          access.invitedUsers.push({
            name: user.name,
            email: user.email || '',
            phone: user.phone || '',
            company: user.company || '',
            attendanceStatus: 'pendiente'
          });
          newGuests.push(user);
          modified = true;
        }
      }

      // Generar y guardar QR para nuevos invitados
      if (newGuests.length > 0) {
        try {
          for (const g of access.invitedUsers) {
            // Generar QR solo para los que no lo tengan aún
            if (!g.qrCode) {
              try {
                const qr = await generateAccessInvitationQR(access, g);
                if (qr) g.qrCode = qr;
              } catch (qrErr) {
                console.warn('⚠️ Error generating QR for new guest:', g?.email || g?.name, qrErr?.message);
              }
            }
          }
        } catch (bulkQrErr) {
          console.warn('⚠️ Error generating QRs for new guests:', bulkQrErr?.message);
        }
      }

      // Send invitation emails to new guests
      if (newGuests.length > 0 && access.settings.sendAccessByEmail) {
        const company = await Company.findOne({ companyId: access.companyId });
        
        for (const guest of newGuests) {
          if (guest.email) {
            try {
              // Generar datos del QR para usar con API pública
              const qrData = {
                type: 'access-invitation',
                accessId: access._id.toString(),
                accessCode: access.accessCode,
                guestName: guest.name,
                guestEmail: guest.email || '',
                eventName: access.eventName,
                eventDate: access.startDate
              };

              await emailService.sendAccessInvitationEmail({
                invitedEmail: guest.email,
                invitedName: guest.name,
                creatorName: `${access.creatorId.firstName} ${access.creatorId.lastName}`,
                accessTitle: access.eventName,
                accessType: access.type,
                startDate: access.startDate,
                endDate: access.endDate,
                startTime: formatTime(access.startDate),
                endTime: formatTime(access.endDate),
                location: access.location,
                accessCode: access.accessCode,
                qrData: JSON.stringify(qrData),
                eventImage: access.eventImage,
                additionalInfo: access.additionalInfo,
                hostName: `${access.creatorId.firstName} ${access.creatorId.lastName}`,
                companyName: company.name,
                companyLogo: company.logo,
                companyId: company._id,
                accessId: access._id.toString() // ✅ AGREGAR accessId
              });
            } catch (emailError) {
              console.error(`Error sending invitation to ${guest.email}:`, emailError);
            }
          }
        }
      }
    }

    if (!modified) {
      return res.json(access);
    }

    await access.save();

    // Send modification email to creator
    if (access.settings.sendAccessByEmail) {
      try {
        const company = await Company.findOne({ companyId: access.companyId });
        await emailService.sendAccessModifiedToCreatorEmail({
          creatorEmail: access.creatorId.email,
          creatorName: `${access.creatorId.firstName} ${access.creatorId.lastName}`,
          accessTitle: access.eventName,
          accessType: access.type,
          startDate: access.startDate,
          endDate: access.endDate,
          startTime: formatTime(access.startDate),
          endTime: formatTime(access.endDate),
          location: access.location,
          changes: [],
          companyName: company.name,
          companyLogo: company.logo
        });
      } catch (emailError) {
        console.error('Error sending modification email to creator:', emailError);
      }

      // Send modification email to all guests
      for (const guest of access.invitedUsers) {
        if (guest.email) {
          try {
            const company = await Company.findOne({ companyId: access.companyId });
            
            // Generar datos del QR para usar con API pública
            const qrData = {
              type: 'access-invitation',
              accessId: access._id.toString(),
              accessCode: access.accessCode,
              guestName: guest.name,
              guestEmail: guest.email || '',
              eventName: access.eventName,
              eventDate: access.startDate
            };
            
            await emailService.sendAccessModifiedToGuestEmail({
              invitedEmail: guest.email,
              invitedName: guest.name,
              creatorName: `${access.creatorId.firstName} ${access.creatorId.lastName}`,
              accessTitle: access.eventName,
              accessType: access.type,
              startDate: access.startDate,
              endDate: access.endDate,
              startTime: formatTime(access.startDate),
              endTime: formatTime(access.endDate),
              location: access.location,
              accessCode: access.accessCode,
              qrData: JSON.stringify(qrData),
              companyName: company.name,
              companyLogo: company.logo
            });
          } catch (emailError) {
            console.error(`Error sending modification email to ${guest.email}:`, emailError);
          }
        }
      }
    }

    res.json(access);
  } catch (error) {
    console.error('Update access error:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// ==================== CANCEL ACCESS ====================
router.delete('/:id', auth, authorize(['admin', 'host']), async (req, res) => {
  try {
    const access = await Access.findById(req.params.id)
      .populate('creatorId', 'firstName lastName email');

    if (!access) {
      return res.status(404).json({ message: 'Acceso no encontrado' });
    }

    // Check permissions
    if (req.user.role === 'host' && access.creatorId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'No tienes permiso para cancelar este acceso' });
    }

    // Update status to cancelled
    access.status = 'cancelled';
    await access.save();

    // Send cancellation emails
    if (access.settings.sendAccessByEmail) {
      const company = await Company.findOne({ companyId: access.companyId });

      // Send to creator
      try {
        await emailService.sendAccessCancelledEmail({
          recipientEmail: access.creatorId.email,
          recipientName: `${access.creatorId.firstName} ${access.creatorId.lastName}`,
          accessTitle: access.eventName,
          accessType: access.type,
          startDate: access.startDate,
          endDate: access.endDate,
          startTime: formatTime(access.startDate),
          endTime: formatTime(access.endDate),
          location: access.location,
          companyName: company.name,
          companyLogo: company.logo,
          companyId: company._id.toString()
        });
      } catch (emailError) {
        console.error('Error sending cancellation email to creator:', emailError);
      }

      // Send to all guests
      for (const guest of access.invitedUsers) {
        if (guest.email) {
          try {
            await emailService.sendAccessCancelledEmail({
              recipientEmail: guest.email,
              recipientName: guest.name,
              accessTitle: access.eventName,
              accessType: access.type,
              startDate: access.startDate,
              endDate: access.endDate,
              startTime: formatTime(access.startDate),
              endTime: formatTime(access.endDate),
              location: access.location,
              companyName: company.name,
              companyLogo: company.logo,
              companyId: company._id.toString()
            });
          } catch (emailError) {
            console.error(`Error sending cancellation email to ${guest.email}:`, emailError);
          }
        }
      }
    }

    res.json({ message: 'Acceso cancelado exitosamente', access });
  } catch (error) {
    console.error('Cancel access error:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// ==================== CHECK-IN GUEST ====================
router.post('/check-in/:accessCode', async (req, res) => {
  try {
    const { accessCode } = req.params;
    const { guestEmail, guestPhone, guestName } = req.body;

    if (!guestEmail && !guestPhone) {
      return res.status(400).json({ 
        message: 'Email o teléfono del invitado es requerido' 
      });
    }

    const access = await Access.findOne({ 
      accessCode,
      status: 'active'
    }).populate('creatorId', 'firstName lastName email');

    if (!access) {
      return res.status(404).json({ message: 'Código de acceso no válido o expirado' });
    }

    // Find the invited user
    let guestIndex = -1;
    if (guestEmail) {
      guestIndex = access.invitedUsers.findIndex(u => u.email === guestEmail);
    }
    if (guestIndex === -1 && guestPhone) {
      guestIndex = access.invitedUsers.findIndex(u => u.phone === guestPhone);
    }

    if (guestIndex === -1) {
      return res.status(404).json({ message: 'Invitado no encontrado en este acceso' });
    }

    const guest = access.invitedUsers[guestIndex];

    // Update attendance status
    if (guest.attendanceStatus === 'pendiente') {
      guest.attendanceStatus = 'asistio';
      guest.checkInTime = new Date();
      await access.save();

      // Send notification email to creator
      if (access.settings.sendAccessByEmail) {
        try {
          const company = await Company.findOne({ companyId: access.companyId });
          // No enviar "checked-in" si el invitado fue agregado vía pre-registro público
          if (!guest.addedViaPreRegistration) {
            console.log('📧 [CHECK-IN] Enviando sendGuestCheckedInEmail (invitación directa o agregado en edición)', {
              accessId: access._id.toString(),
              guest: { name: guest.name, email: guest.email || null, phone: guest.phone || null },
              creatorEmail: access.creatorId.email
            });
            await emailService.sendGuestCheckedInEmail({
              creatorEmail: access.creatorId.email,
              creatorName: `${access.creatorId.firstName} ${access.creatorId.lastName}`,
              guestName: guest.name,
              accessTitle: access.eventName,
              checkInTime: guest.checkInTime,
              location: access.location,
              companyName: company.name,
              companyLogo: company.logo
            });
          } else {
            console.log('↪️ [CHECK-IN] Omitido sendGuestCheckedInEmail por pre-registro público (se usa sendGuestArrivedEmail en pre-registro)', {
              accessId: access._id.toString(),
              guest: { name: guest.name, email: guest.email || null }
            });
          }
        } catch (emailError) {
          console.error('Error sending check-in notification:', emailError);
        }
      }
    }

    res.json({ 
      message: 'Check-in registrado exitosamente',
      access,
      guest 
    });
  } catch (error) {
    console.error('Check-in error:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// ==================== REDEEM ACCESS CODE (LEGACY - For compatibility) ====================
router.post('/redeem', async (req, res) => {
  try {
    const { accessCode, visitorData } = req.body;

    if (!accessCode || !visitorData) {
      return res.status(400).json({ 
        message: 'Código de acceso y datos del visitante son requeridos' 
      });
    }

    const access = await Access.findOne({ 
      accessCode, 
      status: 'active' 
    }).populate('creatorId', 'firstName lastName email');

    if (!access) {
      return res.status(404).json({ message: 'Código de acceso no válido o expirado' });
    }

    // Check date validity
    const now = new Date();
    if (now < access.startDate || now > access.endDate) {
      return res.status(400).json({ message: 'Código de acceso fuera del rango de fechas válido' });
    }

    res.json({ 
      valid: true, 
      access: {
        eventName: access.eventName,
        type: access.type,
        location: access.location,
        creatorName: `${access.creatorId.firstName} ${access.creatorId.lastName}`,
        startDate: access.startDate,
        endDate: access.endDate
      }
    });
  } catch (error) {
    console.error('Redeem access error:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// ==================== PUBLIC PRE-REGISTRATION ENDPOINTS ====================

// Get public access information (no auth required)
router.get('/:accessId/public-info', async (req, res) => {
  try {
    // Ensure up-to-date status for public
    await finalizeExpiredAccesses();
    const access = await Access.findById(req.params.accessId)
      .select('eventName type startDate endDate location eventImage additionalInfo status settings companyId')
      .lean();

    if (!access) {
      return res.status(404).json({ message: 'Acceso no encontrado' });
    }

    if (!access.settings?.enablePreRegistration) {
      return res.status(403).json({ message: 'Pre-registro no habilitado para este acceso' });
    }

    if (access.status !== 'active') {
      return res.status(400).json({ message: 'Este acceso ya no está activo' });
    }

    // Adjuntar datos públicos de la empresa (nombre y logo) si existen
    let company = null;
    try {
      if (access.companyId) {
        const Company = require('../models/Company');
        const c = await Company.findOne({ companyId: access.companyId }).select('name logo').lean();
        if (c) {
          company = { name: c.name, logo: c.logo || null };
        }
      }
    } catch (e) {
      console.warn('⚠️ Error fetching company for public-info:', e?.message);
    }

    res.json({
      ...access,
      company
    });
  } catch (error) {
    console.error('Get public access info error:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Pre-register for an access (no auth required)
router.post('/:accessId/pre-register', async (req, res) => {
  try {
    // Ensure up-to-date status before allowing registration
    await finalizeExpiredAccesses();
    const { name, email, company } = req.body;

    // Validación estricta: nombre, email y empresa son obligatorios
    if (!name || !email || !company) {
      return res.status(400).json({ message: 'Nombre, email y empresa son requeridos' });
    }

    const access = await Access.findById(req.params.accessId)
      .populate('creatorId', 'firstName lastName email');

    if (!access) {
      return res.status(404).json({ message: 'Acceso no encontrado' });
    }

    if (!access.settings?.enablePreRegistration) {
      return res.status(403).json({ message: 'Pre-registro no habilitado para este acceso' });
    }

    if (access.status !== 'active') {
      return res.status(400).json({ message: 'Este acceso ya no está activo' });
    }

    // Check if user already registered
    const existingUser = access.invitedUsers.find(u => 
      (email && u.email === email)
    );

    if (existingUser) {
      return res.status(400).json({ message: 'Ya estás registrado para este acceso' });
    }

    // Generate QR code for the new invited user (usar firma correcta)
    const qrCode = await generateAccessInvitationQR(
      access,
      { name, email: email || '', phone: '', company: company || '' }
    );

    const newInvitedUser = {
      name,
  email: email || '',
  phone: '',
  company: company || '',
      qrCode,
      attendanceStatus: 'pendiente',
      addedViaPreRegistration: true
    };

    access.invitedUsers.push(newInvitedUser);
    await access.save();

    // Send email with QR code if email provided
    if (email) {
      try {
        const companyData = await Company.findOne({ companyId: access.companyId });
        
        const qrData = {
          type: 'access-invitation',
          accessId: access._id.toString(),
          accessCode: access.accessCode,
          guestName: name,
          guestEmail: email || '',
          eventName: access.eventName,
          eventDate: access.startDate
        };

        await emailService.sendAccessInvitationEmail({
          invitedEmail: email,
          invitedName: name,
          creatorName: access.creatorId ? `${access.creatorId.firstName} ${access.creatorId.lastName}` : 'Sistema',
          accessTitle: access.eventName,
          accessType: access.type,
          startDate: access.startDate,
          endDate: access.endDate,
          startTime: formatTime(access.startDate),
          endTime: formatTime(access.endDate),
          location: access.location,
          accessCode: access.accessCode,
          qrData: JSON.stringify(qrData),
          eventImage: access.eventImage,
          additionalInfo: access.additionalInfo,
          hostName: access.creatorId ? `${access.creatorId.firstName} ${access.creatorId.lastName}` : 'Anfitrión',
          companyName: companyData?.name || 'Empresa',
          companyLogo: companyData?.logo,
          companyId: companyData?._id,
          accessId: access._id.toString() // ✅ AGREGAR accessId
        });
        console.log('📧 [PRE-REGISTER] Enviado sendAccessInvitationEmail al invitado pre-registrado', { email, accessId: access._id.toString() });

        // Notificar al organizador únicamente si es pre-registro público
        if (access?.settings?.sendAccessByEmail !== false && access?.creatorId?.email) {
          try {
            await emailService.sendGuestArrivedEmail({
              visitId: access._id.toString(),
              creatorEmail: access.creatorId.email,
              creatorName: `${access.creatorId.firstName} ${access.creatorId.lastName}`,
              guestName: name,
              guestEmail: email,
              guestCompany: company,
              guestPhoto: '',
              accessTitle: access.eventName,
              companyName: companyData?.name || 'Empresa',
              companyId: companyData?._id?.toString(),
              companyLogo: companyData?.logo
            });
            console.log('📧 [PRE-REGISTER] Enviado sendGuestArrivedEmail al organizador (pre-registro público)', {
              creatorEmail: access.creatorId.email,
              guestName: name,
              accessId: access._id.toString()
            });
          } catch (notifyErr) {
            console.warn('⚠️ Error sending guest arrived (pre-register) email:', notifyErr?.message);
          }
        }
      } catch (emailError) {
        console.error('Error sending confirmation email:', emailError);
        // Don't fail the registration if email fails
      }
    }

    res.status(201).json({
      message: 'Registro exitoso',
      qrCode,
      invitedUser: newInvitedUser
    });
  } catch (error) {
    console.error('Pre-registration error:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// ==================== SERVE EVENT IMAGE (URL TEMPORAL) ====================
router.get('/event-image/:accessId/:token', async (req, res) => {
  try {
    const { accessId, token } = req.params;

    // Verificar el token JWT
    const decoded = require('jsonwebtoken').verify(token, process.env.JWT_SECRET);
    
    // Validar que el token es del tipo correcto
    if (decoded.type !== 'event-image') {
      return res.status(403).json({ message: 'Token inválido' });
    }

    // Validar que el accessId coincide
    if (decoded.accessId !== accessId) {
      return res.status(403).json({ message: 'AccessId no coincide' });
    }

    // Buscar el acceso
    const access = await Access.findById(accessId);
    if (!access) {
      return res.status(404).json({ message: 'Acceso no encontrado' });
    }

    // Verificar que existe imagen de evento
    if (!access.eventImage || !access.eventImage.startsWith('data:image')) {
      return res.status(404).json({ message: 'Imagen de evento no encontrada' });
    }

    // Convertir Base64 a buffer
    const base64Data = access.eventImage.replace(/^data:image\/\w+;base64,/, '');
    const imageBuffer = Buffer.from(base64Data, 'base64');

    // Determinar el tipo de imagen
    const imageType = access.eventImage.match(/data:image\/(\w+);/)?.[1] || 'jpeg';
    
    // Establecer headers de caché
    res.set({
      'Content-Type': `image/${imageType}`,
      'Cache-Control': 'public, max-age=604800', // 7 días
      'ETag': `"${accessId}-${access.updatedAt?.getTime() || Date.now()}"`
    });

    console.log(`✅ [EVENT IMAGE] Imagen servida para acceso ${accessId}. Tamaño: ${imageBuffer.length} bytes`);
    res.send(imageBuffer);
  } catch (error) {
    console.error('❌ [EVENT IMAGE] Error:', error.message);
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token inválido o expirado' });
    }
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

module.exports = router;