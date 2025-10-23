const express = require('express');
const Access = require('../models/Access');
const Visit = require('../models/Visit');
const Company = require('../models/Company');
const { auth, authorize } = require('../middleware/auth');
const emailService = require('../services/emailService');
const { generateAccessInvitationQR } = require('../utils/qrGenerator');
const { formatTime } = require('../utils/dateUtils');

const router = express.Router();

// ==================== GET ALL ACCESS CODES ====================
router.get('/', auth, authorize(['admin', 'reception', 'host']), async (req, res) => {
  try {
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
        noExpiration: settings?.noExpiration || false
      },
      additionalInfo: additionalInfo || '',
      status: 'active'
    });

    await access.save();
    await access.populate('creatorId', 'firstName lastName email');

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
          companyLogo: company.logo
        });
      } catch (emailError) {
        console.error('Error sending access created email:', emailError);
      }

      // Send invitation emails to guests
      for (const guest of access.invitedUsers) {
        if (guest.email) {
          try {
            // Generate QR code for guest
            const qrCode = await generateAccessInvitationQR(access, guest);

            // En lugar de pasar el QR en Base64, pasamos los datos para generar el QR en el email
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
              companyName: company.name,
              companyLogo: company.logo
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
                companyName: company.name,
                companyLogo: company.logo
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
          companyLogo: company.logo
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
              companyLogo: company.logo
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

module.exports = router;