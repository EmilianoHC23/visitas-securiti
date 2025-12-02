const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const Visit = require('../models/Visit');
const User = require('../models/User');
const Company = require('../models/Company');
const { auth, authorize } = require('../middleware/auth');
const Approval = require('../models/Approval');
const VisitEvent = require('../models/VisitEvent');
const emailService = require('../services/emailService');

const router = express.Router();

// Get all visits
router.get('/', auth, async (req, res) => {
  try {
    const { status, date, hostId, visitorName, visitorCompany, q, page = 1, limit = 10 } = req.query;
    const filter = { companyId: req.user.companyId };

    // Filtros avanzados
    if (status) filter.status = status;
    if (hostId) filter.host = hostId;
    if (visitorName) filter.visitorName = { $regex: visitorName, $options: 'i' };
    if (visitorCompany) filter.visitorCompany = { $regex: visitorCompany, $options: 'i' };
    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);
      filter.scheduledDate = { $gte: startDate, $lt: endDate };
    }
    if (q) {
      filter.$or = [
        { visitorName: { $regex: q, $options: 'i' } },
        { visitorCompany: { $regex: q, $options: 'i' } },
        { reason: { $regex: q, $options: 'i' } },
      ];
    }

    // Si el usuario es anfitrión, solo mostrar sus visitas
    if (req.user.role === 'host') {
      filter.host = req.user._id;
    }

    // Paginación
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Visit.countDocuments(filter);
    const visits = await Visit.find(filter)
      .populate('host', 'firstName lastName email profileImage')
      .sort({ scheduledDate: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.json({
      visits,
      meta: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Get visits error:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Agenda endpoint - DEBE IR ANTES DE /:id para evitar que "agenda" se interprete como ID
router.get('/agenda', auth, async (req, res) => {
  try {
    const { from, to, hostId, q } = req.query;
    const filter = { companyId: req.user.companyId };
    const now = new Date();
    const start = from ? new Date(from) : now;
    const end = to ? new Date(to) : new Date(now.getTime() + 30*24*60*60*1000);
    filter.scheduledDate = { $gte: start, $lte: end };
    if (hostId) filter.host = hostId;
    if (q) {
      filter.$or = [
        { visitorName: { $regex: q, $options: 'i' } },
        { visitorCompany: { $regex: q, $options: 'i' } },
        { reason: { $regex: q, $options: 'i' } }
      ];
    }
    const visits = await Visit.find(filter).populate('host', 'firstName lastName email');
    res.json(visits);
  } catch (e) {
    console.error('Agenda error:', e);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Get single visit
router.get('/:id', auth, async (req, res) => {
  try {
    const visit = await Visit.findById(req.params.id)
      .populate('host', 'firstName lastName email profileImage');
    if (!visit) {
      return res.status(404).json({ message: 'Visita no encontrada' });
    }
    // Check if user has permission to view this visit
    if (req.user.role === 'host' && visit.host._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'No tienes permisos para ver esta visita' });
    }
    // Obtener eventos de la visita para la línea de tiempo
    const events = await VisitEvent.find({ visitId: visit._id }).sort({ createdAt: 1 });
    
    // Si la visita proviene de un acceso/evento, obtener información del acceso
    let accessInfo = null;
    if (visit.visitType === 'access-code' && visit.accessCode) {
      try {
        const Access = require('../models/Access');
        const access = await Access.findOne({ accessCode: visit.accessCode })
          .populate('creatorId', 'firstName lastName email')
          .lean();
        if (access) {
          accessInfo = {
            _id: access._id,
            eventName: access.eventName,
            type: access.type,
            creatorId: access.creatorId,
            startDate: access.startDate,
            endDate: access.endDate,
            location: access.location,
            createdAt: access.createdAt
          };
        }
      } catch (accessError) {
        console.error('Error fetching access info:', accessError);
      }
    }
    
    res.json({ visit, events, accessInfo });
  } catch (error) {
    console.error('Get visit error:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Create new visit
router.post('/', auth, async (req, res) => {
  try {
    console.log('📝 Creating visit - User:', req.user?.email, 'Company:', req.user?.companyId);
    const { visitorName, visitorCompany, reason, hostId, scheduledDate, visitorEmail, visitorPhone } = req.body;
    console.log('📝 Visit data:', { visitorName, visitorCompany, reason, hostId, scheduledDate });
    if (typeof req.body.visitorPhoto === 'string') {
      console.log('🖼️ visitorPhoto received:', {
        present: true,
        length: req.body.visitorPhoto?.length,
        prefix: req.body.visitorPhoto?.slice(0, 30)
      });
    } else {
      console.log('🖼️ visitorPhoto received:', { present: false, type: typeof req.body.visitorPhoto });
    }

    // Validate required fields
    if (!visitorName || !reason || !hostId || !scheduledDate) {
      console.log('❌ Missing required fields');
      return res.status(400).json({ message: 'Todos los campos requeridos deben ser proporcionados' });
    }

    // Verificar lista negra (alerta preventiva) - Optimizada con índices
    if (visitorEmail) {
      const Blacklist = require('../models/Blacklist');
      const blacklistEntry = await Blacklist.findOne({
        $or: [
          { email: visitorEmail.toLowerCase() },
          { identifier: visitorEmail.toLowerCase() }
        ],
        companyId: req.user.companyId,
        isActive: true
      }).lean(); // .lean() para mejorar performance al no retornar un documento mongoose completo

      if (blacklistEntry) {
        console.log('⚠️ [REGISTER] Visitante encontrado en lista negra:', {
          visitorName,
          email: visitorEmail,
          reason: blacklistEntry.reason
        });
        
        // Retornar advertencia sin bloquear el registro
        return res.status(200).json({
          warning: 'blacklist',
          blacklistInfo: {
            _id: blacklistEntry._id,
            visitorName: blacklistEntry.visitorName,
            email: blacklistEntry.identifier || blacklistEntry.email,
            reason: blacklistEntry.reason,
            photo: blacklistEntry.photo,
            addedAt: blacklistEntry.createdAt
          }
        });
      }
    }

    // Verify host exists and is active (allow host or admin)
    const host = await User.findById(hostId);
    if (!host || !host.isActive || !['host', 'admin'].includes(host.role)) {
      console.log('❌ Invalid host:', { hostId, found: !!host, active: host?.isActive, role: host?.role });
      return res.status(400).json({ message: 'Host no válido' });
    }

    // Get company settings for auto-approval
    let company = null;
    let autoApproval = false;
    
    try {
      // Buscar company por companyId (string), no por _id
      const companyId = req.user.companyId || host.companyId;
      if (companyId) {
        company = await Company.findOne({ companyId: companyId });
        autoApproval = company?.settings?.autoApproval || false;
        console.log('✅ Company found:', { companyId, autoApproval, autoCheckIn: company?.settings?.autoCheckIn });
      } else {
        console.log('⚠️ No companyId found:', { userId: req.user._id, hostId });
        autoApproval = false;
      }
    } catch (error) {
      console.log('⚠️ Error fetching company settings:', error.message);
      autoApproval = false;
    }
    
    console.log('🏢 Company settings:', { autoApproval, autoCheckIn: company?.settings?.autoCheckIn, companyId: host.companyId });

    // Determinar estado inicial según configuración
    let initialStatus = 'pending';
    let checkInTime = null;

    if (autoApproval) {
      initialStatus = 'approved';
      // Si auto check-in también está habilitado, ir directamente a checked-in
      if (company?.settings?.autoCheckIn) {
        initialStatus = 'checked-in';
        checkInTime = new Date();
        console.log('🔄 Auto check-in enabled, visit will be created as checked-in');
      }
    }

    // Forzar aprobación automática cuando proviene de un acceso/evento (QR de invitación)
    // El invitado irá a "Respuesta recibida" (approved) para que el organizador registre su entrada manualmente
    // SOBRESCRIBE cualquier configuración de auto check-in
    if (req.body.visitType === 'access-code' || req.body.fromAccessEvent === true) {
      initialStatus = 'approved';
      checkInTime = null; // Limpiar checkInTime - el organizador debe registrar manualmente
      console.log('🎟️ [ACCESS EVENT] Forcing initial status to approved for access/event flow (overriding auto check-in)');
    }

    const visit = new Visit({
      visitorName,
      visitorCompany: visitorCompany || '',
      visitorPhoto: req.body.visitorPhoto,
      reason,
      destination: req.body.destination || 'SecurITI',
      host: hostId,
      scheduledDate: new Date(scheduledDate),
      companyId: req.user.companyId,
      visitorEmail,
      visitorPhone,
      status: initialStatus,
      checkInTime: checkInTime,
      qrToken: autoApproval ? require('crypto').randomBytes(16).toString('hex') : null,
      approvedAt: autoApproval ? new Date() : null,
      visitType: req.body.visitType || 'spontaneous', // Guardar visitType para identificar visitas de acceso
      accessCode: req.body.accessCode || null // Guardar accessCode para buscar el acceso luego
    });

    await visit.save();
    await visit.populate('host', 'firstName lastName email profileImage');

    // Si es una visita de acceso/evento, enviar email al organizador notificando que el invitado llegó
    // PERO SOLO si fue agregado vía pre-registro público (no si fue invitado directamente)
    if ((req.body.visitType === 'access-code' || req.body.fromAccessEvent === true) && initialStatus === 'approved') {
      try {
        // Buscar el acceso para obtener el creador
        const Access = require('../models/Access');
        const access = await Access.findOne({ accessCode: req.body.accessCode }).populate('creatorId', 'firstName lastName email');
        
        if (access && access.creatorId) {
          // Buscar al invitado en el acceso para verificar si fue pre-registrado
          const guest = access.invitedUsers.find(u => 
            u.email === visitorEmail || u.phone === req.body.visitorPhone
          );
          
          // SOLO enviar sendGuestArrivedEmail si fue agregado vía pre-registro público
          if (guest && guest.addedViaPreRegistration === true) {
            await require('../services/emailService').sendGuestArrivedEmail({
              visitId: visit._id,
              creatorEmail: access.creatorId.email,
              creatorName: `${access.creatorId.firstName} ${access.creatorId.lastName}`,
              guestName: visitorName,
              guestEmail: visitorEmail || 'No proporcionado',
              guestCompany: visitorCompany || 'No proporcionado',
              guestPhoto: req.body.visitorPhoto,
              accessTitle: access.eventName,
              companyName: (company && company.name) || 'SecurITI',
              companyId: company?._id.toString() || null,
              companyLogo: company?.logo || null
            });
            console.log('✅ [PRE-REGISTRO] Email de llegada enviado al organizador (pre-registro público):', access.creatorId.email);
          } else {
            console.log('ℹ️ [INVITADO DIRECTO] Omitido sendGuestArrivedEmail para invitado agregado manualmente (se enviará sendGuestCheckedInEmail en check-in)');
          }
        }
      } catch (emailError) {
        console.error('⚠️ Error enviando email de llegada:', emailError);
        // No bloqueamos el flujo si falla el email
      }
    }

    // Si se hizo auto check-in, crear evento
    if (initialStatus === 'checked-in') {
      await new VisitEvent({ visitId: visit._id, type: 'check-in' }).save();
      console.log('✅ Auto check-in event created');
    }

    // Create approval token and send email to host if not auto-approved
    // EXCEPTO si la visita proviene de un acceso/evento (ya está pre-aprobada)
    const isAccessEvent = req.body.visitType === 'access-code' || req.body.fromAccessEvent === true;
    
    if (!autoApproval && !isAccessEvent) {
      const approval = Approval.createWithExpiry(visit._id, host._id, 48);
      await approval.save();

  const FE = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '');
    const approveUrl = `${FE}/api/visits/approve/${approval.token}`;
    const rejectUrl = `${FE}/api/visits/reject/${approval.token}`;
      await require('../services/emailService').sendApprovalRequestEmail({
        visitId: visit._id, // ✅ Agregar visitId para generar URL temporal de foto
        hostEmail: host.email,
        hostName: `${host.firstName} ${host.lastName}`,
        companyName: (company && company.name) || 'SecurITI',
        companyId: company?._id.toString() || null,
        companyLogo: company?.logo || null,
        visitorName,
        visitorCompany,
        visitorPhoto: req.body.visitorPhoto,
        reason,
        scheduledDate,
        approveUrl,
        rejectUrl
      });
      console.log('📧 Email de solicitud de aprobación enviado al host:', host.email);
    } else if (isAccessEvent) {
      console.log('🎟️ [ACCESS EVENT] Email de aprobación omitido - visita pre-aprobada de acceso/evento');
    }

    res.status(201).json(visit);
  } catch (error) {
    console.error('Create visit error:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Force register visit (ignorar alerta de lista negra)
router.post('/force-register', auth, async (req, res) => {
  try {
    console.log('📝 [FORCE REGISTER] Creating visit (blacklist ignored) - User:', req.user?.email);
    const { visitorName, visitorCompany, reason, hostId, scheduledDate, visitorEmail, visitorPhone } = req.body;

    // Validate required fields
    if (!visitorName || !reason || !hostId || !scheduledDate) {
      return res.status(400).json({ message: 'Todos los campos requeridos deben ser proporcionados' });
    }

    // Verify host exists and is active (allow host or admin)
    const host = await User.findById(hostId);
    if (!host || !host.isActive || !['host', 'admin'].includes(host.role)) {
      return res.status(400).json({ message: 'Host no válido' });
    }

    // Get company settings for auto-approval
    let company = null;
    let autoApproval = false;
    
    try {
      const companyId = req.user.companyId || host.companyId;
      if (companyId) {
        company = await Company.findOne({ companyId: companyId });
        autoApproval = company?.settings?.autoApproval || false;
      }
    } catch (error) {
      console.log('⚠️ Error fetching company settings:', error.message);
      autoApproval = false;
    }

    // Determinar estado inicial según configuración
    let initialStatus = 'pending';
    let checkInTime = null;

    if (autoApproval) {
      initialStatus = 'approved';
      if (company?.settings?.autoCheckIn) {
        initialStatus = 'checked-in';
        checkInTime = new Date();
      }
    }

    // Forzar aprobación automática cuando proviene de un acceso/evento
    if (req.body.visitType === 'access-code' || req.body.fromAccessEvent === true) {
      initialStatus = 'approved';
      checkInTime = null;
    }

    const visit = new Visit({
      visitorName,
      visitorCompany: visitorCompany || '',
      visitorPhoto: req.body.visitorPhoto,
      reason,
      destination: req.body.destination || 'SecurITI',
      host: hostId,
      scheduledDate: new Date(scheduledDate),
      companyId: req.user.companyId,
      visitorEmail,
      visitorPhone,
      status: initialStatus,
      checkInTime: checkInTime,
      visitType: req.body.visitType || 'spontaneous',
      accessCode: req.body.accessCode || null,
      expectedDuration: req.body.expectedDuration,
      notes: req.body.notes ? `${req.body.notes}\n[ALERTA: Registrado a pesar de estar en lista negra]` : '[ALERTA: Registrado a pesar de estar en lista negra]'
    });

    await visit.save();
    await visit.populate('host', 'firstName lastName email profileImage');

    // Continuar con la lógica normal (emails, eventos, etc.)
    if ((req.body.visitType === 'access-code' || req.body.fromAccessEvent === true) && initialStatus === 'approved') {
      try {
        const Access = require('../models/Access');
        const access = await Access.findOne({ accessCode: req.body.accessCode }).populate('creatorId', 'firstName lastName email');
        
        if (access && access.creatorId) {
          const guest = access.invitedUsers.find(u => 
            u.email === visitorEmail || u.phone === req.body.visitorPhone
          );
          
          if (guest && guest.addedViaPreRegistration === true) {
            await require('../services/emailService').sendGuestArrivedEmail({
              visitId: visit._id,
              creatorEmail: access.creatorId.email,
              creatorName: `${access.creatorId.firstName} ${access.creatorId.lastName}`,
              guestName: visitorName,
              guestEmail: visitorEmail || 'No proporcionado',
              guestCompany: visitorCompany || 'No proporcionado',
              guestPhoto: req.body.visitorPhoto,
              accessTitle: access.eventName,
              companyName: (company && company.name) || 'SecurITI',
              companyId: company?._id.toString() || null,
              companyLogo: company?.logo || null
            });
          }
        }
      } catch (emailError) {
        console.error('⚠️ Error enviando email de llegada:', emailError);
      }
    }

    if (initialStatus === 'checked-in') {
      await new VisitEvent({ visitId: visit._id, type: 'check-in' }).save();
    }

    const isAccessEvent = req.body.visitType === 'access-code' || req.body.fromAccessEvent === true;
    
    if (!autoApproval && !isAccessEvent) {
      const approval = Approval.createWithExpiry(visit._id, host._id, 48);
      await approval.save();

      const FE = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '');
      const approveUrl = `${FE}/api/visits/approve/${approval.token}`;
      const rejectUrl = `${FE}/api/visits/reject/${approval.token}`;
      await require('../services/emailService').sendApprovalRequestEmail({
        visitId: visit._id,
        hostEmail: host.email,
        hostName: `${host.firstName} ${host.lastName}`,
        companyName: (company && company.name) || 'SecurITI',
        companyId: company?._id.toString() || null,
        companyLogo: company?.logo || null,
        visitorName,
        visitorCompany,
        visitorPhoto: req.body.visitorPhoto,
        reason,
        scheduledDate,
        approveUrl,
        rejectUrl
      });
    }

    console.log('✅ [FORCE REGISTER] Visit created (blacklist ignored)');
    res.status(201).json(visit);
  } catch (error) {
    console.error('Force register visit error:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Self-register visit (public endpoint)
router.post('/register', async (req, res) => {
  try {
    const { visitorName, visitorCompany, reason, hostId, visitorPhoto, visitorEmail, visitorPhone } = req.body;

    // Validate required fields
    if (!visitorName || !reason || !hostId) {
      return res.status(400).json({ message: 'Todos los campos requeridos deben ser proporcionados' });
    }

    // Verify host exists and is active (allow host or admin)
    const host = await User.findById(hostId);
    if (!host || !host.isActive || !['host', 'admin'].includes(host.role)) {
      return res.status(400).json({ message: 'Host no válido' });
    }

    // Get company settings for auto-approval and auto-checkin
    let company = null;
    let autoApproval = false;
    let autoCheckIn = false;
    
    try {
      // Buscar company por companyId (string), no por _id
      if (host.companyId) {
        company = await Company.findOne({ companyId: host.companyId });
        autoApproval = company?.settings?.autoApproval || false;
        autoCheckIn = company?.settings?.autoCheckIn || false;
        console.log('✅ [SELF-REGISTER] Company found:', { companyId: host.companyId, autoApproval, autoCheckIn });
      }
    } catch (error) {
      console.log('⚠️ Error fetching company settings for self-register:', error.message);
    }

    // Determinar estado inicial
    let initialStatus = 'pending';
    let checkInTime = null;
    
    if (autoApproval) {
      initialStatus = 'approved';
      if (autoCheckIn) {
        initialStatus = 'checked-in';
        checkInTime = new Date();
        console.log('🔄 [SELF-REGISTER] Auto check-in enabled, visit created as checked-in');
      }
    }

    const visit = new Visit({
      visitorName,
      visitorCompany: visitorCompany || '',
      reason,
      destination: req.body.destination || 'SecurITI',
      host: hostId,
      scheduledDate: new Date(), // Current date for self-registration
      companyId: host.companyId,
      visitorPhoto,
      visitorEmail,
      visitorPhone,
      status: initialStatus,
      checkInTime: checkInTime,
      qrToken: autoApproval ? require('crypto').randomBytes(16).toString('hex') : null,
      approvedAt: autoApproval ? new Date() : null
    });

    await visit.save();
    await visit.populate('host', 'firstName lastName email profileImage');

    // Si se hizo auto check-in, crear evento
    if (initialStatus === 'checked-in') {
      await new VisitEvent({ visitId: visit._id, type: 'check-in' }).save();
      console.log('✅ [SELF-REGISTER] Auto check-in event created');
    }

    // Create approval token and email host only if not auto-approved
    if (!autoApproval) {
      const approval = Approval.createWithExpiry(visit._id, host._id, 48);
      await approval.save();
      const FE = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '');
      const approveUrl = `${FE}/api/visits/approve/${approval.token}`;
      const rejectUrl = `${FE}/api/visits/reject/${approval.token}`;
      await require('../services/emailService').sendApprovalRequestEmail({
        visitId: visit._id, // ✅ Agregar visitId para generar URL temporal de foto
        hostEmail: host.email,
        hostName: `${host.firstName} ${host.lastName}`,
        companyName: company?.name || 'SecurITI',
        companyId: company?._id.toString() || null,
        companyLogo: company?.logo || null,
        visitorName,
        visitorCompany,
        visitorPhoto,
        reason,
        scheduledDate: new Date(),
        approveUrl,
        rejectUrl
      });
    }

    res.status(201).json(visit);
  } catch (error) {
    console.error('Self register visit error:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Update visit status
router.put('/:id/status', auth, async (req, res) => {
  try {
    const { status, reason } = req.body;
    const id = req.params.id;
    const allowedStatuses = ['pending', 'approved', 'checked-in', 'completed', 'rejected', 'cancelled'];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ message: 'Estado no válido. Estados permitidos: ' + allowedStatuses.join(', ') });
    }

    const visit = await Visit.findById(id).populate('host', 'firstName lastName email');
    if (!visit) {
      return res.status(404).json({ message: 'Visita no encontrada' });
    }

    // Get company settings for logo
    let company = null;
    try {
      if (req.user.companyId) {
        company = await Company.findOne({ companyId: req.user.companyId });
      }
    } catch (error) {
      console.log('⚠️ Error fetching company for email:', error.message);
    }

    // Solo anfitrión o admin pueden modificar el estado
    if (
      req.user.role === 'host' && visit.host._id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: 'No tienes permisos para modificar esta visita' });
    }

    const previousStatus = visit.status;

    // Validar transiciones de estado
    const validTransitions = {
      'pending': ['approved', 'rejected', 'cancelled'],
      'approved': ['checked-in', 'cancelled'],
      'checked-in': ['completed'],
      'completed': [],
      'rejected': [],
      'cancelled': [],
    };

      // No permitir cambiar de 'approved' a 'rejected'
      if (previousStatus === 'approved' && status === 'rejected') {
        return res.status(400).json({ message: `No se puede rechazar una visita que ya fue aprobada.` });
      }
      if (!validTransitions[previousStatus].includes(status)) {
        return res.status(400).json({ message: `Transición de estado no permitida: ${previousStatus} → ${status}` });
      }

    // Actualizar timestamps y qrToken según el estado
    const updateData = { status };
    if (status === 'rejected' && reason) {
      updateData.rejectionReason = reason;
      updateData.rejectedAt = new Date();
    }
    let eventType = null;
    if (status === 'approved' && !visit.qrToken) {
      // Generar qrToken único
      updateData.qrToken = require('crypto').randomBytes(16).toString('hex');
      updateData.approvedAt = new Date();
      
      // Verificar si auto check-in está habilitado
      try {
        const hostWithCompany = await User.findById(visit.host._id);
        if (hostWithCompany && hostWithCompany.companyId) {
          const companySettings = await Company.findOne({ companyId: hostWithCompany.companyId });
          if (companySettings?.settings?.autoCheckIn) {
            console.log('🔄 Auto check-in enabled, checking in visit automatically');
            updateData.status = 'checked-in';
            updateData.checkInTime = new Date();
            eventType = 'check-in';
          }
        }
      } catch (autoCheckInError) {
        console.warn('⚠️ Error checking auto check-in settings:', autoCheckInError?.message);
        // Continue with normal approval if auto check-in fails
      }
    }
    if (status === 'checked-in') {
      updateData.checkInTime = new Date();
      eventType = 'check-in';
    }
    if (status === 'completed') {
      updateData.checkOutTime = new Date();
      updateData.qrToken = null; // invalidar QR tras check-out
      eventType = 'check-out';
    }

    const updated = await Visit.findByIdAndUpdate(id, updateData, { new: true });

    // Registrar evento si aplica
    if (eventType) {
      await new VisitEvent({ visitId: updated._id, type: eventType }).save();
    }

    // 📧 Enviar sendGuestCheckedInEmail si es check-in de acceso/evento (NO pre-registro)
    if (status === 'checked-in' && (updated.accessId || updated.visitType === 'access-code' || updated.accessCode)) {
      try {
        const Access = require('../models/Access');
        // Buscar por accessId si existe, sino por accessCode
        const access = updated.accessId 
          ? await Access.findById(updated.accessId).populate('creatorId', 'firstName lastName email')
          : await Access.findOne({ accessCode: updated.accessCode }).populate('creatorId', 'firstName lastName email');
        
        if (access && access.creatorId?.email) {
          // Buscar el invitado en la lista para verificar si fue pre-registrado
          const guest = access.invitedUsers.find(u => 
            u.email === updated.visitorEmail || u.phone === updated.visitorPhone
          );
          
          // Solo enviar si NO fue agregado via pre-registro (manual o editado)
          if (guest && !guest.addedViaPreRegistration && access.settings?.sendAccessByEmail !== false) {
            console.log('📧 [VISIT CHECK-IN] Enviando sendGuestCheckedInEmail (invitado directo pasó a Dentro)', {
              visitId: updated._id.toString(),
              accessId: access._id.toString(),
              guestName: updated.visitorName,
              creatorEmail: access.creatorId.email
            });
            
            await emailService.sendGuestCheckedInEmail({
              creatorEmail: access.creatorId.email,
              creatorName: `${access.creatorId.firstName} ${access.creatorId.lastName}`,
              guestName: updated.visitorName,
              guestEmail: updated.visitorEmail || null,
              guestCompany: updated.visitorCompany || null,
              guestPhoto: updated.visitorPhoto || null,
              visitId: updated._id.toString(),
              accessTitle: access.eventName,
              checkInTime: updated.checkInTime,
              location: access.location,
              eventImage: access.eventImage || null,
              accessId: access._id.toString(),
              companyName: company?.name || 'Empresa',
              companyId: company?._id.toString() || null,
              companyLogo: company?.logo || null
            });
            
            console.log('✅ [VISIT CHECK-IN] sendGuestCheckedInEmail enviado exitosamente');
          } else {
            console.log('ℹ️ [VISIT CHECK-IN] Omitido sendGuestCheckedInEmail:', {
              reason: !guest ? 'invitado no encontrado en access' : 
                      guest.addedViaPreRegistration ? 'pre-registro público' : 
                      'emails deshabilitados',
              visitId: updated._id.toString()
            });
          }
        } else {
          console.log('⚠️ [VISIT CHECK-IN] No se encontró acceso o creador sin email');
        }
      } catch (emailError) {
        console.error('❌ [VISIT CHECK-IN] Error enviando sendGuestCheckedInEmail:', emailError.message);
      }
    }

    // Enviar notificaciones al visitante cuando corresponda
    // Aprobada: siempre envía. Rechazada: solo si viene con razón (para cumplir flujo de "respuesta recibida").
    const hasRejectReasonNow = Boolean(reason || updated.rejectionReason);
    if (((status === 'approved') || (status === 'rejected' && hasRejectReasonNow)) && updated.visitorEmail) {
      console.log(`📧 [UPDATE-STATUS] Sending ${status} notification to:`, updated.visitorEmail, 'for visit:', updated._id.toString());
      const populated = await Visit.findById(updated._id).populate('host', 'firstName lastName');
      try {
        await require('../services/emailService').sendVisitorNotificationEmail({
          visitId: updated._id.toString(),
          visitorEmail: populated.visitorEmail,
          visitorName: populated.visitorName,
          visitorCompany: populated.visitorCompany,
          hostName: `${populated.host.firstName} ${populated.host.lastName}`,
          hostId: populated.host._id.toString(),
          companyName: company?.name || 'SecurITI',
          companyId: company?._id.toString() || null,
          companyLogo: company?.logo || null,
          status,
          reason: populated.reason,
          scheduledDate: populated.scheduledDate,
          destination: populated.destination,
          qrToken: populated.qrToken,
          rejectionReason: populated.rejectionReason
        });
        console.log(`✅ [UPDATE-STATUS] Successfully sent ${status} email for visit:`, updated._id.toString());
      } catch (mailErr) {
        console.warn('❌ [UPDATE-STATUS] Error sending email:', mailErr?.message || mailErr);
      }
    }

  res.json(updated);
  } catch (error) {
    console.error('Update visit status error:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Check-out vía QR (fuera del handler de estado)
router.post('/scan-qr', auth, async (req, res) => {
  try {
    const { qrToken } = req.body;
    if (!qrToken) return res.status(400).json({ message: 'QR no proporcionado' });
    const visit = await Visit.findOne({ qrToken });
    if (!visit) return res.status(404).json({ message: 'QR inválido o visita no encontrada' });
    if (visit.status !== 'checked-in') {
      return res.status(400).json({ message: 'La visita no está dentro o ya fue finalizada' });
    }
    if (!visit.qrToken) {
      return res.status(400).json({ message: 'El QR ya fue usado para check-out' });
    }
    // Realizar check-out
    visit.status = 'completed';
    visit.checkOutTime = new Date();
    visit.qrToken = null;
    await visit.save();
    await new VisitEvent({ visitId: visit._id, type: 'check-out-qr' }).save();
    res.json({ message: 'Check-out realizado correctamente', visit });
  } catch (e) {
    console.error('Scan QR error:', e);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Update visit details
router.put('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Remove fields that shouldn't be updated
    delete updates._id;
    delete updates.host;
    delete updates.companyId;

    const visit = await Visit.findById(id);
    if (!visit) {
      return res.status(404).json({ message: 'Visita no encontrada' });
    }

    // Get company settings for logo
    let company = null;
    try {
      if (req.user.companyId) {
        company = await Company.findOne({ companyId: req.user.companyId });
      }
    } catch (error) {
      console.log('⚠️ Error fetching company for email:', error.message);
    }

    // Check permissions
    if (req.user.role === 'host' && visit.host.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'No tienes permisos para modificar esta visita' });
    }

  // Guardar el estado anterior para verificar si hubo cambio
  const previousStatus = visit.status;
  const previousRejectionReason = visit.rejectionReason;

    const updatedVisit = await Visit.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    ).populate('host', 'firstName lastName email profileImage');

    // Enviar email de rechazo cuando se asigna una razón por primera vez
    // Caso 1: Se cambia a rechazado con razón (previousStatus puede ser 'pending')
    // Caso 2: Ya estaba rechazado (por token), y ahora se agrega la razón (previousRejectionReason era null)
    if (
      updates.rejectionReason &&
      updatedVisit.status === 'rejected' &&
      !previousRejectionReason &&
      updatedVisit.visitorEmail
    ) {
      try {
        await require('../services/emailService').sendVisitorNotificationEmail({
          visitId: updatedVisit._id.toString(),
          visitorEmail: updatedVisit.visitorEmail,
          visitorName: updatedVisit.visitorName,
          hostName: `${updatedVisit.host.firstName} ${updatedVisit.host.lastName}`,
          companyName: company?.name || 'SecurITI',
          companyId: company?._id.toString() || null,
          companyLogo: company?.logo || null,
          status: 'rejected',
          reason: updatedVisit.reason,
          scheduledDate: updatedVisit.scheduledDate,
          destination: updatedVisit.destination || 'SecurITI',
          rejectionReason: updatedVisit.rejectionReason
        });
        console.log('✅ Email de rechazo enviado con razón:', updatedVisit.rejectionReason);
      } catch (emailError) {
        console.warn('⚠️ Error enviando email de rechazo:', emailError?.message || emailError);
      }
    }

    res.json(updatedVisit);
  } catch (error) {
    console.error('Update visit error:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Delete visit
router.delete('/:id', auth, authorize('admin', 'reception'), async (req, res) => {
  try {
    const visit = await Visit.findByIdAndDelete(req.params.id);
    
    if (!visit) {
      return res.status(404).json({ message: 'Visita no encontrada' });
    }

    res.json({ message: 'Visita eliminada exitosamente' });
  } catch (error) {
    console.error('Delete visit error:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// ========================================
// 🖼️ ENDPOINT TEMPORAL PARA FOTOS DE VISITANTES
// ========================================
/**
 * GET /api/visits/visitor-photo/:visitId/:token
 * Endpoint público para servir fotos de visitantes con token temporal
 * - Valida token JWT (expira en 30 días)
 * - Convierte Base64 a imagen
 * - Cache de 7 días para optimización
 */
router.get('/visitor-photo/:visitId/:token', async (req, res) => {
  try {
    const { visitId, token } = req.params;
    
    // Validar token JWT
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      console.log('⚠️ Token JWT inválido o expirado:', error.message);
      return res.status(403).send('Token inválido o expirado');
    }
    
    // Verificar que el token corresponde a esta visita
    if (decoded.visitId !== visitId || decoded.type !== 'visitor-photo') {
      console.log('⚠️ Token no corresponde a esta visita');
      return res.status(403).send('Token inválido para esta visita');
    }
    
    // Buscar la visita en la base de datos
    const visit = await Visit.findById(visitId);
    if (!visit) {
      console.log('⚠️ Visita no encontrada:', visitId);
      return res.status(404).send('Visita no encontrada');
    }
    
    // Verificar que tiene foto
    if (!visit.visitorPhoto) {
      console.log('⚠️ Visita sin foto:', visitId);
      return res.status(404).send('Foto no disponible');
    }
    
    // Convertir Base64 a Buffer
    const base64Data = visit.visitorPhoto.replace(/^data:image\/\w+;base64,/, '');
    const imageBuffer = Buffer.from(base64Data, 'base64');
    
    // Detectar tipo de imagen del Base64 original
    let contentType = 'image/jpeg'; // default
    const base64Match = visit.visitorPhoto.match(/^data:image\/(\w+);base64,/);
    if (base64Match) {
      contentType = `image/${base64Match[1]}`;
    }
    
    // Enviar imagen con headers de cache
    res.set({
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=604800', // Cache 7 días
      'Content-Length': imageBuffer.length
    });
    
    console.log(`✅ Foto servida exitosamente para visita ${visitId}`);
    res.send(imageBuffer);
    
  } catch (error) {
    console.error('❌ Error al servir foto de visitante:', error);
    res.status(500).send('Error al cargar la foto');
  }
});

// Additional endpoints

// Get visit status by id (mapped)
// Assign/Update access resource for a visit
router.put('/:id/access', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { accessId } = req.body;

    const visit = await Visit.findById(id);
    if (!visit) return res.status(404).json({ message: 'Visita no encontrada' });

    // Permissions: host can only edit their own visits; admin/reception allowed
    if (req.user.role === 'host' && visit.host.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'No tienes permisos para modificar esta visita' });
    }

    // Optionally validate Access exists
    if (accessId) {
      if (!mongoose.Types.ObjectId.isValid(accessId)) {
        return res.status(400).json({ message: 'accessId inválido' });
      }
      // Not strictly required to fetch Access, but we could ensure it belongs to same company
      // const Access = require('../models/Access');
      // const access = await Access.findById(accessId);
      // if (!access) return res.status(404).json({ message: 'Recurso de acceso no encontrado' });
    }

    visit.accessId = accessId || null;
    await visit.save();
    const populated = await Visit.findById(visit._id).populate('host', 'firstName lastName email profileImage');
    res.json(populated);
  } catch (error) {
    console.error('Update visit access error:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});
router.get('/status/:id', auth, async (req, res) => {
  try {
    const visit = await Visit.findById(req.params.id);
    if (!visit) return res.status(404).json({ message: 'Visita no encontrada' });
    const estados = {
      PENDIENTE: 'en_espera',
      APROBADO: 'respuesta_recibida',
      RECHAZADO: 'respuesta_recibida',
      DENTRO: 'dentro',
      COMPLETADO: 'completado'
    };
    let mapped;
    switch (visit.status) {
      case 'pending': mapped = estados.PENDIENTE; break;
      case 'approved': mapped = estados.APROBADO; break;
      case 'rejected': mapped = estados.RECHAZADO; break;
      case 'checked-in': mapped = estados.DENTRO; break;
      case 'completed': mapped = estados.COMPLETADO; break;
      default: mapped = 'en_espera';
    }
    res.json({ status: visit.status, mapped });
  } catch (e) {
    console.error('Get status error:', e);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Approve/reject by token from email and redirect
router.get('/approve/:token', async (req, res) => {
  try {
    const approval = await Approval.findOne({ token: req.params.token });
    if (!approval || approval.status !== 'pending') return res.status(400).send('Token inválido o ya utilizado');
    if (approval.isExpired()) return res.status(400).send('El enlace de aprobación ha expirado');
    
    const visit = await Visit.findById(approval.visitId).populate('host');
    if (!visit) return res.status(404).send('Visita no encontrada');
    
    visit.status = 'approved';
    visit.approvedAt = new Date();
    if (!visit.qrToken) {
      visit.qrToken = require('crypto').randomBytes(16).toString('hex');
    }
    
    // Verificar si auto check-in está habilitado
    let companySettings = null;
    try {
      const hostUser = await User.findById(visit.host._id);
      if (hostUser && hostUser.companyId) {
        companySettings = await Company.findOne({ companyId: hostUser.companyId });
        if (companySettings?.settings?.autoCheckIn) {
          console.log('🔄 [APPROVE-TOKEN] Auto check-in enabled, checking in visit automatically');
          visit.status = 'checked-in';
          visit.checkInTime = new Date();
          await new VisitEvent({ visitId: visit._id, type: 'check-in' }).save();
        }
      }
    } catch (autoCheckInError) {
      console.warn('⚠️ [APPROVE-TOKEN] Error checking auto check-in settings:', autoCheckInError?.message);
    }
    
    await visit.save();
    approval.status = 'decided';
    approval.decision = 'approved';
    approval.decidedAt = new Date();
    await approval.save();
    
    // Send notification to visitor if email exists
    console.log('🔵 [APPROVE-TOKEN] Sending approval email for visit:', visit._id.toString());
    if (visit.visitorEmail) {
      await visit.populate('host', 'firstName lastName');
      try {
        await require('../services/emailService').sendVisitorNotificationEmail({
          visitId: visit._id.toString(),
          visitorEmail: visit.visitorEmail,
          visitorName: visit.visitorName,
          visitorCompany: visit.visitorCompany,
          hostName: `${visit.host.firstName} ${visit.host.lastName}`,
          hostId: visit.host._id.toString(),
          companyName: companySettings?.name || 'SecurITI',
          companyId: companySettings?.companyId || null,
          companyLogo: companySettings?.logo || null,
          status: 'approved',
          reason: visit.reason,
          scheduledDate: visit.scheduledDate,
          destination: visit.destination,
          qrToken: visit.qrToken
        });
        console.log('✅ [APPROVE-TOKEN] Email sent successfully');
      } catch (mailErr) {
        console.error('❌ [APPROVE-TOKEN] Email error:', mailErr?.message);
      }
    }
    
    const redirect = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/visit-confirmation?result=approved`;
    res.redirect(302, redirect);
  } catch (e) {
    console.error('Approve error:', e);
    res.status(500).send('Error interno');
  }
});

router.get('/reject/:token', async (req, res) => {
  try {
    const approval = await Approval.findOne({ token: req.params.token });
      if (!approval || approval.status !== 'pending') return res.status(400).send('Token inválido o ya utilizado');
      if (approval.isExpired()) return res.status(400).send('El enlace de aprobación ha expirado');
    
    const visit = await Visit.findById(approval.visitId);
    if (!visit) return res.status(404).send('Visita no encontrada');
    
    visit.status = 'rejected';
    visit.rejectedAt = new Date();
    await visit.save();
    approval.status = 'decided';
    approval.decision = 'rejected';
    approval.decidedAt = new Date();
    await approval.save();
    // No enviar correo aquí. El correo de rechazo se enviará cuando se asigne una razón desde el panel.
    const redirect = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/visit-confirmation?result=rejected`;
    res.redirect(302, redirect);
  } catch (e) {
    console.error('Reject error:', e);
    res.status(500).send('Error interno');
  }
});

// Check-in
router.post('/checkin/:id', auth, async (req, res) => {
  try {
    const { assignedResource } = req.body;
    const visit = await Visit.findById(req.params.id).populate('host', 'firstName lastName');
    if (!visit) return res.status(404).json({ message: 'Visita no encontrada' });
    
    visit.status = 'checked-in';
    visit.checkInTime = new Date();
    if (assignedResource) {
      visit.assignedResource = assignedResource;
    }
    await visit.save();
    await new VisitEvent({ visitId: visit._id, type: 'check-in' }).save();
    
    // Si la visita proviene de un acceso/evento, actualizar la asistencia del invitado
    if (visit.visitType === 'access-code' && visit.accessCode) {
      try {
        const Access = require('../models/Access');
        const access = await Access.findOne({ accessCode: visit.accessCode }).populate('creatorId', 'firstName lastName email');
        
        console.log(`🔍 [CHECK-IN] Buscando acceso con código: ${visit.accessCode}`);
        console.log(`🔍 [CHECK-IN] Email del visitante: ${visit.visitorEmail}`);
        
        if (access) {
          console.log(`✅ [CHECK-IN] Acceso encontrado: ${access.eventName}`);
          console.log(`📋 [CHECK-IN] Total de invitados: ${access.invitedUsers.length}`);
          
          // Buscar el invitado por email
          const invitedUser = access.invitedUsers.find(user => {
            console.log(`  🔎 Comparando: "${user.email}" === "${visit.visitorEmail}"`);
            return user.email === visit.visitorEmail;
          });
          
          if (invitedUser) {
            console.log(`✅ [CHECK-IN] Invitado encontrado: ${invitedUser.name}`);
            console.log(`📊 [CHECK-IN] Estado anterior: ${invitedUser.attendanceStatus}`);
            
            invitedUser.attendanceStatus = 'asistio';
            invitedUser.checkInTime = visit.checkInTime;
            await access.save();
            
            console.log(`✅ [CHECK-IN] Asistencia actualizada a "asistio" para ${visit.visitorName} en acceso ${access.eventName}`);
            
            // 📧 Enviar sendGuestCheckedInEmail al creador si NO fue pre-registrado
            if (!invitedUser.addedViaPreRegistration && access.settings?.sendAccessByEmail !== false && access.creatorId?.email) {
              try {
                const Company = require('../models/Company');
                const company = await Company.findOne({ companyId: access.companyId });
                
                console.log('📧 [CHECK-IN] Enviando sendGuestCheckedInEmail al creador', {
                  creatorEmail: access.creatorId.email,
                  guestName: visit.visitorName,
                  accessTitle: access.eventName
                });
                
                await emailService.sendGuestCheckedInEmail({
                  creatorEmail: access.creatorId.email,
                  creatorName: `${access.creatorId.firstName} ${access.creatorId.lastName}`,
                  guestName: visit.visitorName,
                  guestEmail: visit.visitorEmail || null,
                  guestCompany: visit.visitorCompany || null,
                  guestPhoto: visit.visitorPhoto || null,
                  visitId: visit._id.toString(),
                  accessTitle: access.eventName,
                  checkInTime: visit.checkInTime,
                  location: access.location,
                  eventImage: access.eventImage || null,
                  accessId: access._id.toString(),
                  companyName: company?.name || 'Empresa',
                  companyId: company?._id.toString() || null,
                  companyLogo: company?.logo || null
                });
                
                console.log('✅ [CHECK-IN] sendGuestCheckedInEmail enviado exitosamente');
              } catch (emailError) {
                console.error('❌ [CHECK-IN] Error enviando sendGuestCheckedInEmail:', emailError.message);
              }
            } else {
              console.log('ℹ️ [CHECK-IN] Omitido sendGuestCheckedInEmail:', {
                reason: invitedUser.addedViaPreRegistration ? 'pre-registro público' : 
                        !access.settings?.sendAccessByEmail ? 'emails deshabilitados' :
                        !access.creatorId?.email ? 'sin email de creador' : 'desconocido'
              });
            }
          } else {
            console.warn(`⚠️ [CHECK-IN] No se encontró invitado con email ${visit.visitorEmail} en el acceso`);
            console.warn(`📋 [CHECK-IN] Emails en la lista:`, access.invitedUsers.map(u => u.email));
          }
        } else {
          console.warn(`⚠️ [CHECK-IN] No se encontró acceso con código ${visit.accessCode}`);
        }
      } catch (accessError) {
        console.error('⚠️ [CHECK-IN] Error actualizando asistencia en acceso:', accessError);
        // No bloqueamos el check-in si falla la actualización del acceso
      }
    }
    
    res.json(visit);
  } catch (e) {
    console.error('Check-in error:', e);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Check-out with up to 5 photos
router.post('/checkout/:id', auth, async (req, res) => {
  try {
    const { photos } = req.body; // array of base64 strings
    const visit = await Visit.findById(req.params.id).populate('host', 'firstName lastName');
    if (!visit) return res.status(404).json({ message: 'Visita no encontrada' });
    // Validar que la visita esté dentro antes de poder registrar la salida
    if (visit.status !== 'checked-in') {
      return res.status(400).json({ message: 'La visita no está dentro o ya fue finalizada' });
    }

    // Get company settings for logo
    let company = null;
    try {
      if (req.user.companyId) {
        company = await Company.findOne({ companyId: req.user.companyId });
      }
    } catch (error) {
      console.log('⚠️ Error fetching company for email:', error.message);
    }

    visit.status = 'completed';
    visit.checkOutTime = new Date();
    await visit.save();
    const limitedPhotos = Array.isArray(photos) ? photos.slice(0, 5) : [];
    await new VisitEvent({ visitId: visit._id, type: 'check-out', photos: limitedPhotos }).save();
    const elapsedMs = visit.checkInTime ? (visit.checkOutTime - visit.checkInTime) : null;
    
    // Enviar email de despedida al visitante
    if (visit.visitorEmail) {
      try {
        await require('../services/emailService').sendCheckoutEmail({
          visitorEmail: visit.visitorEmail,
          visitorName: visit.visitorName,
          visitorCompany: visit.visitorCompany || 'N/A',
          hostName: `${visit.host.firstName} ${visit.host.lastName}`,
          companyName: company?.name || 'SecurITI',
          companyId: company?._id.toString() || null,
          companyLogo: company?.logo || null,
          registrationTime: visit.createdAt, // Hora de registro
          checkInTime: visit.checkInTime, // Hora de entrada física
          checkOutTime: visit.checkOutTime // Hora de salida
        });
      } catch (mailErr) {
        console.warn('Email checkout error:', mailErr?.message || mailErr);
      }
    }
    res.json({ visit, elapsedMs });
  } catch (e) {
    console.error('Check-out error:', e);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

module.exports = router;
